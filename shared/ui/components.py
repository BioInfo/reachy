"""
Reusable Gradio components for Reachy Mini apps.
"""

import gradio as gr


def create_timer_display() -> gr.HTML:
    """Create a large timer display component."""
    return gr.HTML(
        value="""
        <div style="text-align: center; font-family: 'SF Mono', monospace;">
            <div style="font-size: 72px; font-weight: bold; color: #333;">
                25:00
            </div>
            <div style="font-size: 18px; color: #666; margin-top: 10px;">
                Ready to focus
            </div>
        </div>
        """,
        label="Timer"
    )


def create_status_panel() -> gr.HTML:
    """Create a status panel showing focus metrics."""
    return gr.HTML(
        value="""
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px;">
            <div style="text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #4CAF50;">0</div>
                <div style="font-size: 14px; color: #666;">Sessions Today</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #2196F3;">0%</div>
                <div style="font-size: 14px; color: #666;">Focus Score</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #FF9800;">0</div>
                <div style="font-size: 14px; color: #666;">Nudges</div>
            </div>
        </div>
        """,
        label="Today's Stats"
    )


def create_robot_status() -> gr.HTML:
    """Create a robot connection status indicator."""
    return gr.HTML(
        value="""
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #ccc;"></div>
            <span style="color: #666;">Robot: Disconnected</span>
        </div>
        """,
        label="Robot Status"
    )


def update_timer_html(minutes: int, seconds: int, status: str, color: str = "#333") -> str:
    """Generate timer HTML with current values."""
    return f"""
    <div style="text-align: center; font-family: 'SF Mono', monospace;">
        <div style="font-size: 72px; font-weight: bold; color: {color};">
            {minutes:02d}:{seconds:02d}
        </div>
        <div style="font-size: 18px; color: #666; margin-top: 10px;">
            {status}
        </div>
    </div>
    """


def update_stats_html(sessions: int, focus_score: float, nudges: int) -> str:
    """Generate stats panel HTML with current values."""
    score_color = "#4CAF50" if focus_score >= 80 else "#FF9800" if focus_score >= 50 else "#f44336"
    return f"""
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px;">
        <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #4CAF50;">{sessions}</div>
            <div style="font-size: 14px; color: #666;">Sessions Today</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: {score_color};">{focus_score:.0f}%</div>
            <div style="font-size: 14px; color: #666;">Focus Score</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #FF9800;">{nudges}</div>
            <div style="font-size: 14px; color: #666;">Nudges</div>
        </div>
    </div>
    """


def update_robot_status_html(connected: bool, mode: str = "idle") -> str:
    """Generate robot status HTML."""
    if connected:
        color = "#4CAF50"
        status = f"Connected - {mode.title()}"
    else:
        color = "#ccc"
        status = "Disconnected"

    return f"""
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: {color};"></div>
        <span style="color: #666;">Robot: {status}</span>
    </div>
    """
