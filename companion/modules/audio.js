// ============================================
// AUDIO MODULE
// Handles audio playback and recording (PTT)
// ============================================

import { sendMessage } from './websocket.js';

let audioContext = null;
let audioQueue = [];
let isPlayingAudio = false;

// Recording state
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStream = null;
let analyserNode = null;

// Callbacks
let onTalkingStart = null;
let onTalkingStop = null;
let onRecordingStart = null;
let onRecordingStop = null;

export function setTalkingCallbacks(onStart, onStop) {
    onTalkingStart = onStart;
    onTalkingStop = onStop;
}

export function setRecordingCallbacks(onStart, onStop) {
    onRecordingStart = onStart;
    onRecordingStop = onStop;
}

export function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

export function getAnalyserNode() {
    return analyserNode;
}

export function getIsRecording() {
    return isRecording;
}

// ============================================
// AUDIO PLAYBACK
// ============================================

export async function playBase64Audio(base64Audio) {
    try {
        const ctx = initAudioContext();
        
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        audioQueue.push(audioBuffer);
        
        if (!isPlayingAudio) {
            playNextInQueue();
        }
    } catch (error) {
        console.error('Failed to play audio:', error);
    }
}

function playNextInQueue() {
    if (audioQueue.length === 0) {
        isPlayingAudio = false;
        if (onTalkingStop) onTalkingStop();
        return;
    }
    
    isPlayingAudio = true;
    if (onTalkingStart) onTalkingStart();
    
    const ctx = initAudioContext();
    const audioBuffer = audioQueue.shift();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
        playNextInQueue();
    };
    
    source.start();
}

// ============================================
// AUDIO RECORDING (Push to Talk)
// ============================================

export async function startRecording() {
    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        // Create AudioContext for waveform visualization
        initAudioContext();
        const analyserSource = audioContext.createMediaStreamSource(recordingStream);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        analyserSource.connect(analyserNode);
        
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
            
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }
        };
        
        mediaRecorder.start(100);
        isRecording = true;
        
        if (onRecordingStart) onRecordingStart();
        console.log('🎤 Recording started');
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

export function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        if (onRecordingStop) onRecordingStop();
        console.log('🎤 Recording stopped');
    }
}

async function sendAudioToBackend(audioBlob) {
    try {
        const base64Audio = await blobToBase64(audioBlob);
        
        sendMessage('audio', {
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
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Export for global access
window.playBase64Audio = playBase64Audio;

