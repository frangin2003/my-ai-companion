// ============================================
// FACE EXPRESSIONS MODULE
// Handles face texture, expressions, blinking, talking
// ============================================

import * as THREE from 'three';
import { textureLoader } from './scene.js';

// Face sprite sheet configuration
const FACE_GRID_COLS = 8;
const FACE_GRID_ROWS = 4;

// Expression map
export const faceExpressions = {
    neutral: { col: 0, row: 0 },
    happy: { col: 1, row: 0 },
    wink: { col: 2, row: 0 },
    sleepy: { col: 3, row: 0 },
    worried: { col: 4, row: 0 },
    surprised: { col: 5, row: 0 },
    shocked: { col: 6, row: 0 },
    angry: { col: 7, row: 0 },
    neutral2: { col: 0, row: 1 },
    closed: { col: 1, row: 1 },
    squint: { col: 2, row: 1 },
    sad: { col: 3, row: 1 },
    cry: { col: 4, row: 1 },
    fear: { col: 5, row: 1 },
    annoyed: { col: 6, row: 1 },
    grumpy: { col: 7, row: 1 },
    talking1: { col: 0, row: 2 },
    talking2: { col: 1, row: 2 },
    excited: { col: 2, row: 2 },
    love: { col: 3, row: 2 },
    sparkle: { col: 4, row: 2 },
    dizzy: { col: 5, row: 2 },
    smirk: { col: 6, row: 2 },
    meh: { col: 7, row: 2 },
    talking3: { col: 0, row: 3 },
    bored: { col: 1, row: 3 },
    thinking: { col: 2, row: 3 },
    confused: { col: 3, row: 3 },
    tired: { col: 4, row: 3 },
    dead: { col: 5, row: 3 },
    sassy: { col: 6, row: 3 },
    rage: { col: 7, row: 3 }
};

// State
let faceTexture = null;
let faceMesh = null;
let currentExpression = 'neutral2';
let preBlinkExpression = 'neutral2';

// Blink state
let blinkTimer = 0;
let isBlinking = false;
const BLINK_INTERVAL = 3000;
const BLINK_DURATION = 150;

// Talking state
let isTalking = false;
let talkTimer = 0;
const TALK_SPEED = 120;
let savedExpression = 'neutral';
// Talk frames as grid coordinates: [col, row]
const talkFrames = [
    { col: 0, row: 0 },  // neutral
    { col: 0, row: 1 },  // neutral2
    { col: 1, row: 0 },  // happy
    { col: 1, row: 1 }   // closed
];
let talkFrameIndex = 0;

// Face material
export const faceMaterial = new THREE.MeshBasicMaterial({ 
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false
});

export function setFaceMesh(mesh) {
    faceMesh = mesh;
}

export function loadFaceTexture(texturePath) {
    console.log('Loading face texture from:', texturePath);
    
    const loader = new THREE.TextureLoader();
    loader.load(
        texturePath,
        (texture) => {
            console.log('Texture loaded successfully!');
            faceTexture = texture;
            faceTexture.colorSpace = THREE.SRGBColorSpace;
            
            faceTexture.repeat.set(1 / FACE_GRID_COLS, 1 / FACE_GRID_ROWS);
            faceTexture.wrapS = THREE.ClampToEdgeWrapping;
            faceTexture.wrapT = THREE.ClampToEdgeWrapping;
            faceTexture.magFilter = THREE.LinearFilter;
            faceTexture.minFilter = THREE.LinearFilter;
            
            faceMaterial.map = faceTexture;
            faceMaterial.needsUpdate = true;
            
            if (faceMesh) {
                faceMesh.material = faceMaterial;
                faceMesh.material.needsUpdate = true;
            }
            
            setExpression('neutral2');
            console.log('Available expressions:', Object.keys(faceExpressions).join(', '));
        },
        null,
        (error) => {
            console.error('Error loading face texture:', error);
        }
    );
}

export function setExpression(expressionName) {
    if (!faceTexture) return;
    
    const expr = faceExpressions[expressionName];
    if (!expr) {
        console.warn(`Expression "${expressionName}" not found`);
        return;
    }
    
    const offsetX = expr.col / FACE_GRID_COLS;
    const offsetY = 1 - ((expr.row + 1) / FACE_GRID_ROWS);
    
    faceTexture.offset.set(offsetX, offsetY);
    currentExpression = expressionName;
}

export function setExpressionByGrid(col, row) {
    if (!faceTexture) return;
    
    const offsetX = col / FACE_GRID_COLS;
    const offsetY = 1 - ((row + 1) / FACE_GRID_ROWS);
    
    faceTexture.offset.set(offsetX, offsetY);
    currentExpression = `grid_${col}_${row}`;
}

export function startTalking() {
    if (!isTalking) {
        savedExpression = currentExpression;
        isTalking = true;
        talkTimer = 0;
    }
}

export function stopTalking() {
    isTalking = false;
    setExpression(savedExpression);
}

export function updateBlink(deltaTime) {
    if (!faceTexture) return;
    
    blinkTimer += deltaTime;
    
    if (!isBlinking && blinkTimer > BLINK_INTERVAL) {
        isBlinking = true;
        blinkTimer = 0;
        preBlinkExpression = currentExpression;
        setExpression('sleepy');
    } else if (isBlinking && blinkTimer > BLINK_DURATION) {
        isBlinking = false;
        blinkTimer = 0;
        setExpression(preBlinkExpression);
    }
}

export function updateTalking(deltaTime) {
    if (!faceTexture || !isTalking) return;
    
    talkTimer += deltaTime;
    
    if (talkTimer > TALK_SPEED) {
        talkTimer = 0;
        talkFrameIndex = (talkFrameIndex + 1) % talkFrames.length;
        const frame = talkFrames[talkFrameIndex];
        setExpressionByGrid(frame.col, frame.row);
    }
}

// Export for global access
window.loadFaceTexture = loadFaceTexture;
window.setExpression = setExpression;
window.setExpressionByGrid = setExpressionByGrid;
window.startTalking = startTalking;
window.stopTalking = stopTalking;

