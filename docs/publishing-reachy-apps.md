# Publishing Reachy Mini Apps to HuggingFace

Guide for converting apps to the ReachyMiniApp format and publishing to HuggingFace Spaces for inclusion in the Pollen Robotics ecosystem.

---

## Overview

Reachy Mini apps are Python packages that:
1. Inherit from `ReachyMiniApp`
2. Implement a `run(reachy_mini, stop_event)` method
3. Are published as HuggingFace Spaces
4. Can be installed directly from the Reachy Mini dashboard

**Important:** The HuggingFace Space is a *distribution point*, not a running app. The Space serves as:
- A landing page explaining what the app does
- A pip-installable package (`pip install git+https://huggingface.co/spaces/username/app`)

The actual app runs **locally** on your machine where the Reachy Mini robot/simulator is connected. Use `sdk: static` in the README frontmatter — not `sdk: gradio`.

---

## Quick Start

### 1. Create App Structure

```
my_reachy_app/
├── pyproject.toml              # Package metadata
├── README.md                   # HuggingFace Space description
├── index.html                  # Space landing page
├── style.css                   # Landing page styles
└── reachy_mini_my_app/
    ├── __init__.py
    ├── main.py                 # ReachyMiniApp class
    └── static/                 # (Optional) Web UI files
```

### 2. Implement ReachyMiniApp

```python
# reachy_mini_my_app/main.py
import threading
from reachy_mini import ReachyMini, ReachyMiniApp

class MyApp(ReachyMiniApp):
    # Optional: URL for custom web interface
    custom_app_url: str | None = "http://localhost:7860"

    def run(self, reachy_mini: ReachyMini, stop_event: threading.Event):
        """
        Main loop - called when app starts from dashboard.

        Args:
            reachy_mini: Pre-initialized robot connection
            stop_event: Check is_set() to exit gracefully
        """
        while not stop_event.is_set():
            # Your app logic here
            # Use reachy_mini.set_target() for movements
            time.sleep(0.05)
```

### 3. Create pyproject.toml

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "reachy_mini_my_app"
version = "0.1.0"
description = "My Reachy Mini App"
requires-python = ">=3.10"
dependencies = [
    "reachy-mini>=1.0.0",
    # Add your dependencies
]

[tool.setuptools.packages.find]
where = ["."]
include = ["reachy_mini_my_app*"]
```

### 4. Create README.md with HuggingFace Metadata

```markdown
---
title: My App
emoji: "🤖"
colorFrom: purple
colorTo: blue
sdk: static
pinned: false
license: mit
tags:
  - reachy-mini
---

# My App

Description of your app...
```

### 5. Create Landing Page (index.html)

Use the standard layout with:
- **Header**: Badge + title + tagline
- **Feature grid**: 6 cards (3x2 on desktop) with SVG icons, no emojis
- **Install section**: Numbered steps with code blocks
- **How it works**: 4-step workflow diagram
- **About section**: Brief description
- **Footer links**: runreachyrun.com | HuggingFace | @bioinfo | Reachy Mini

Reference implementation: `apps/focus-guardian-hf/index.html`

Design tokens (match runreachyrun.com):
```css
--bg-primary: #0d0d0f;
--accent-cyan: #00ffd5;
--accent-amber: #ffaa00;
--accent-purple: #667eea;
font-family: 'JetBrains Mono', monospace;  /* headings */
font-family: 'Inter', sans-serif;          /* body */
```

---

## Publishing to HuggingFace

### Method 1: Using huggingface_hub Python API

```python
from huggingface_hub import login, HfApi, create_repo, upload_folder

# Login (get token from https://huggingface.co/settings/tokens)
login(token="hf_YOUR_TOKEN", add_to_git_credential=True)

api = HfApi()
repo_id = "YourUsername/your-app-name"

# Create the space
create_repo(
    repo_id=repo_id,
    repo_type="space",
    space_sdk="gradio",
    private=False
)

# Upload files
api.upload_folder(
    folder_path="/path/to/your/app",
    repo_id=repo_id,
    repo_type="space",
    commit_message="Initial commit"
)

print(f"Published: https://huggingface.co/spaces/{repo_id}")
```

### Method 2: Using Git

```bash
# Clone the empty space
git clone https://huggingface.co/spaces/YourUsername/your-app-name
cd your-app-name

# Copy your files
cp -r /path/to/your/app/* .

# Push
git add .
git commit -m "Initial commit"
git push
```

### Method 3: Using reachy-mini-app-assistant (Official)

```bash
# Install
pip install reachy-mini

# Create from template
reachy-mini-app-assistant create

# Validate structure
reachy-mini-app-assistant check

# Publish
reachy-mini-app-assistant publish
```

---

## Submitting to Official App Store

To get your app listed in the official Reachy Mini dashboard:

```bash
reachy-mini-app-assistant publish --official
```

This creates a PR to the [pollen-robotics/reachy-mini-official-app-store](https://huggingface.co/datasets/pollen-robotics/reachy-mini-official-app-store) dataset.

**Requirements:**
- Space must be **public**
- Include clear description of functionality
- Follow the ReachyMiniApp pattern
- Handle `stop_event` for clean shutdown

---

## Key Differences from Standalone Apps

| Aspect | Standalone (Gradio) | ReachyMiniApp |
|--------|---------------------|---------------|
| Robot connection | You call `get_robot()` | Pre-initialized, passed to `run()` |
| Lifecycle | You manage start/stop | Dashboard manages via `stop_event` |
| UI | Full control | Via `custom_app_url` or static files |
| Distribution | Manual pip install | One-click from dashboard |

---

## Testing Locally

```bash
# Install your app in dev mode
pip install -e .

# Start the daemon
reachy-mini-daemon  # or with --sim for simulation

# Access dashboard
open http://localhost:8000

# Your app should appear in the Applications section
```

---

## Common Issues

### "Module not found" after install
- Check `[tool.setuptools.packages.find]` in pyproject.toml
- Ensure package directory matches the include pattern

### App doesn't appear in dashboard
- Verify the class inherits from `ReachyMiniApp`
- Check the package is properly installed (`pip list | grep your-app`)

### Animations don't work
- Remember: `reachy_mini` is already connected - don't create new connection
- Use `reachy_mini.set_target()` not `goto_target()` for immediate updates

### Gradio UI not loading
- Set `custom_app_url` to the correct port
- Ensure Gradio launches in a separate thread
- Use `quiet=True` to suppress Gradio startup logs

---

## Resources

- [Official Guide: Make and publish your Reachy Mini App](https://huggingface.co/blog/pollen-robotics/make-and-publish-your-reachy-mini-apps)
- [Reachy Mini SDK](https://github.com/pollen-robotics/reachy_mini)
- [Example Apps](https://github.com/pollen-robotics/reachy_mini_app_example)
- [Pollen Robotics on HuggingFace](https://huggingface.co/pollen-robotics)

---

*Last updated: 2025-12-21*
