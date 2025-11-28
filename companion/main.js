// ============================================
// MAIN.JS - Application Entry Point
// Imports and initializes all modules
// ============================================

// --- Module Imports ---
import { initScene, render } from './modules/scene.js';
import { buildCharacter, updateConnectionStatus, updateOrnament } from './modules/character.js';
import { buildCape, updateCapePhysics } from './modules/cape.js';
import { updateBlink, updateTalking } from './modules/face.js';
import { storeDefaultPose, updateAnimation } from './modules/animations.js';
import { initUIControls, initUIPanel, setDebugHelpers } from './modules/ui.js';
import { 
    connectWebSocket, 
    setMessageCallback, 
    setConnectionStatusCallback 
} from './modules/websocket.js';
import { 
    startRecording, 
    stopRecording, 
    setTalkingCallbacks,
    setRecordingCallbacks,
    getIsRecording
} from './modules/audio.js';
import { 
    showWaveform, 
    hideWaveform, 
    startWaveformAnimation, 
    stopWaveformAnimation 
} from './modules/waveform.js';
import { 
    initTextInput, 
    initToggleButton, 
    toggleTextInput 
} from './modules/textInput.js';
import { handleWebSocketMessage } from './modules/stateHandler.js';
import { startTalking, stopTalking } from './modules/face.js';
import { initSpeechBubble } from './modules/speechBubble.js';

// ============================================
// INITIALIZATION
// ============================================

// Initialize Three.js scene
initScene();

// Build the character
const characterParts = buildCharacter();

// Build the cape
buildCape();

// Store default pose for animations
storeDefaultPose();

// Set debug helpers reference
setDebugHelpers(characterParts.axisHelper, null);

// Initialize UI controls
initUIControls();
initUIPanel();

// Initialize speech bubble
initSpeechBubble();

// ============================================
// WEBSOCKET SETUP
// ============================================

// Set up WebSocket callbacks
setMessageCallback(handleWebSocketMessage);
setConnectionStatusCallback(updateConnectionStatus);

// ============================================
// AUDIO CALLBACKS
// ============================================

// When audio playback starts/stops, control talking animation
setTalkingCallbacks(startTalking, stopTalking);

// When recording starts/stops, control waveform
setRecordingCallbacks(
    () => {
        showWaveform();
        startWaveformAnimation();
    },
    () => {
        stopWaveformAnimation();
        hideWaveform();
    }
);

// ============================================
// INPUT INITIALIZATION
// ============================================

// Initialize text input
initTextInput();
initToggleButton();

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

// T key to toggle text input
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyT' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleTextInput();
    }
});
    
// Push-to-Talk with RIGHT SHIFT (works anytime)
window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftRight') {
        e.preventDefault();
        if (!getIsRecording()) {
            startRecording();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftRight') {
        e.preventDefault();
        if (getIsRecording()) {
            stopRecording();
        }
    }
});

// ============================================
// ANIMATION LOOP
// ============================================

let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);
    
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    
    const time = now * 0.002;
    
    // Update ornament animation
    updateOrnament(time);
    
    // Update face animations
    updateBlink(deltaTime);
    updateTalking(deltaTime);
    
    // Update body animations
    updateAnimation(deltaTime);
    
    // Update cape physics
    updateCapePhysics(deltaTime);

    // Render the scene
    render();
}

// ============================================
// START APPLICATION
// ============================================

// Connect to WebSocket server
connectWebSocket();

// Start the animation loop
animate();

console.log('🎭 AI Companion Avatar initialized!');
console.log('📁 Modular architecture loaded');
console.log('   - modules/websocket.js    → WebSocket connection');
console.log('   - modules/audio.js        → Audio playback & recording');
console.log('   - modules/waveform.js     → Waveform visualization');
console.log('   - modules/textInput.js    → Text input handling');
console.log('   - modules/scene.js        → Three.js scene setup');
console.log('   - modules/character.js    → Character construction');
console.log('   - modules/face.js         → Face expressions');
console.log('   - modules/cape.js         → Cape physics');
console.log('   - modules/animations.js   → Body animations');
console.log('   - modules/stateHandler.js → Backend state handling');
console.log('   - modules/ui.js           → UI controls');
