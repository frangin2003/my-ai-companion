# Server Specification

The AI Companion Server uses WebSockets for real-time, event-based communication.

**URL**: `ws://localhost:8000/ws`

## Events (Server -> Client)

### `thinking_start`
Sent when the AI begins processing a context or user query.
```json
{
  "type": "thinking_start",
  "data": {
    "context": "Optional context string"
  }
}
```

### `suggestion`
Sent when the AI generates a proactive suggestion based on app monitoring.
```json
{
  "type": "suggestion",
  "data": {
    "app_name": "Numbers",
    "message": "Try using Command+Option+N to create a new sheet.",
    "emotion": "happy"
  }
}
```

### `reply`
Sent when the AI responds to a user message.
```json
{
  "type": "reply",
  "data": {
    "message": "To sum a column, use the SUM function.",
    "emotion": "thinking"
  }
}
```

## Events (Client -> Server)

### `message`
Sent when the user inputs text.
```json
{
  "type": "message",
  "data": {
    "content": "How do I freeze the top row?"
  }
}
```

### Binary Audio Message
Sent when the user records audio (e.g., via `/record` command).
- **Format**: Raw bytes (WAV/WebM).
- **Server Action**: Transcribes audio using Gemini and processes it as a text message.

