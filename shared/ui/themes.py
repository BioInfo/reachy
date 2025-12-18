"""
Gradio themes and styling for Reachy Mini apps.
"""

import gradio as gr


REACHY_THEME = gr.themes.Soft(
    primary_hue="blue",
    secondary_hue="orange",
    neutral_hue="slate",
    font=gr.themes.GoogleFont("Inter"),
    font_mono=gr.themes.GoogleFont("JetBrains Mono"),
).set(
    body_background_fill="*neutral_50",
    block_background_fill="white",
    block_border_width="1px",
    block_border_color="*neutral_200",
    block_shadow="0 1px 3px rgba(0,0,0,0.1)",
    button_primary_background_fill="*primary_500",
    button_primary_background_fill_hover="*primary_600",
)


def apply_theme(demo: gr.Blocks) -> gr.Blocks:
    """Apply Reachy Mini theme to a Gradio Blocks demo."""
    demo.theme = REACHY_THEME
    return demo


# Custom CSS for Reachy Mini apps
REACHY_CSS = """
.reachy-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.reachy-header h1 {
    margin: 0;
    font-size: 28px;
}

.reachy-header p {
    margin: 5px 0 0 0;
    opacity: 0.9;
}

.focus-active {
    border: 3px solid #4CAF50 !important;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

.distracted {
    border: 3px solid #FF9800 !important;
}

.timer-large {
    font-size: 96px !important;
    font-weight: bold;
    font-family: 'JetBrains Mono', monospace;
}
"""
