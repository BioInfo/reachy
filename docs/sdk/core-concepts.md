# Core Concepts & Architecture

## Software Architecture

Reachy Mini uses a **Client-Server** architecture:

```
┌─────────────────┐         ┌─────────────────┐
│   Your Code     │  HTTP/  │     Daemon      │
│   (SDK Client)  │◄──────►│    (Server)     │
│                 │   WS    │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Robot Hardware │
                            │  (or Simulator) │
                            └─────────────────┘
```

**Daemon (Server):**
- Runs on computer connected to robot (or simulation)
- Handles hardware I/O, safety checks, sensor reading
- Exposes REST API (`localhost:8000`) and WebSocket

**SDK (Client):**
- Your Python code (`reachy_mini` package)
- Connects to Daemon over network
- Can run on separate machine from the Daemon

## Coordinate Systems

### Head Frame
Located at the base of the head. Used for `goto_target` and `set_target`.

### World Frame
Fixed relative to robot's base. Used for `look_at_world` commands.

## Safety Limits

The SDK automatically clamps values to nearest valid position.

| Joint / Axis | Limit Range |
|:-------------|:------------|
| **Head Pitch/Roll** | [-40°, +40°] |
| **Head Yaw** | [-180°, +180°] |
| **Body Yaw** | [-160°, +160°] |
| **Yaw Delta** | Max 65° difference between Head and Body Yaw |

## Motor Modes

```python
mini.enable_motors()              # Stiff - holds position
mini.disable_motors()             # Limp - no power
mini.enable_gravity_compensation() # Soft - moveable by hand
```
