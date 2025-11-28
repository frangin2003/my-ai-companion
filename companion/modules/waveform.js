// ============================================
// WAVEFORM VISUALIZATION MODULE
// Shows audio visualization during recording
// ============================================

import { getAnalyserNode, getIsRecording } from './audio.js';

let waveformAnimationId = null;
let waveformCanvas = null;
let waveformCtx = null;

export function showWaveform() {
    const container = document.getElementById('waveform-container');
    if (container) {
        container.classList.add('visible');
    }
}

export function hideWaveform() {
    const container = document.getElementById('waveform-container');
    if (container) {
        container.classList.remove('visible');
    }
}

function initWaveformCanvas() {
    waveformCanvas = document.getElementById('waveform-canvas');
    if (waveformCanvas) {
        waveformCtx = waveformCanvas.getContext('2d');
        waveformCanvas.width = waveformCanvas.offsetWidth * 2;
        waveformCanvas.height = waveformCanvas.offsetHeight * 2;
        waveformCtx.scale(2, 2);
    }
}

export function startWaveformAnimation() {
    if (!waveformCanvas) {
        initWaveformCanvas();
    }
    
    const analyserNode = getAnalyserNode();
    if (!analyserNode || !waveformCtx) return;
    
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!getIsRecording()) return;
        
        waveformAnimationId = requestAnimationFrame(draw);
        
        analyserNode.getByteFrequencyData(dataArray);
        
        const width = waveformCanvas.offsetWidth;
        const height = waveformCanvas.offsetHeight;
        
        // Clear canvas
        waveformCtx.fillStyle = 'rgba(26, 26, 46, 0.3)';
        waveformCtx.fillRect(0, 0, width, height);
        
        // Draw bars
        const barCount = 32;
        const barWidth = width / barCount - 2;
        const barSpacing = 2;
        
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * bufferLength / barCount);
            const value = dataArray[dataIndex];
            const barHeight = (value / 255) * height * 0.8;
            
            const x = i * (barWidth + barSpacing);
            const y = (height - barHeight) / 2;
            
            const hue = 200 + (value / 255) * 60;
            waveformCtx.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;
            
            waveformCtx.beginPath();
            waveformCtx.roundRect(x, y, barWidth, barHeight, 3);
            waveformCtx.fill();
        }
    }
    
    draw();
}

export function stopWaveformAnimation() {
    if (waveformAnimationId) {
        cancelAnimationFrame(waveformAnimationId);
        waveformAnimationId = null;
    }
}

