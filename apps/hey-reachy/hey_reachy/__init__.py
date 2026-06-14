"""
Hey, Reachy — a voice companion for Reachy Mini.

Say "Hey, Reachy", talk, and the robot talks back: wake -> listen -> think ->
speak, with a calm head-nod while it speaks. The robot's reaction is the
product; a pluggable brain is the engine.
"""

__version__ = "2.0.0"
__author__ = "Justin Johnson"

from .app import ReachyMiniHeyReachy

__all__ = ["ReachyMiniHeyReachy"]
