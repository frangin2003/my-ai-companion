# Feature 2: Push-to-Talk with Microphone Recording

## Overview
Add a push-to-talk feature that records audio from the user's microphone and sends it as base64 to the WebSocket backend. Users can press and hold **Right Shift** at any time to record.

## What You'll Learn
- How to access the microphone with `getUserMedia`
- Recording audio with `MediaRecorder`
- Converting audio to base64
- Handling keyboard events for PTT

---

## Step 1: Add PTT Hint to HTML

Add a hint below the avatar in `index.html` inside `#bottom-controls`:

```html
<!-- PTT Hint -->
<div class="ptt-hint">
    <span class="key-hint">Right Shift</span> to talk
</div>
```

---

## Step 2: Add Styles

Add these styles to your `style.css`:

```css
/* PTT Hint */
.ptt-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7em;
    color: #666;
    padding: 4px 10px;
}

.key-hint {
    background: rgba(255, 255, 255, 0.1);
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    color: #888;
    border: 1px solid rgba(255, 255, 255, 0.15);
}
```

---

## Step 3: Add Recording Logic

Add this JavaScript code to your `main.js`:

```javascript
// ============================================
// PUSH TO TALK
// ============================================
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStream = null;

async function startRecording() {
    try {
        // Request microphone access
        recordingStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        // Create MediaRecorder
        mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunks = [];
        
        // Collect audio data
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        // When recording stops, send the audio
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await sendAudioToBackend(audioBlob);
            
            // Clean up the stream
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }
        };
        
        // Start recording (collect data every 100ms)
        mediaRecorder.start(100);
        isRecording = true;
        
        // Update button appearance
        updatePTTButton(true);
        console.log('🎤 Recording started');
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        updatePTTButton(false);
        console.log('🎤 Recording stopped');
    }
}

async function sendAudioToBackend(audioBlob) {
    try {
        // Convert blob to base64
        const base64Audio = await blobToBase64(audioBlob);
        
        // Send via WebSocket
        sendWebSocketMessage('audio', {
            audio_base64: base64Audio,
            format: 'webm',
            timestamp: Date.now()
        });
        
        console.log('📤 Audio sent to backend');
    } catch (error) {
        console.error('Failed to send audio:', error);
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function updatePTTButton(recording) {
    const btn = document.getElementById('ptt-btn');
    if (!btn) return;
    
    if (recording) {
        btn.classList.add('recording');
        btn.innerHTML = '🎙️ Recording...';
    } else {
        btn.classList.remove('recording');
        btn.innerHTML = '🎤 Push to Talk';
    }
}
```

---

## Step 4: Add Event Listeners

At the end of your `main.js` (before `animate();`), add:

```javascript
// Push-to-Talk with RIGHT SHIFT (works anytime, even when typing)
window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftRight') {
        e.preventDefault();
        if (!isRecording) {
            startRecording();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftRight') {
        e.preventDefault();
        if (isRecording) {
            stopRecording();
        }
    }
});
```

> **Note:** We use Right Shift instead of Space because:
> - It works **anytime**, even when typing in the text input
> - It's easily accessible with the right hand
> - It doesn't conflict with other shortcuts

---

## Testing

1. Start your Electron app
2. Press and **hold** the **Right Shift** key
3. Speak into your microphone
4. Release the key
5. Check the console - you should see the audio being sent

### Check the Backend

Your WebSocket server should receive a message like:

```json
{
    "type": "audio",
    "audio_base64": "GkXfo59ChoEB...",
    "format": "webm",
    "timestamp": 1699123456789
}
```

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| `getUserMedia()` | Browser API to access microphone/camera |
| `MediaRecorder` | Records media streams |
| `Blob` | Binary data container |
| `FileReader` | Reads files/blobs as base64 |

---

## Troubleshooting

**Microphone Permission Denied?**
- Electron needs permission to access the microphone
- On Windows, check Privacy Settings → Microphone
- On macOS, check System Preferences → Security & Privacy

**No Audio Data?**
- Make sure your microphone is selected as the default device
- Check the DevTools console for errors

---

## Next Step

Continue to [Feature 3: Waveform Animation](./03-waveform-animation.md)

