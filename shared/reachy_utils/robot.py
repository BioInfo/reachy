"""
Robot connection management for Reachy Mini.
"""

import logging
from typing import Optional
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class ReachyConnection:
    """Manages connection to Reachy Mini robot."""

    def __init__(self, host: str = "localhost", port: int = 8000, simulation: bool = False):
        self.host = host
        self.port = port
        self.simulation = simulation
        self._robot = None
        self._use_mock = False

    def connect(self):
        """Establish connection to Reachy Mini daemon (always tries real connection)."""
        # Always try to connect to real daemon first
        try:
            from reachy_mini import ReachyMini
            # Use no-video backend to avoid camera timeout - we use laptop webcam instead
            self._robot = ReachyMini(media_backend='default_no_video')
            logger.info("Connected to Reachy Mini daemon!")
            self._use_mock = False
        except ImportError:
            logger.warning("reachy_mini not installed, using mock")
            self._robot = MockReachy()
            self._use_mock = True
        except Exception as e:
            logger.warning(f"Could not connect to daemon: {e}")
            logger.info("Falling back to mock robot")
            self._robot = MockReachy()
            self._use_mock = True
        return self._robot

    def disconnect(self):
        """Close connection to Reachy Mini."""
        if self._robot and hasattr(self._robot, '__exit__'):
            try:
                self._robot.__exit__(None, None, None)
            except:
                pass
        self._robot = None
        logger.info("Disconnected from Reachy Mini")

    @property
    def robot(self):
        """Get the robot instance."""
        if self._robot is None:
            self.connect()
        return self._robot

    @property
    def is_mock(self):
        """Check if using mock robot."""
        return self._use_mock


class MockReachy:
    """Mock Reachy Mini for development without hardware or simulator."""

    def __init__(self):
        logger.info("MockReachy initialized (no actual robot connection)")

    def goto_target(self, head=None, antennas=None, duration=0.5):
        """Mock goto_target."""
        if head is not None:
            logger.debug(f"Mock: Head target set")
        if antennas is not None:
            logger.debug(f"Mock: Antennas -> {antennas}")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


# Global robot instance
_robot_connection: Optional[ReachyConnection] = None


def get_robot(host: str = "localhost", simulation: bool = False) -> ReachyConnection:
    """Get or create a robot connection."""
    global _robot_connection
    if _robot_connection is None:
        _robot_connection = ReachyConnection(host=host, simulation=simulation)
        _robot_connection.connect()
    return _robot_connection


@contextmanager
def robot_session(host: str = "localhost", simulation: bool = False):
    """Context manager for robot sessions."""
    conn = ReachyConnection(host=host, simulation=simulation)
    try:
        conn.connect()
        yield conn.robot
    finally:
        conn.disconnect()
