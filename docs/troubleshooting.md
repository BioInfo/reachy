# Troubleshooting & FAQ

## Connection & Dashboard

### Dashboard at localhost:8000 doesn't work
1. Ensure you're in the virtual environment
2. Update SDK: `pip install -U reachy-mini`
3. Make sure daemon is running: `reachy-mini-daemon`

### Robot not moving on first startup
- Check 7V-5A power supply is plugged in (USB alone won't power motors)
- Verify all cables are fully inserted

## Hardware & Motors

### Safety Limits
Values are automatically clamped to safe range:

| Joint | Range |
|-------|-------|
| Body Yaw | [-180°, 180°] |
| Head Pitch/Roll | [-40°, 40°] |
| Head Yaw | [-180°, 180°] |
| Head-Body Yaw Diff | Max ±65° |

### Motors stop responding
- Check power supply connection
- May be thermal protection (let cool down)
- Update SDK: `pip install -U reachy-mini`

### "Input Voltage Error"
Normal - Reachy Mini uses higher voltage intentionally.

## SDK & Programming

### goto_target vs set_target
- **goto_target**: Smooth interpolation over time (gestures)
- **set_target**: Instant, no interpolation (teleoperation)

### Simulation without video
```python
ReachyMini(media_backend="no_media")
```

### "Circular buffer overrun" in simulation
Not consuming video frames. Use `media_backend="no_media"` if you don't need video.

## Vision & Audio

### Get camera frame
```python
frame = mini.media.get_frame()  # OpenCV numpy array
```

### Audio input/output
```python
sample = mini.media.get_audio_sample()
mini.media.push_audio_sample(numpy_chunk)
```

### "PortAudio library not found"
```bash
sudo apt-get install libportaudio2
```

## Resources

- **Discord:** [Pollen Robotics Discord](https://discord.gg/2bAhWfXme9)
- **GitHub Issues:** [reachy_mini/issues](https://github.com/pollen-robotics/reachy_mini/issues)
