# Feature 6: React to Backend State Messages

## Overview
Make the avatar respond to state messages from the backend, automatically playing the appropriate animation and expression based on the AI's current state.

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

Update your `handleWebSocketMessage` function to handle all message types:

```javascript
function handleWebSocketMessage(data) {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received:', message);
        
        switch (message.type) {
            case 'state':
                handleStateMessage(message);
                break;
                
            case 'audio':
                handleAudioMessage(message);
                break;
                
            case 'expression':
                // Direct expression change
                if (message.expression && faceExpressions[message.expression]) {
                    setExpression(message.expression);
                }
                break;
                
            case 'animation':
                // Direct animation change
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

## Backend Message Formats

### State Message
The most common message - sets the overall avatar state:

```json
{
    "type": "state",
    "state": "thinking"
}
```

### State with Overrides
Override the default animation or expression:

```json
{
    "type": "state",
    "state": "happy",
    "animation": "dance",
    "expression": "love"
}
```

### Direct Expression Change
Change only the facial expression:

```json
{
    "type": "expression",
    "expression": "surprised"
}
```

### Direct Animation Change
Change only the body animation:

```json
{
    "type": "animation",
    "animation": "wave"
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

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Typical AI Response Flow                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User sends voice/text                                     │
│         │                                                     │
│         ▼                                                     │
│  2. Backend sends: { type: "state", state: "listening" }     │
│         │         Avatar: 😊 idle + happy                     │
│         ▼                                                     │
│  3. Backend sends: { type: "state", state: "thinking" }      │
│         │         Avatar: 🤔 idle + thinking                  │
│         ▼                                                     │
│  4. Backend sends: { type: "state", state: "speaking" }      │
│         │         Avatar: 🗣️ idle + talking animation         │
│         │                                                     │
│  5. Backend sends: { type: "audio", audio_base64: "..." }    │
│         │         Avatar: plays audio                         │
│         ▼                                                     │
│  6. Backend sends: { type: "state", state: "idle" }          │
│                   Avatar: 😐 idle + neutral                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Testing

### Test Server Example

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected!');
    
    // Simulate AI response flow
    ws.on('message', async (msg) => {
        const data = JSON.parse(msg);
        
        if (data.type === 'text' || data.type === 'audio') {
            // Step 1: Listening
            ws.send(JSON.stringify({ type: 'state', state: 'listening' }));
            await sleep(500);
            
            // Step 2: Thinking
            ws.send(JSON.stringify({ type: 'state', state: 'thinking' }));
            await sleep(2000);
            
            // Step 3: Excited response!
            ws.send(JSON.stringify({ type: 'state', state: 'excited' }));
            await sleep(1500);
            
            // Step 4: Back to idle
            ws.send(JSON.stringify({ type: 'state', state: 'idle' }));
        }
    });
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('Test server running on ws://localhost:8080');
```

### Browser Console Test

```javascript
// Simulate receiving state messages
handleWebSocketMessage(JSON.stringify({ type: 'state', state: 'happy' }));
handleWebSocketMessage(JSON.stringify({ type: 'state', state: 'thinking' }));
handleWebSocketMessage(JSON.stringify({ type: 'state', state: 'excited' }));
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

## Complete Message Reference

| Message Type | Required Fields | Optional Fields |
|--------------|-----------------|-----------------|
| `state` | `type`, `state` | `animation`, `expression` |
| `audio` | `type`, `audio_base64` | `format`, `state` |
| `expression` | `type`, `expression` | - |
| `animation` | `type`, `animation` | - |

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

