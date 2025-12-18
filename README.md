<p align="center">
  <img src="assets/banner.png" alt="Reachy Mini" width="600"/>
</p>

<h1 align="center">🤖 Reachy Mini Development Environment</h1>

<p align="center">
  <strong>My journey building with the adorable Reachy Mini Lite robot</strong>
</p>

<p align="center">
  <a href="https://github.com/BioInfo/reachy/stargazers"><img src="https://img.shields.io/github/stars/BioInfo/reachy?style=social" alt="Stars"></a>
  <a href="https://github.com/BioInfo/reachy/fork"><img src="https://img.shields.io/github/forks/BioInfo/reachy?style=social" alt="Forks"></a>
  <a href="https://github.com/BioInfo/reachy/watchers"><img src="https://img.shields.io/github/watchers/BioInfo/reachy?style=social" alt="Watchers"></a>
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-blue?style=for-the-badge" alt="Quick Start"></a>
  <a href="#-documentation"><img src="https://img.shields.io/badge/Documentation-green?style=for-the-badge" alt="Docs"></a>
  <a href="#-examples"><img src="https://img.shields.io/badge/Examples-orange?style=for-the-badge" alt="Examples"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10--3.13-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Platform-macOS%20|%20Linux-lightgrey?logo=apple" alt="Platform">
  <img src="https://img.shields.io/badge/Robot-Reachy%20Mini%20Lite-00d4aa" alt="Robot">
  <img src="https://img.shields.io/badge/Simulation-MuJoCo-purple" alt="MuJoCo">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

## ✨ What's This?

A development environment and learning resource for the [**Reachy Mini Lite**](https://www.pollen-robotics.com/reachy-mini/) — an expressive desktop robot built for AI experimentation.

| 📚 Curated Docs | 🛠️ Helper Scripts | 📝 Session Logs | 💡 Examples |
|:---:|:---:|:---:|:---:|
| SDK reference for quick lookup | One-click simulation launchers | Development journey notes | Movement & control demos |

---

## 🚀 Quick Start

### Prerequisites

```
✅ macOS or Linux
✅ Python 3.10 - 3.13
✅ ~500MB disk space
```

### Setup

```bash
# Clone this repo
git clone https://github.com/BioInfo/reachy.git
cd reachy

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install SDK with simulation
pip install "reachy-mini[mujoco]"
```

### Launch Simulation

```bash
# Headless mode (connects to Desktop App)
python -m reachy_mini.daemon.app.main --sim --headless

# With 3D visualization
./run_sim.sh

# With objects (table, apple, duck 🦆)
./run_sim.sh --scene minimal
```

**Dashboard:** http://localhost:8000

---

## 💡 Examples

### Basic Movement

```python
from reachy_mini import ReachyMini
from reachy_mini.utils import create_head_pose

with ReachyMini() as mini:
    # Look around
    mini.goto_target(
        head=create_head_pose(z=20, roll=10, mm=True, degrees=True),
        duration=1.0
    )

    # Wiggle antennas
    mini.goto_target(antennas=[0.6, -0.6], duration=0.3)
    mini.goto_target(antennas=[-0.6, 0.6], duration=0.3)
```

### Run Test Script

```bash
./run_test.sh
```

---

## 📚 Documentation

Local SDK docs for quick reference:

| Document | Description |
|:---------|:------------|
| 📖 [Quick API Cheatsheet](docs/README.md) | Common patterns at a glance |
| 🐍 [Python SDK Reference](docs/sdk/python-sdk.md) | Full API documentation |
| 🏗️ [Core Concepts](docs/sdk/core-concepts.md) | Architecture & safety limits |
| 🔌 [Integration Guide](docs/sdk/integration.md) | REST API & LLM connections |
| 🔧 [Troubleshooting](docs/troubleshooting.md) | Common issues & fixes |

---

## 🎮 Physical Robot

When your Reachy Mini Lite arrives:

```bash
# Connect via USB, then:
source venv/bin/activate
reachy-mini-daemon
```

**Same code works for simulation and hardware!**

---

## 📓 Development Journal

Session logs documenting the journey:

- [**2025-12-18** — Initial Setup](sessions/2025-12-18-initial-setup.md)

---

## 🤗 Build & Share Apps

Create HuggingFace-compatible apps:

```bash
reachy-mini-make-app my_awesome_app
```

Then publish to [HuggingFace Spaces](https://huggingface.co/blog/pollen-robotics/make-and-publish-your-reachy-mini-apps)!

---

## 🔗 Resources

<table>
  <tr>
    <td align="center"><a href="https://github.com/pollen-robotics/reachy_mini"><img src="https://img.shields.io/badge/GitHub-SDK-181717?logo=github" alt="SDK"/></a></td>
    <td align="center"><a href="https://github.com/pollen-robotics/reachy-mini-desktop-app"><img src="https://img.shields.io/badge/GitHub-Desktop_App-181717?logo=github" alt="Desktop App"/></a></td>
    <td align="center"><a href="https://github.com/pollen-robotics/reachy_mini_conversation_app"><img src="https://img.shields.io/badge/GitHub-Conversation_App-181717?logo=github" alt="Conversation"/></a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://discord.gg/2bAhWfXme9"><img src="https://img.shields.io/badge/Discord-Community-5865F2?logo=discord&logoColor=white" alt="Discord"/></a></td>
    <td align="center"><a href="https://www.pollen-robotics.com/reachy-mini/"><img src="https://img.shields.io/badge/Web-Pollen_Robotics-00d4aa" alt="Website"/></a></td>
    <td align="center"><a href="https://huggingface.co/pollen-robotics"><img src="https://img.shields.io/badge/🤗-HuggingFace-yellow" alt="HuggingFace"/></a></td>
  </tr>
</table>

---

## 📊 Star History

<a href="https://star-history.com/#BioInfo/reachy&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=BioInfo/reachy&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=BioInfo/reachy&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=BioInfo/reachy&type=Date" />
 </picture>
</a>

---

## 📄 License

MIT © [Justin Johnson](https://github.com/BioInfo)

---

<p align="center">
  <sub>Built with 🤖 and ☕ — Powered by <a href="https://claude.ai">Claude</a></sub>
</p>
