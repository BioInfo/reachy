"""
Memory Manager

Orchestrates memory subsystems and builds context for conversations.
"""

import logging
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

from .storage import MemoryStorage, UserFact, ConversationSession, ConversationMessage

logger = logging.getLogger(__name__)


class MemoryManager:
    """
    Orchestrates Echo's memory systems.

    Responsibilities:
    - Store and retrieve user facts
    - Manage conversation sessions
    - Build context for LLM from relevant memories
    - Extract facts from conversations
    """

    def __init__(self, data_path: Optional[Path] = None):
        self.storage = MemoryStorage(data_path)
        self.current_session: Optional[ConversationSession] = None
        self._session_id: Optional[str] = None

    def start_session(self) -> str:
        """Start a new conversation session."""
        self._session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        self.current_session = self.storage.start_session(self._session_id)
        logger.info(f"Started memory session: {self._session_id}")
        return self._session_id

    def end_session(self, summary: Optional[str] = None) -> None:
        """End the current conversation session."""
        if self._session_id:
            # Auto-extract topics from messages if not provided
            messages = self.storage.get_session_messages(self._session_id)
            topics = self._extract_topics(messages)

            self.storage.end_session(
                self._session_id,
                summary=summary,
                topics=topics,
            )
            logger.info(f"Ended memory session: {self._session_id}")

            self._session_id = None
            self.current_session = None

    def add_message(self, role: str, content: str) -> None:
        """Add a message to current session and extract facts."""
        if not self._session_id:
            self.start_session()

        self.storage.add_message(self._session_id, role, content)

        # Extract and save any facts from user messages
        if role == "user":
            self._extract_and_save_facts(content)

    def _extract_and_save_facts(self, content: str) -> None:
        """Extract potential facts from user message."""
        content_lower = content.lower()

        # Simple pattern matching for common facts
        # In production, use LLM for better extraction

        # Name extraction
        name_patterns = [
            r"(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+)",
            r"(?:this is)\s+([A-Z][a-z]+)\s+speaking",
        ]
        for pattern in name_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                self.remember_fact("personal", "name", name)
                break

        # Preference extraction
        pref_patterns = [
            (r"i (?:prefer|like|love)\s+(.+?)(?:\.|$)", "preference", "likes"),
            (r"i (?:don't like|hate|dislike)\s+(.+?)(?:\.|$)", "preference", "dislikes"),
            (r"my favorite (\w+) is\s+(.+?)(?:\.|$)", "preference", None),  # dynamic key
        ]
        for pattern, category, key in pref_patterns:
            match = re.search(pattern, content_lower)
            if match:
                if key:
                    value = match.group(1).strip()
                    self.remember_fact(category, key, value)
                else:
                    # Dynamic key from pattern
                    thing = match.group(1).strip()
                    value = match.group(2).strip()
                    self.remember_fact(category, f"favorite_{thing}", value)

        # Work-related
        work_patterns = [
            (r"i work (?:at|for)\s+(.+?)(?:\.|$)", "work", "employer"),
            (r"i'm a\s+(.+?)(?:\.|$)", "work", "role"),
            (r"my job is\s+(.+?)(?:\.|$)", "work", "role"),
        ]
        for pattern, category, key in work_patterns:
            match = re.search(pattern, content_lower)
            if match:
                value = match.group(1).strip()
                self.remember_fact(category, key, value)

    def _extract_topics(self, messages: List[ConversationMessage]) -> List[str]:
        """Extract conversation topics from messages."""
        # Simple keyword extraction
        # In production, use LLM for better topic extraction
        topics = set()

        keywords = {
            "coding": ["code", "programming", "debug", "function", "class"],
            "work": ["meeting", "deadline", "project", "task"],
            "personal": ["family", "weekend", "vacation", "hobby"],
            "technical": ["api", "server", "database", "error"],
            "planning": ["plan", "schedule", "tomorrow", "next week"],
        }

        all_content = " ".join(m.content.lower() for m in messages)

        for topic, words in keywords.items():
            if any(word in all_content for word in words):
                topics.add(topic)

        return list(topics)[:5]  # Max 5 topics

    # === Fact Management ===

    def remember_fact(
        self,
        category: str,
        key: str,
        value: str,
        confidence: float = 1.0,
    ) -> None:
        """Store a fact about the user."""
        fact = UserFact(
            id=f"{category}_{key}_{uuid.uuid4().hex[:8]}",
            category=category,
            key=key,
            value=value,
            confidence=confidence,
            source="conversation",
        )
        self.storage.save_fact(fact)
        logger.info(f"Remembered: {category}/{key} = {value}")

    def recall_fact(self, category: str, key: str) -> Optional[str]:
        """Recall a specific fact."""
        fact = self.storage.get_fact(category, key)
        return fact.value if fact else None

    def get_user_name(self) -> Optional[str]:
        """Get the user's name if known."""
        return self.recall_fact("personal", "name")

    def forget(self, category: str, key: str) -> bool:
        """Forget a specific fact (privacy feature)."""
        deleted = self.storage.delete_fact(category, key)
        if deleted:
            logger.info(f"Forgot: {category}/{key}")
        return deleted

    def forget_all(self) -> None:
        """Forget everything (full reset - privacy feature)."""
        self.storage.clear_all()
        self._session_id = None
        self.current_session = None
        logger.info("All memory cleared")

    # === Context Building ===

    def build_context(self) -> str:
        """
        Build context string for LLM from memories.

        Returns a formatted string to include in system prompt.
        """
        context_parts = []

        # User facts
        facts = self.storage.get_all_facts()
        if facts:
            context_parts.append("## What I know about you:")
            for fact in facts:
                context_parts.append(f"- {fact.key}: {fact.value}")

        # Recent session summaries
        recent_sessions = self.storage.get_recent_sessions(limit=3)
        if recent_sessions:
            summaries = [s for s in recent_sessions if s.summary]
            if summaries:
                context_parts.append("\n## Recent conversations:")
                for session in summaries[:3]:
                    date_str = session.started_at.strftime("%B %d")
                    context_parts.append(f"- {date_str}: {session.summary}")

        if not context_parts:
            return ""

        return "\n".join(context_parts)

    def get_greeting_context(self) -> Tuple[bool, str]:
        """
        Get context for greeting the user.

        Returns:
            Tuple of (has_greeted_today, context_string)
        """
        has_greeted = self.storage.has_greeted_today()
        name = self.get_user_name()

        context = ""
        if name:
            context = f"The user's name is {name}. "

        # Add any relevant recent context
        recent = self.storage.get_recent_sessions(limit=1)
        if recent and recent[0].summary:
            context += f"Last time you talked about: {recent[0].summary}"

        return has_greeted, context

    def mark_greeted(self) -> None:
        """Mark that we've greeted the user today."""
        self.storage.mark_greeted_today()

    def get_stats(self) -> dict:
        """Get memory statistics."""
        return self.storage.get_stats()
