// ============================================
// STATE HANDLER MODULE
// Handles backend state messages and coordinates responses
// Per SERVER_SPEC.md event types
// ============================================

import { playAnimation } from './animations.js';
import { setExpression, setExpressionByGrid, startTalking, stopTalking, faceExpressions } from './face.js';
import { playBase64Audio } from './audio.js';
import { showMessage, hideMessage } from './speechBubble.js';

// State to avatar behavior mapping
const stateMapping = {
    'idle': { animation: 'idle', expression: 'neutral2' },
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

function handleStateMessage(message) {
    const { state, expression, animation } = message;
    
    const mapping = stateMapping[state] || {};
    
    if (animation) {
        playAnimation(animation);
    } else if (mapping.animation) {
        playAnimation(mapping.animation);
    }
    
    // Special handling for idle state - always use (1,0)
    if (state === 'idle') {
        setExpressionByGrid(1, 0);
    } else if (expression) {
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

// ============================================
// SERVER_SPEC.md Event Handlers
// ============================================

function handleThinkingStart(message) {
    // AI is processing - show waiting expression at (0,3)
    console.log('🤔 AI thinking...', message.data?.context || '');
    setExpressionByGrid(0, 4); // Use talking3 face when waiting for response
    playAnimation('idle');
    stopTalking(); // Make sure we're not talking while waiting
}

function handleSuggestion(message) {
    // AI generated a proactive suggestion
    const { app_name, message: suggestionText } = message.data || {};
    console.log(`💡 Suggestion for ${app_name}:`, suggestionText);
    
    // Show message in speech bubble
    const displayText = suggestionText || `Suggestion for ${app_name || 'app'}`;
    showMessage(displayText, Math.max(5000, (suggestionText?.length || 0) * 50));
    
    // Show excited/helpful expression
    setExpression('happy');
    playAnimation('idle');
    startTalking();
    
    // Stop talking animation after a delay (adjust based on message length)
    const duration = Math.max(2000, (suggestionText?.length || 0) * 50);
    setTimeout(() => {
        stopTalking();
        setExpressionByGrid(1, 0); // Idle uses (1,0) only
        hideMessage();
    }, duration);
}

function handleReply(message) {
    // AI response to user message
    const replyText = message.data?.message || '';
    console.log('💬 AI Reply:', replyText);
    
    // Show message in speech bubble
    if (replyText) {
        showMessage(replyText, Math.max(5000, replyText.length * 50));
    }
    
    // Show speaking animation
    setExpression('happy');
    startTalking();
    
    // Stop talking animation after a delay (adjust based on message length)
    const duration = Math.max(2000, replyText.length * 50);
    setTimeout(() => {
        stopTalking();
        setExpressionByGrid(1, 0); // Idle uses (1,0) only
        hideMessage();
    }, duration);
}

// ============================================
// TEST FUNCTIONS (for UI panel buttons)
// ============================================

export function testThinkingStart() {
    handleThinkingStart({
        type: 'thinking_start',
        data: { context: 'Test context' }
    });
}

export function testSuggestion() {
    handleSuggestion({
        type: 'suggestion',
        data: {
            app_name: 'Test App',
            message: 'This is a test suggestion message for testing the avatar response.'
        }
    });
}

export function testReply() {
    handleReply({
        type: 'reply',
        data: {
            message: 'This is a test reply message from the AI assistant. It should appear in the speech bubble above the avatar!'
        }
    });
}

export function testState(state) {
    handleStateMessage({
        type: 'state',
        state: state
    });
}

// Export all available states for UI
export const availableStates = Object.keys(stateMapping);

