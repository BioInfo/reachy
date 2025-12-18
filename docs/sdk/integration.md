# Integrations & Apps

Reachy Mini is designed for AI Builders. Here's how to integrate LLMs and share your work.

## Building an App

CLI tool to generate, check and publish Apps (compatible with Hugging Face Spaces):

```bash
reachy-mini-make-app my_app_name
```

See: [Make and Publish Reachy Mini Apps](https://huggingface.co/blog/pollen-robotics/make-and-publish-your-reachy-mini-apps)

## HTTP & WebSocket API

Building a dashboard or non-Python controller? The Daemon exposes full control via REST.

| Endpoint | Description |
|----------|-------------|
| `http://localhost:8000/docs` | Interactive API docs |
| `GET /api/state/full` | Get robot state |
| `ws://localhost:8000/api/state/ws/full` | WebSocket for real-time state |

## AI Experimentation

### Conversation Demo
Reference implementation combining VAD, LLMs, and TTS:
- [reachy_mini_conversation_demo](https://github.com/pollen-robotics/reachy_mini_conversation_demo)

### Tips
- Use `media_backend="no_media"` if just testing logic without video/audio
- The daemon REST API allows integration with any language/framework
- Publish apps to Hugging Face Spaces for community sharing
