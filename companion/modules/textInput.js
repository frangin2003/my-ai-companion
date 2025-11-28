// ============================================
// TEXT INPUT MODULE
// Handles text message sending
// ============================================

import { sendMessage } from './websocket.js';

let textInputVisible = false;

export function sendTextMessage(text) {
    if (!text || !text.trim()) return;
    
    // Format per SERVER_SPEC.md: type="message", data.content
    sendMessage('message', {
        data: {
            content: text.trim()
        }
    });
    
    console.log('📝 Text sent:', text);
}

export function initTextInput() {
    const input = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-text-btn');
    
    if (!input || !sendBtn) return;
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = input.value;
            if (text.trim()) {
                sendTextMessage(text);
                input.value = '';
            }
        }
    });
    
    sendBtn.addEventListener('click', () => {
        const text = input.value;
        if (text.trim()) {
            sendTextMessage(text);
            input.value = '';
        }
    });
}

export function toggleTextInput() {
    const container = document.getElementById('text-input-container');
    const toggleBtn = document.getElementById('toggle-textbox-btn');
    
    textInputVisible = !textInputVisible;
    
    if (container) {
        if (textInputVisible) {
            container.classList.remove('hidden');
            const input = document.getElementById('text-input');
            if (input) setTimeout(() => input.focus(), 100);
        } else {
            container.classList.add('hidden');
        }
    }
    
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', textInputVisible);
    }
}

export function initToggleButton() {
    const toggleBtn = document.getElementById('toggle-textbox-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTextInput);
    }
}

// Export for global access
window.sendTextMessage = sendTextMessage;
window.toggleTextInput = toggleTextInput;

