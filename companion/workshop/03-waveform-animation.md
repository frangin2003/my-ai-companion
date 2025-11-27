# Feature 3: Waveform Animation During Recording

## Overview
Add a beautiful waveform visualization that appears when the user is recording their voice (using Right Shift), providing visual feedback. The waveform always shows during recording, regardless of whether the text input is visible.

## What You'll Learn
- Using the Web Audio API's `AnalyserNode`
- Drawing real-time audio visualizations with Canvas
- Creating smooth animations with `requestAnimationFrame`

---

## Step 1: Add the Waveform Container to HTML

Add this **at the top** of your `<body>` in `index.html`:

```html
<!-- Waveform Visualization - Shows when recording with Right Shift -->
<div id="waveform-container">
    <canvas id="waveform-canvas"></canvas>
</div>
```

The waveform appears just below the avatar's face when recording.

---

## Step 2: Add Waveform Styles

Add these styles to your `style.css`:

```css
/* ============================================
   WAVEFORM VISUALIZATION
   ============================================ */
#waveform-container {
    position: fixed;
    top: calc(50% + 10px); /* Below the face */
    left: 50%;
    transform: translate(-50%, 0);
    width: 260px;
    height: 70px;
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 35, 0.95) 100%);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 12px 15px;
    box-shadow: 
        0 8px 30px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        0 0 40px rgba(99, 102, 241, 0.15);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Hidden by default */
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

#waveform-container.visible {
    opacity: 1;
    visibility: visible;
    animation: waveform-appear 0.3s ease-out;
}

@keyframes waveform-appear {
    from {
        opacity: 0;
        transform: translate(-50%, 0) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
    }
}

#waveform-canvas {
    width: 100%;
    height: 50px;
    border-radius: 8px;
}
```

---

## Step 3: Add Audio Context and Analyser

Add these variables at the top of your waveform code in `main.js`:

```javascript
// ============================================
// WAVEFORM ANIMATION
// ============================================
let audioContext = null;
let analyserNode = null;
let waveformAnimationId = null;
let waveformCanvas = null;
let waveformCtx = null;

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}
```

---

## Step 4: Update the Recording Function

Modify your `startRecording()` function to connect the audio analyser:

```javascript
async function startRecording() {
    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        // === NEW: Create Audio Context for visualization ===
        initAudioContext();
        const analyserSource = audioContext.createMediaStreamSource(recordingStream);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        analyserSource.connect(analyserNode);
        // === END NEW ===
        
        mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await sendAudioToBackend(audioBlob);
            hideWaveform();  // === NEW ===
            
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }
        };
        
        mediaRecorder.start(100);
        isRecording = true;
        
        // === NEW: Show waveform ===
        showWaveform();
        startWaveformAnimation();
        // === END NEW ===
        
        updatePTTButton(true);
        console.log('🎤 Recording started');
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}
```

Also update `stopRecording()`:

```javascript
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        updatePTTButton(false);
        stopWaveformAnimation();  // === NEW ===
        console.log('🎤 Recording stopped');
    }
}
```

---

## Step 5: Add Waveform Visualization Functions

```javascript
function showWaveform() {
    const container = document.getElementById('waveform-container');
    if (container) {
        container.classList.add('visible');
    }
}

function hideWaveform() {
    const container = document.getElementById('waveform-container');
    if (container) {
        container.classList.remove('visible');
    }
}

function initWaveformCanvas() {
    waveformCanvas = document.getElementById('waveform-canvas');
    if (waveformCanvas) {
        waveformCtx = waveformCanvas.getContext('2d');
        // High DPI support
        waveformCanvas.width = waveformCanvas.offsetWidth * 2;
        waveformCanvas.height = waveformCanvas.offsetHeight * 2;
        waveformCtx.scale(2, 2);
    }
}

function startWaveformAnimation() {
    if (!waveformCanvas) {
        initWaveformCanvas();
    }
    
    if (!analyserNode || !waveformCtx) return;
    
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!isRecording) return;
        
        waveformAnimationId = requestAnimationFrame(draw);
        
        // Get frequency data
        analyserNode.getByteFrequencyData(dataArray);
        
        const width = waveformCanvas.offsetWidth;
        const height = waveformCanvas.offsetHeight;
        
        // Clear canvas with semi-transparent background
        waveformCtx.fillStyle = 'rgba(26, 26, 46, 0.3)';
        waveformCtx.fillRect(0, 0, width, height);
        
        // Draw frequency bars
        const barCount = 32;
        const barWidth = width / barCount - 2;
        const barSpacing = 2;
        
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * bufferLength / barCount);
            const value = dataArray[dataIndex];
            const barHeight = (value / 255) * height * 0.8;
            
            const x = i * (barWidth + barSpacing);
            const y = (height - barHeight) / 2;
            
            // Color gradient based on amplitude
            const hue = 200 + (value / 255) * 60; // Blue to cyan
            waveformCtx.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;
            
            // Draw rounded bar
            waveformCtx.beginPath();
            waveformCtx.roundRect(x, y, barWidth, barHeight, 3);
            waveformCtx.fill();
        }
    }
    
    draw();
}

function stopWaveformAnimation() {
    if (waveformAnimationId) {
        cancelAnimationFrame(waveformAnimationId);
        waveformAnimationId = null;
    }
}
```

---

## Testing

1. Start your Electron app
2. Press and hold **Right Shift**
3. A waveform visualization should appear in the center of the screen
4. Speak into your microphone - the bars should react to your voice
5. Release Right Shift - the waveform should disappear smoothly

> **Note:** The waveform appears whenever you use Push to Talk, regardless of whether the text input is visible or hidden!

---

## How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                        Audio Flow                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Microphone → MediaStream → AnalyserNode → Frequency Data    │
│                     ↓                             ↓           │
│              MediaRecorder                   Canvas Bars      │
│                     ↓                                         │
│                Audio Blob                                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

| Component | Purpose |
|-----------|---------|
| `AudioContext` | Main audio processing interface |
| `AnalyserNode` | Provides real-time frequency data |
| `getByteFrequencyData()` | Returns 0-255 values for each frequency bin |
| `requestAnimationFrame` | Smooth 60fps animation loop |

---

## Customization Ideas

**Different Bar Styles:**
```javascript
// Mirrored bars (top and bottom)
waveformCtx.fillRect(x, height/2 - barHeight/2, barWidth, barHeight);

// Circular waveform
const angle = (i / barCount) * Math.PI * 2;
const radius = 50 + barHeight;
const cx = width/2 + Math.cos(angle) * radius;
const cy = height/2 + Math.sin(angle) * radius;
```

**Different Colors:**
```javascript
// Rainbow colors
const hue = (i / barCount) * 360;

// Based on amplitude
const hue = 120 - (value / 255) * 120; // Green to red
```

---

## Next Step

Continue to [Feature 4: Audio Playback](./04-audio-playback.md)

