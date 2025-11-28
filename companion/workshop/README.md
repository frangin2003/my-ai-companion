# 🎭 AI Companion Workshop

Welcome to the AI Companion workshop! In this hands-on session, you'll add interactive features to your companion avatar.

## Prerequisites

Before starting, make sure you have:
- Node.js installed (v18+)
- The base companion avatar running (`npm start` in the companion folder)
- Basic knowledge of JavaScript

## Modular Architecture

The codebase uses a **modular architecture** for easy understanding and customization:

```
companion/
├── main.js              # Entry point
└── modules/
    ├── websocket.js     # WebSocket connection
    ├── audio.js         # Recording & playback
    ├── waveform.js      # Waveform visualization
    ├── textInput.js     # Text input handling
    ├── scene.js         # Three.js setup
    ├── character.js     # 3D avatar model
    ├── face.js          # Expressions
    ├── cape.js          # Cloth physics
    ├── animations.js    # Body animations
    ├── stateHandler.js  # Backend state handling
    └── ui.js            # UI controls
```

📖 **[Read the full Architecture Guide](./00-architecture.md)** for details on each module.

## Workshop Structure

Complete these features in order:

| # | Feature | Time | Module |
|---|---------|------|--------|
| 0 | [Architecture Overview](./00-architecture.md) | 10 min | Understanding the codebase |
| 1 | [WebSocket Connection](./01-websocket-connection.md) | 15 min | `websocket.js` |
| 2 | [Push to Talk](./02-push-to-talk.md) | 20 min | `audio.js` |
| 3 | [Waveform Animation](./03-waveform-animation.md) | 15 min | `waveform.js` |
| 4 | [Audio Playback](./04-audio-playback.md) | 15 min | `audio.js` |
| 5 | [Text Input](./05-text-input.md) | 15 min | `textInput.js` |
| 6 | [Backend State](./06-backend-state.md) | 15 min | `stateHandler.js` |

**Total Time:** ~1.5 hours

## Quick Start Test Server

To test your features, create this simple WebSocket server:

```javascript
// test-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('✅ Client connected!');
    
    ws.on('message', async (msg) => {
        const data = JSON.parse(msg);
        console.log('📥 Received:', data.type);
        
        // Simulate AI response
        if (data.type === 'text' || data.type === 'audio') {
            ws.send(JSON.stringify({ type: 'state', state: 'thinking' }));
            await new Promise(r => setTimeout(r, 1500));
            ws.send(JSON.stringify({ type: 'state', state: 'happy' }));
            await new Promise(r => setTimeout(r, 1000));
            ws.send(JSON.stringify({ type: 'state', state: 'idle' }));
        }
    });
    
    ws.on('close', () => console.log('❌ Client disconnected'));
});

console.log('🚀 Server running on ws://localhost:8080');
```

Run with: `node test-server.js`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron App                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Avatar     │    │  WebSocket   │    │   Backend    │  │
│  │  (Three.js)  │◄───│  Connection  │◄───│   Server     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ▲                   │                               │
│         │                   │                               │
│  ┌──────┴──────┐     ┌──────┴──────┐                       │
│  │ Animations  │     │   Audio     │                       │
│  │ Expressions │     │ Recording   │                       │
│  │ ⭐ Star     │     │ Playback    │                       │
│  │ (status)    │     └─────────────┘                       │
│  └─────────────┘                                            │
│                                                              │
│        ┌─────────────────────────────┐                      │
│        │    ⭐ Avatar (always on top) │                      │
│        │    Star = connection status  │                      │
│        └─────────────────────────────┘                      │
│        ┌─────────────────────────────┐                      │
│        │   [💬 Chat] (toggle)         │  ← Hidden until     │
│        │   [Text Input...] [→]        │    mouse hovers     │
│        │   Right Shift to talk        │    over app         │
│        └─────────────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Connection Status (The Star!)

The **star ornament** on the avatar's head shows connection status:

| Star Color | Status |
|------------|--------|
| 🔴 Red | Disconnected |
| 🟠 Orange | Connecting |
| 🔵 Blue | Connected |

## Message Protocol

### Client → Server

```javascript
// Voice message
{ "type": "audio", "audio_base64": "...", "format": "webm", "timestamp": 123 }

// Text message
{ "type": "text", "text": "Hello!", "timestamp": 123 }
```

### Server → Client

```javascript
// State change
{ "type": "state", "state": "thinking" }

// Play audio
{ "type": "audio", "audio_base64": "..." }

// Change expression
{ "type": "expression", "expression": "happy" }

// Play animation
{ "type": "animation", "animation": "dance" }
```

## Troubleshooting

### Microphone not working?
- Check Windows/Mac privacy settings
- Ensure no other app is using the microphone
- Try restarting the Electron app

### WebSocket not connecting?
- Verify the server is running on port 8080
- Check for firewall issues
- Look at DevTools console for errors

### Avatar not animating?
- Make sure the face texture loaded
- Check console for JavaScript errors
- Verify the animation/expression names

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Right Shift` | Push to Talk (hold to record, works anytime) |
| `T` | Toggle text input |
| `Enter` | Send text message |
| `F1` | Toggle debug panel |
| `Escape` | Quit app |

## Need Help?

- Open DevTools: Press F12 or right-click → Inspect
- Check console for errors and logs
- Test WebSocket in console: `sendWebSocketMessage('text', {text: 'test'})`
- Test expressions: `setExpression('happy')`
- Test animations: `playAnimation('dance')`

Happy coding! 🚀

