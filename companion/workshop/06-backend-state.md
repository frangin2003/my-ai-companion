# Feature 6: React to Backend State Messages

## Overview
Make the avatar respond to state messages from the backend, automatically playing the appropriate animation and expression based on the AI's current state.

The companion server uses the events defined in **SERVER_SPEC.md**:
- `thinking_start` - AI begins processing
- `suggestion` - AI generates a proactive tip
- `reply` - AI responds to user message

## What You'll Learn
- Parsing and handling structured JSON messages
- Mapping backend states to avatar animations
- Creating a flexible state system
- Synchronizing visual feedback with AI state

---

## Step 1: Define the State Mapping

Add this to your `main.js`:

```javascript
// ============================================
// BACKEND STATE HANDLING
// ============================================

// Map backend states to avatar behavior
const stateMapping = {
    'idle': { 
        animation: 'idle', 
        expression: 'neutral' 
    },
    'listening': { 
        animation: 'idle', 
        expression: 'happy' 
    },
    'thinking': { 
        animation: 'idle', 
        expression: 'thinking' 
    },
    'speaking': { 
        animation: 'idle', 
        expression: null, 
        talking: true 
    },
    'processing': { 
        animation: 'float', 
        expression: 'sparkle' 
    },
    'error': { 
        animation: 'idle', 
        expression: 'worried' 
    },
    'happy': { 
        animation: 'dance', 
        expression: 'happy' 
    },
    'sad': { 
        animation: 'idle', 
        expression: 'sad' 
    },
    'excited': { 
        animation: 'yata', 
        expression: 'excited' 
    },
    'sleepy': { 
        animation: 'sleep', 
        expression: 'sleepy' 
    },
    'greeting': { 
        animation: 'wave', 
        expression: 'happy' 
    }
};
```

---

## Step 2: Implement the State Handler

```javascript
function handleStateMessage(message) {
    const { state, expression, animation } = message;
    
    // Get the mapping for this state (if it exists)
    const mapping = stateMapping[state] || {};
    
    // Animation: use explicit value, or mapping default
    if (animation) {
        playAnimation(animation);
    } else if (mapping.animation) {
        playAnimation(mapping.animation);
    }
    
    // Expression: use explicit value, or mapping default
    if (expression) {
        setExpression(expression);
    } else if (mapping.expression) {
        setExpression(mapping.expression);
    }
    
    // Handle talking state
    if (mapping.talking) {
        startTalking();
    } else if (state && state !== 'speaking') {
        stopTalking();
    }
    
    console.log(`🎭 State changed to: ${state}`, { animation, expression });
}
```

---

## Step 3: Update the WebSocket Message Handler

Update your `handleWebSocketMessage` function to handle the **SERVER_SPEC.md** events:

```javascript
function handleWebSocketMessage(data) {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received:', message);
        
        switch (message.type) {
            // === SERVER_SPEC.md Events ===
            case 'thinking_start':
                handleThinkingStart(message);
                break;
            case 'suggestion':
                handleSuggestion(message);
                break;
            case 'reply':
                handleReply(message);
                break;
            
            // === Legacy/Additional Events ===
            case 'state':
                handleStateMessage(message);
                break;
            case 'audio':
                handleAudioMessage(message);
                break;
            case 'expression':
                if (message.expression && faceExpressions[message.expression]) {
                    setExpression(message.expression);
                }
                break;
            case 'animation':
                if (message.animation) {
                    playAnimation(message.animation);
                }
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
    }
}
```

---

## Step 4: Add SERVER_SPEC.md Event Handlers

```javascript
// ============================================
// SERVER_SPEC.md Event Handlers
// ============================================

function handleThinkingStart(message) {
    // AI is processing - show thinking animation
    console.log('🤔 AI thinking...', message.data?.context || '');
    setExpression('thinking');
    playAnimation('idle');
}

function handleSuggestion(message) {
    // AI generated a proactive suggestion
    const { app_name, message: suggestionText } = message.data || {};
    console.log(`💡 Suggestion for ${app_name}:`, suggestionText);
    
    // Show excited/helpful expression
    setExpression('happy');
    playAnimation('idle');
    startTalking();
    
    // Stop talking after a delay based on message length
    const duration = Math.max(2000, (suggestionText?.length || 0) * 50);
    setTimeout(() => {
        stopTalking();
        setExpression('neutral');
    }, duration);
}

function handleReply(message) {
    // AI response to user message
    const replyText = message.data?.message || '';
    console.log('💬 AI Reply:', replyText);
    
    // Show speaking animation
    setExpression('happy');
    startTalking();
    
    // Stop talking after a delay based on message length
    const duration = Math.max(2000, replyText.length * 50);
    setTimeout(() => {
        stopTalking();
        setExpression('neutral');
    }, duration);
}
```

---

## Backend Message Formats (SERVER_SPEC.md)

### `thinking_start` - AI begins processing
```json
{
    "type": "thinking_start",
    "data": {
        "context": "Optional context string"
    }
}
```

### `suggestion` - Proactive AI tip
```json
{
    "type": "suggestion",
    "data": {
        "app_name": "Numbers",
        "message": "Try using Command+Option+N to create a new sheet."
    }
}
```

### `reply` - AI response to user
```json
{
    "type": "reply",
    "data": {
        "message": "To sum a column, use the SUM function."
    }
}
```

---

## Legacy/Additional Message Formats

### State Message
Sets the overall avatar state:

```json
{
    "type": "state",
    "state": "thinking"
}
```

### Audio with State
Send audio along with a state change:

```json
{
    "type": "audio",
    "audio_base64": "...",
    "state": "speaking"
}
```

---

## State Flow Diagram (SERVER_SPEC.md)

```
┌──────────────────────────────────────────────────────────────┐
│                    Typical AI Response Flow                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User sends message                                        │
│         │  { type: "message", data: { content: "..." } }     │
│         ▼                                                     │
│  2. Backend sends: { type: "thinking_start" }                │
│         │         Avatar: 🤔 idle + thinking                  │
│         ▼                                                     │
│  3. Backend sends: { type: "reply", data: { message } }      │
│                   Avatar: 🗣️ talking + happy                  │
│                   (auto-stops after message duration)         │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                    Proactive Suggestion Flow                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. AI detects context from monitored app                     │
│         │                                                     │
│         ▼                                                     │
│  2. Backend sends: { type: "suggestion", data: {...} }       │
│                   Avatar: 💡 talking + happy                  │
│                   (auto-stops after message duration)         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing

### Test Server Example (per SERVER_SPEC.md)

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8000 });

wss.on('connection', (ws) => {
    console.log('Client connected!');
    
    // Simulate AI response flow per SERVER_SPEC.md
    ws.on('message', async (msg) => {
        const data = JSON.parse(msg);
        
        if (data.type === 'message') {
            // Step 1: Thinking
            ws.send(JSON.stringify({ 
                type: 'thinking_start',
                data: { context: 'Processing user message...' }
            }));
            await sleep(2000);
            
            // Step 2: Reply
            ws.send(JSON.stringify({ 
                type: 'reply',
                data: { message: 'Here is my response to your question!' }
            }));
        }
    });
    
    // Simulate a proactive suggestion after 5 seconds
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'suggestion',
            data: {
                app_name: 'Demo App',
                message: 'Try clicking the button in the top right!'
            }
        }));
    }, 5000);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('Test server running on ws://localhost:8000/ws');
```

### Browser Console Test

```javascript
// Simulate receiving SERVER_SPEC.md events
handleWebSocketMessage(JSON.stringify({ 
    type: 'thinking_start', 
    data: { context: 'test' } 
}));

handleWebSocketMessage(JSON.stringify({ 
    type: 'reply', 
    data: { message: 'Hello from the AI!' } 
}));

handleWebSocketMessage(JSON.stringify({ 
    type: 'suggestion', 
    data: { app_name: 'Test', message: 'Try this tip!' } 
}));
```

---

## Available States and Their Effects

| State | Animation | Expression | Special |
|-------|-----------|------------|---------|
| `idle` | idle | neutral | - |
| `listening` | idle | happy | - |
| `thinking` | idle | thinking | - |
| `speaking` | idle | - | talking = true |
| `processing` | float | sparkle | - |
| `error` | idle | worried | - |
| `happy` | dance | happy | - |
| `sad` | idle | sad | - |
| `excited` | yata | excited | - |
| `sleepy` | sleep | sleepy | - |
| `greeting` | wave | happy | - |

---

## Customization

### Add New States

```javascript
// Add to stateMapping
stateMapping['confused'] = {
    animation: 'idle',
    expression: 'confused'
};

stateMapping['dancing'] = {
    animation: 'dance',
    expression: 'sparkle'
};
```

### Add State Transition Effects

```javascript
function handleStateMessage(message) {
    const { state } = message;
    const previousState = currentState;
    currentState = state;
    
    // Add transition effects
    if (previousState === 'idle' && state === 'excited') {
        // Play a sound effect
        playSound('tada.wav');
    }
    
    // ... rest of handler
}
```

---

## Complete Message Reference (SERVER_SPEC.md)

### Server → Client Events

| Message Type | Data Fields | Avatar Response |
|--------------|-------------|-----------------|
| `thinking_start` | `context` (optional) | 🤔 thinking expression |
| `suggestion` | `app_name`, `message` | 💡 talking + happy |
| `reply` | `message` | 🗣️ talking + happy |

### Client → Server Events

| Message Type | Data Fields | Description |
|--------------|-------------|-------------|
| `message` | `content` | User text input |

### Legacy Events (still supported)

| Message Type | Required Fields | Optional Fields |
|--------------|-----------------|-----------------|
| `state` | `type`, `state` | `animation`, `expression` |
| `audio` | `type`, `audio_base64` | `format`, `state` |

---

## Congratulations! 🎉

You've completed all 6 features! Your companion avatar can now:

1. ✅ Connect to a WebSocket server with auto-reconnection
2. ✅ Record voice with push-to-talk
3. ✅ Show a beautiful waveform while recording
4. ✅ Play back audio from the backend
5. ✅ Send text messages
6. ✅ React to backend state changes

### Next Steps

- Connect to a real AI backend (Azure OpenAI, etc.)
- Add more expressions and animations
- Implement conversation history
- Add text-to-speech for responses
- Create custom state mappings for your use case

