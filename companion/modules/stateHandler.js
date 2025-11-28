// ============================================
// STATE HANDLER MODULE
// Handles backend state messages and coordinates responses
// ============================================

import { playAnimation } from './animations.js';
import { setExpression, startTalking, stopTalking, faceExpressions } from './face.js';
import { playBase64Audio } from './audio.js';

// State to avatar behavior mapping
const stateMapping = {
    'idle': { animation: 'idle', expression: 'neutral' },
    'listening': { animation: 'idle', expression: 'happy' },
    'thinking': { animation: 'idle', expression: 'thinking' },
    'speaking': { animation: 'idle', expression: null, talking: true },
    'processing': { animation: 'float', expression: 'sparkle' },
    'error': { animation: 'idle', expression: 'worried' },
    'happy': { animation: 'dance', expression: 'happy' },
    'sad': { animation: 'idle', expression: 'sad' },
    'excited': { animation: 'yata', expression: 'excited' },
    'sleepy': { animation: 'sleep', expression: 'sleepy' }
};

export function handleWebSocketMessage(data) {
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

function handleStateMessage(message) {
    const { state, expression, animation } = message;
    
    const mapping = stateMapping[state] || {};
    
    if (animation) {
        playAnimation(animation);
    } else if (mapping.animation) {
        playAnimation(mapping.animation);
    }
    
    if (expression) {
        setExpression(expression);
    } else if (mapping.expression) {
        setExpression(mapping.expression);
    }
    
    if (mapping.talking) {
        startTalking();
    } else if (state && state !== 'speaking') {
        stopTalking();
    }
}

function handleAudioMessage(message) {
    if (message.audio_base64) {
        playBase64Audio(message.audio_base64);
    }
}

