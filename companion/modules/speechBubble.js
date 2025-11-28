// ============================================
// SPEECH BUBBLE MODULE
// Displays messages above the avatar's ornament
// ============================================

let speechBubble = null;
let speechBubbleText = null;
let canvasContainer = null;
let hideTimeout = null;
let resizeObserver = null;

// Offset from the center of the canvas to sit above the avatar's head
const HEAD_OFFSET_Y = 180;

export function initSpeechBubble() {
    speechBubble = document.getElementById('speech-bubble');
    speechBubbleText = document.getElementById('speech-bubble-text');
    canvasContainer = document.getElementById('canvas-container');

    // Keep the bubble aligned with the canvas container so it follows the avatar
    window.addEventListener('resize', positionSpeechBubble);
    if (canvasContainer && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => positionSpeechBubble());
        resizeObserver.observe(canvasContainer);
    }

    // Position once on init (even though hidden) so it snaps correctly on first show
    positionSpeechBubble();
}

export function showMessage(text, duration = 5000) {
    if (!speechBubble || !speechBubbleText) {
        console.warn('Speech bubble not initialized');
        return;
    }
    
    // Clear any existing timeout
    if (hideTimeout) {
        clearTimeout(hideTimeout);
    }
    
    // Set the message text
    speechBubbleText.textContent = text;

    // Position before showing to avoid popping in the wrong place
    positionSpeechBubble();
    
    // Show the bubble with animation
    speechBubble.classList.add('visible');
    
    // Auto-hide after duration (0 = don't auto-hide)
    if (duration > 0) {
        hideTimeout = setTimeout(() => {
            hideMessage();
        }, duration);
    }
}

export function hideMessage() {
    if (!speechBubble) return;
    
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
    
    speechBubble.classList.remove('visible');
}

function positionSpeechBubble() {
    if (!speechBubble || !canvasContainer) return;

    const rect = canvasContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    speechBubble.style.left = `${centerX}px`;
    speechBubble.style.top = `${centerY - HEAD_OFFSET_Y}px`;
}

// Export for global access
window.showSpeechBubble = showMessage;
window.hideSpeechBubble = hideMessage;

