# Feature 4: Audio Playback from WebSocket

## Overview
Enable the companion avatar to play back audio received from the WebSocket backend. When the backend sends a text-to-speech response, the avatar will play it.

## What You'll Learn
- Decoding base64 audio data
- Using the Web Audio API for playback
- Implementing an audio queue system
- Synchronizing avatar animations with audio

---

## Step 1: Set Up Audio Playback Variables

Make sure you have the `audioContext` from Feature 3. Add these additional variables in `main.js`:

```javascript
// ============================================
// AUDIO PLAYBACK
// ============================================
let audioQueue = [];
let isPlayingAudio = false;

// Initialize audio context (if not already done)
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}
```

---

## Step 2: Handle Audio Messages from WebSocket

Update your WebSocket message handler to handle audio messages:

```javascript
function handleWebSocketMessage(data) {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received:', message);
        
        switch (message.type) {
            case 'audio':
                handleAudioMessage(message);
                break;
            // ... other message types
        }
    } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
    }
}

function handleAudioMessage(message) {
    if (message.audio_base64) {
        playBase64Audio(message.audio_base64);
    }
}
```

---

## Step 3: Implement Base64 Audio Decoding and Playback

```javascript
async function playBase64Audio(base64Audio) {
    try {
        const ctx = initAudioContext();
        
        // Decode base64 string to binary
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decode the audio data (WAV, MP3, etc.)
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        
        // Add to the playback queue
        audioQueue.push(audioBuffer);
        
        // Start playing if not already
        if (!isPlayingAudio) {
            playNextInQueue();
        }
        
    } catch (error) {
        console.error('Failed to play audio:', error);
    }
}
```

---

## Step 4: Implement Queue-Based Playback

This ensures audio clips play one after another without overlapping:

```javascript
function playNextInQueue() {
    // If queue is empty, we're done
    if (audioQueue.length === 0) {
        isPlayingAudio = false;
        stopTalking();  // Stop the avatar's talking animation
        return;
    }
    
    isPlayingAudio = true;
    startTalking();  // Start the avatar's talking animation
    
    const ctx = initAudioContext();
    const audioBuffer = audioQueue.shift();  // Get next audio from queue
    
    // Create a buffer source node
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    // When this audio ends, play the next one
    source.onended = () => {
        playNextInQueue();
    };
    
    // Start playback
    source.start();
}
```

---

## Step 5: Export for Testing

Add this at the bottom of your playback code:

```javascript
// Export for testing
window.playBase64Audio = playBase64Audio;
```

---

## Testing with a Simple Backend

Here's how to test by sending audio from a WebSocket server:

### Option A: Test Server (Node.js)

```javascript
const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected!');
    
    ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        console.log('Received:', data.type);
        
        // When receiving audio from client, echo it back
        if (data.type === 'audio') {
            // Send back a test audio (or echo the same audio)
            ws.send(JSON.stringify({
                type: 'audio',
                audio_base64: data.audio_base64
            }));
        }
    });
});

console.log('WebSocket server on ws://localhost:8080');
```

### Option B: Browser Console Test

You can test in the browser console by converting a small audio file:

```javascript
// First, load a small WAV file as base64
// You can use an online converter or this snippet:

// Test with a simple beep (requires a base64 WAV string)
const testAudio = "UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...";
playBase64Audio(testAudio);
```

---

## Audio Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Audio Playback Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WebSocket Message                                               │
│       │                                                          │
│       ▼                                                          │
│  { type: 'audio', audio_base64: '...' }                         │
│       │                                                          │
│       ▼                                                          │
│  atob() ──► Binary Data ──► decodeAudioData() ──► AudioBuffer   │
│                                                        │         │
│                                                        ▼         │
│                                               audioQueue.push()  │
│                                                        │         │
│                                                        ▼         │
│                                               playNextInQueue()  │
│                                                        │         │
│                                                        ▼         │
│                         BufferSourceNode ──► Speakers            │
│                                │                                 │
│                                ▼                                 │
│                         onended ──► playNextInQueue() (loop)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Synchronizing with Avatar

The avatar's talking animation is automatically triggered:

| Event | Avatar Action |
|-------|---------------|
| Audio starts playing | `startTalking()` - mouth moves |
| Audio queue empty | `stopTalking()` - return to idle |

---

## Supported Audio Formats

The Web Audio API supports:
- WAV (recommended for best compatibility)
- MP3
- OGG
- AAC (in some browsers)

For best results, have your backend send **WAV** or **MP3** audio.

---

## Troubleshooting

**Audio doesn't play?**
- Check browser console for errors
- Ensure the audio format is supported
- AudioContext may need user interaction to start (click anywhere first)

**Audio sounds garbled?**
- Check the sample rate matches the encoded audio
- Ensure the base64 string is complete (not truncated)

**Avatar doesn't animate?**
- Make sure `startTalking()` and `stopTalking()` functions exist
- Check that the avatar's face texture is loaded

---

## Next Step

Continue to [Feature 5: Text Input](./05-text-input.md)

