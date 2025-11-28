// ============================================
// UI MODULE
// Handles UI controls, debug mode, panel toggling
// ============================================

import { setExpression, startTalking, stopTalking } from './face.js';
import { playAnimation } from './animations.js';
import { joints } from './character.js';
import { scene, camera, renderer } from './scene.js';
import { testThinkingStart, testSuggestion, testReply, testState, availableStates } from './stateHandler.js';

let axisHelper = null;
let debugPanel = null;

export function setDebugHelpers(axis, panel) {
    axisHelper = axis;
    debugPanel = panel;
}

export function initUIControls() {
    // Expression radio buttons
    document.querySelectorAll('input[name="expression"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            setExpression(e.target.value);
        });
    });
    
    // Talk button
    let talkingActive = false;
    const talkBtn = document.getElementById('talk-btn');
    if (talkBtn) {
        talkBtn.addEventListener('click', () => {
            talkingActive = !talkingActive;
            if (talkingActive) {
                startTalking();
                talkBtn.textContent = '🛑 Stop Talking';
                talkBtn.classList.add('talking');
            } else {
                stopTalking();
                talkBtn.textContent = '🗣️ Start Talking';
                talkBtn.classList.remove('talking');
            }
        });
    }
    
    // Animation buttons
    document.querySelectorAll('.anim-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const animName = btn.getAttribute('data-anim');
            playAnimation(animName);
        });
    });
    
    // State test buttons
    document.querySelectorAll('.state-test-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const testType = btn.getAttribute('data-test');
            switch(testType) {
                case 'thinking_start':
                    testThinkingStart();
                    break;
                case 'suggestion':
                    testSuggestion();
                    break;
                case 'reply':
                    testReply();
                    break;
                default:
                    // Test a state
                    if (availableStates.includes(testType)) {
                        testState(testType);
                    }
            }
        });
    });
    
    // Debug toggle
    const debugToggle = document.getElementById('debug-toggle');
    if (debugToggle) {
        debugToggle.checked = false;
        debugToggle.addEventListener('change', updateDebug);
        updateDebug();
    }
}

function updateDebug() {
    const debugToggle = document.getElementById('debug-toggle');
    const visible = debugToggle ? debugToggle.checked : false;
    
    joints.forEach(j => j.visible = visible);
    if (axisHelper) axisHelper.visible = visible;
    if (debugPanel) debugPanel.visible = visible;
}

export function isDebugMode() {
    const debugToggle = document.getElementById('debug-toggle');
    return debugToggle ? debugToggle.checked : false;
}

// UI Panel Toggle
const COMPACT_WIDTH = 350;
const COMPACT_HEIGHT = 450;
const EXPANDED_WIDTH = 700;
const EXPANDED_HEIGHT = 500;

let uiPanelVisible = false;

export function initUIPanel() {
    const uiPanel = document.getElementById('ui-panel');
    const canvasContainer = document.getElementById('canvas-container');
    
    if (uiPanel) {
        uiPanel.style.display = 'none';
    }
    
    window.toggleUIPanel = function() {
        uiPanelVisible = !uiPanelVisible;
        
        if (uiPanel) {
            uiPanel.style.display = uiPanelVisible ? 'block' : 'none';
        }
        
        if (window.electronAPI) {
            if (uiPanelVisible) {
                window.electronAPI.resizeWindow(EXPANDED_WIDTH, EXPANDED_HEIGHT);
            } else {
                window.electronAPI.resizeWindow(COMPACT_WIDTH, COMPACT_HEIGHT);
            }
        }
        
        if (canvasContainer) {
            if (uiPanelVisible) {
                canvasContainer.classList.add('panel-open');
            } else {
                canvasContainer.classList.remove('panel-open');
            }
        }
        
        setTimeout(() => {
            if (camera && renderer && canvasContainer) {
                camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
            }
        }, 50);
    };
    
    // F1 shortcut
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            window.toggleUIPanel();
        }
    });
}

