# Installation

**Supported OS:** Linux, macOS (tested), Windows (less tested)

## Prerequisites

- **Python:** 3.10 - 3.13
- **Git LFS:** Required for model assets

```bash
# macOS
brew install git-lfs

# Linux
sudo apt install git-lfs
```

## Virtual Environment (Recommended)

```bash
# Create
python3 -m venv .venv

# Activate
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows
```

## Install

### From PyPI (Standard)
```bash
pip install reachy-mini
```

### With Simulation Support
```bash
pip install reachy-mini[mujoco]
```

### From Source (Development)
```bash
git clone https://github.com/pollen-robotics/reachy_mini
pip install -e ./reachy_mini
```

## Linux USB Setup

```bash
echo 'SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="55d3", MODE="0666", GROUP="dialout"
SUBSYSTEM=="tty", ATTRS{idVendor}=="38fb", ATTRS{idProduct}=="1001", MODE="0666", GROUP="dialout"' \
| sudo tee /etc/udev/rules.d/99-reachy-mini.rules

sudo udevadm control --reload-rules && sudo udevadm trigger
sudo usermod -aG dialout $USER
# Log out and back in!
```
