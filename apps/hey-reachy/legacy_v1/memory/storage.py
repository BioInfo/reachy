"""
Memory Storage Backend

SQLite for structured data, LanceDB for vector embeddings.
"""

import json
import logging
import os
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Default data path
DEFAULT_DATA_PATH = Path(__file__).parent.parent.parent / "data"


@dataclass
class UserFact:
    """A fact about the user (semantic memory)."""

    id: str
    category: str  # preference, personal, work, schedule
    key: str
    value: str
    confidence: float = 1.0
    source: str = "conversation"
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class ConversationMessage:
    """A single message in a conversation."""

    role: str  # user, assistant
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ConversationSession:
    """A conversation session (episodic memory)."""

    id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    summary: Optional[str] = None
    messages: List[ConversationMessage] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    mood: Optional[str] = None


class MemoryStorage:
    """
    SQLite-based storage for Echo's memory.

    Handles:
    - User facts (preferences, personal info)
    - Conversation sessions
    - Interaction history
    """

    SCHEMA = """
    -- User facts (semantic memory)
    CREATE TABLE IF NOT EXISTS user_facts (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        source TEXT DEFAULT 'conversation',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key)
    );

    -- Conversation sessions (episodic memory)
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        summary TEXT,
        topics TEXT,  -- JSON array
        mood TEXT
    );

    -- Conversation messages
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    -- Daily interaction log
    CREATE TABLE IF NOT EXISTS daily_log (
        date TEXT PRIMARY KEY,
        first_seen TIMESTAMP,
        last_seen TIMESTAMP,
        session_count INTEGER DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        greeted_today INTEGER DEFAULT 0
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_facts_category ON user_facts(category);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(started_at);
    """

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = Path(data_path) if data_path else DEFAULT_DATA_PATH
        self.data_path.mkdir(parents=True, exist_ok=True)
        self.db_path = self.data_path / "memory.db"
        self._init_db()

    def _init_db(self) -> None:
        """Initialize database schema."""
        with self._get_connection() as conn:
            conn.executescript(self.SCHEMA)
            logger.info(f"Memory database initialized at {self.db_path}")

    @contextmanager
    def _get_connection(self):
        """Get database connection with proper cleanup."""
        conn = sqlite3.connect(self.db_path, detect_types=sqlite3.PARSE_DECLTYPES)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    # === User Facts ===

    def save_fact(self, fact: UserFact) -> None:
        """Save or update a user fact."""
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO user_facts (id, category, key, value, confidence, source, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(category, key) DO UPDATE SET
                    value = excluded.value,
                    confidence = excluded.confidence,
                    updated_at = excluded.updated_at
                """,
                (
                    fact.id,
                    fact.category,
                    fact.key,
                    fact.value,
                    fact.confidence,
                    fact.source,
                    fact.created_at,
                    fact.updated_at,
                ),
            )
        logger.debug(f"Saved fact: {fact.category}/{fact.key} = {fact.value}")

    def get_fact(self, category: str, key: str) -> Optional[UserFact]:
        """Get a specific fact."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM user_facts WHERE category = ? AND key = ?",
                (category, key),
            ).fetchone()

            if row:
                return UserFact(
                    id=row["id"],
                    category=row["category"],
                    key=row["key"],
                    value=row["value"],
                    confidence=row["confidence"],
                    source=row["source"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
        return None

    def get_facts_by_category(self, category: str) -> List[UserFact]:
        """Get all facts in a category."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM user_facts WHERE category = ? ORDER BY updated_at DESC",
                (category,),
            ).fetchall()

            return [
                UserFact(
                    id=row["id"],
                    category=row["category"],
                    key=row["key"],
                    value=row["value"],
                    confidence=row["confidence"],
                    source=row["source"],
                )
                for row in rows
            ]

    def get_all_facts(self) -> List[UserFact]:
        """Get all facts."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM user_facts ORDER BY category, key"
            ).fetchall()

            return [
                UserFact(
                    id=row["id"],
                    category=row["category"],
                    key=row["key"],
                    value=row["value"],
                    confidence=row["confidence"],
                    source=row["source"],
                )
                for row in rows
            ]

    def delete_fact(self, category: str, key: str) -> bool:
        """Delete a fact (for privacy/forget feature)."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM user_facts WHERE category = ? AND key = ?",
                (category, key),
            )
            return cursor.rowcount > 0

    # === Conversation Sessions ===

    def start_session(self, session_id: str) -> ConversationSession:
        """Start a new conversation session."""
        now = datetime.now()
        session = ConversationSession(id=session_id, started_at=now)

        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO sessions (id, started_at) VALUES (?, ?)",
                (session_id, now),
            )

        # Update daily log
        self._update_daily_log(now, new_session=True)

        logger.debug(f"Started session: {session_id}")
        return session

    def end_session(
        self,
        session_id: str,
        summary: Optional[str] = None,
        topics: Optional[List[str]] = None,
        mood: Optional[str] = None,
    ) -> None:
        """End a conversation session."""
        now = datetime.now()
        topics_json = json.dumps(topics) if topics else None

        with self._get_connection() as conn:
            conn.execute(
                """
                UPDATE sessions
                SET ended_at = ?, summary = ?, topics = ?, mood = ?
                WHERE id = ?
                """,
                (now, summary, topics_json, mood, session_id),
            )

        logger.debug(f"Ended session: {session_id}")

    def add_message(
        self, session_id: str, role: str, content: str
    ) -> None:
        """Add a message to a session."""
        now = datetime.now()

        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
                (session_id, role, content, now),
            )

        # Update daily log
        self._update_daily_log(now, new_message=True)

    def get_session_messages(self, session_id: str) -> List[ConversationMessage]:
        """Get all messages from a session."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT role, content, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp",
                (session_id,),
            ).fetchall()

            return [
                ConversationMessage(
                    role=row["role"],
                    content=row["content"],
                    timestamp=row["timestamp"],
                )
                for row in rows
            ]

    def get_recent_sessions(self, limit: int = 10) -> List[ConversationSession]:
        """Get recent conversation sessions."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?",
                (limit,),
            ).fetchall()

            sessions = []
            for row in rows:
                topics = json.loads(row["topics"]) if row["topics"] else []
                session = ConversationSession(
                    id=row["id"],
                    started_at=row["started_at"],
                    ended_at=row["ended_at"],
                    summary=row["summary"],
                    topics=topics,
                    mood=row["mood"],
                )
                sessions.append(session)

            return sessions

    # === Daily Log ===

    def _update_daily_log(
        self,
        timestamp: datetime,
        new_session: bool = False,
        new_message: bool = False,
    ) -> None:
        """Update daily interaction log."""
        date_str = timestamp.strftime("%Y-%m-%d")

        with self._get_connection() as conn:
            # Upsert daily log
            conn.execute(
                """
                INSERT INTO daily_log (date, first_seen, last_seen, session_count, total_messages)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(date) DO UPDATE SET
                    last_seen = excluded.last_seen,
                    session_count = daily_log.session_count + ?,
                    total_messages = daily_log.total_messages + ?
                """,
                (
                    date_str,
                    timestamp,
                    timestamp,
                    1 if new_session else 0,
                    1 if new_message else 0,
                    1 if new_session else 0,
                    1 if new_message else 0,
                ),
            )

    def has_greeted_today(self) -> bool:
        """Check if we've greeted the user today."""
        today = datetime.now().strftime("%Y-%m-%d")

        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT greeted_today FROM daily_log WHERE date = ?",
                (today,),
            ).fetchone()

            return bool(row and row["greeted_today"])

    def mark_greeted_today(self) -> None:
        """Mark that we've greeted the user today."""
        today = datetime.now().strftime("%Y-%m-%d")
        now = datetime.now()

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO daily_log (date, first_seen, last_seen, greeted_today)
                VALUES (?, ?, ?, 1)
                ON CONFLICT(date) DO UPDATE SET greeted_today = 1
                """,
                (today, now, now),
            )

    def get_stats(self) -> dict:
        """Get memory statistics."""
        with self._get_connection() as conn:
            facts_count = conn.execute("SELECT COUNT(*) FROM user_facts").fetchone()[0]
            sessions_count = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
            messages_count = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]

            return {
                "facts": facts_count,
                "sessions": sessions_count,
                "messages": messages_count,
                "db_path": str(self.db_path),
            }

    def clear_all(self) -> None:
        """Clear all user data (privacy feature)."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM user_facts")
            conn.execute("DELETE FROM messages")
            conn.execute("DELETE FROM sessions")
            conn.execute("DELETE FROM daily_log")
        logger.info("Cleared all memory data")
