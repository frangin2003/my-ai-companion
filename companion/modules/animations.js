// ============================================
// ANIMATION SYSTEM MODULE
// Handles all body animations
// ============================================

import { 
    characterGroup, bodyGroup, neckJoint,
    leftArmJoint, rightArmJoint,
    leftLegJoint, rightLegJoint 
} from './character.js';

// Default pose (stored after character is built)
let defaultPose = null;

// Animation state
let currentAnimation = 'idle';
let animationTime = 0;
let isOneShot = false;
let oneShotComplete = false;

export function storeDefaultPose() {
    defaultPose = {
        bodyY: bodyGroup.position.y,
        bodyRotX: bodyGroup.rotation.x,
        bodyRotY: bodyGroup.rotation.y,
        bodyRotZ: bodyGroup.rotation.z,
        leftArmJointRotZ: leftArmJoint.rotation.z,
        leftArmJointRotX: leftArmJoint.rotation.x,
        rightArmJointRotZ: rightArmJoint.rotation.z,
        rightArmJointRotX: rightArmJoint.rotation.x,
        leftLegJointRotZ: leftLegJoint.rotation.z,
        leftLegJointRotX: leftLegJoint.rotation.x,
        rightLegJointRotZ: rightLegJoint.rotation.z,
        rightLegJointRotX: rightLegJoint.rotation.x,
        neckRotX: neckJoint.rotation.x,
        neckRotZ: neckJoint.rotation.z,
        characterRotY: characterGroup.rotation.y,
        characterY: characterGroup.position.y
    };
}

function resetPose() {
    if (!defaultPose) return;
    
    bodyGroup.position.y = defaultPose.bodyY;
    bodyGroup.rotation.x = defaultPose.bodyRotX;
    bodyGroup.rotation.y = defaultPose.bodyRotY;
    bodyGroup.rotation.z = defaultPose.bodyRotZ;
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ;
    leftArmJoint.rotation.x = defaultPose.leftArmJointRotX;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ;
    rightArmJoint.rotation.x = defaultPose.rightArmJointRotX;
    leftLegJoint.rotation.z = defaultPose.leftLegJointRotZ;
    leftLegJoint.rotation.x = defaultPose.leftLegJointRotX;
    rightLegJoint.rotation.z = defaultPose.rightLegJointRotZ;
    rightLegJoint.rotation.x = defaultPose.rightLegJointRotX;
    neckJoint.rotation.x = defaultPose.neckRotX;
    neckJoint.rotation.z = defaultPose.neckRotZ;
    characterGroup.rotation.y = defaultPose.characterRotY;
    characterGroup.position.y = defaultPose.characterY;
}

// Animation functions
function animateIdle(t) {
    const breathe = Math.sin(t * 2) * 0.02;
    bodyGroup.position.y = defaultPose.bodyY + breathe;
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * 1.5) * 0.05;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * 1.5 + 0.5) * 0.05;
    neckJoint.rotation.z = Math.sin(t * 0.8) * 0.03;
}

function animateDance(t) {
    const bounce = Math.abs(Math.sin(t * 6)) * 0.1;
    bodyGroup.position.y = defaultPose.bodyY + bounce;
    bodyGroup.rotation.z = Math.sin(t * 3) * 0.15;
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * 6) * 0.5;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * 6 + Math.PI) * 0.5;
    leftLegJoint.rotation.x = Math.sin(t * 6) * 0.3;
    rightLegJoint.rotation.x = Math.sin(t * 6 + Math.PI) * 0.3;
    neckJoint.rotation.z = Math.sin(t * 3) * 0.1;
}

function animateYata(t) {
    const duration = 1.0;
    const progress = Math.min(t / duration, 1);
    
    if (progress < 0.3) {
        const p = progress / 0.3;
        bodyGroup.rotation.z = -0.1 * p;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 0.3 * p;
        rightArmJoint.rotation.x = 0.3 * p;
        neckJoint.rotation.z = -0.1 * p;
    } else if (progress < 0.5) {
        const p = (progress - 0.3) / 0.2;
        bodyGroup.rotation.z = -0.1 + 0.2 * p;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 0.3 - 1.3 * p;
        rightArmJoint.rotation.x = 0.3 - 0.8 * p;
        bodyGroup.position.y = defaultPose.bodyY + 0.15 * p;
        neckJoint.rotation.z = -0.1 + 0.2 * p;
    } else if (progress < 0.8) {
        bodyGroup.rotation.z = 0.1;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0;
        rightArmJoint.rotation.x = -0.5;
        bodyGroup.position.y = defaultPose.bodyY + 0.15;
        neckJoint.rotation.z = 0.1;
    } else {
        const p = (progress - 0.8) / 0.2;
        bodyGroup.rotation.z = 0.1 * (1 - p);
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0 * (1 - p);
        rightArmJoint.rotation.x = -0.5 * (1 - p);
        bodyGroup.position.y = defaultPose.bodyY + 0.15 * (1 - p);
        neckJoint.rotation.z = 0.1 * (1 - p);
    }
    
    if (progress >= 1) oneShotComplete = true;
}

function animateSleep(t) {
    const breathe = Math.sin(t * 1) * 0.03;
    bodyGroup.position.y = defaultPose.bodyY + breathe - 0.05;
    neckJoint.rotation.x = 0.3;
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + 0.3;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 0.3;
    bodyGroup.rotation.z = Math.sin(t * 0.5) * 0.02;
}

function animateWalk(t) {
    const speed = 4;
    leftLegJoint.rotation.x = Math.sin(t * speed) * 0.4;
    rightLegJoint.rotation.x = Math.sin(t * speed + Math.PI) * 0.4;
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * speed + Math.PI) * 0.2;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * speed) * 0.2;
    bodyGroup.position.y = defaultPose.bodyY + Math.abs(Math.sin(t * speed * 2)) * 0.03;
    bodyGroup.rotation.z = Math.sin(t * speed) * 0.05;
}

function animateRun(t) {
    const speed = 8;
    leftLegJoint.rotation.x = Math.sin(t * speed) * 0.6;
    rightLegJoint.rotation.x = Math.sin(t * speed + Math.PI) * 0.6;
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * speed + Math.PI) * 0.4;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * speed) * 0.4;
    bodyGroup.position.y = defaultPose.bodyY + Math.abs(Math.sin(t * speed * 2)) * 0.08;
    bodyGroup.rotation.x = 0.1;
    bodyGroup.rotation.z = Math.sin(t * speed) * 0.08;
}

function animateFloat(t) {
    const floatHeight = Math.sin(t * 1.5) * 0.1;
    characterGroup.position.y = floatHeight + 0.2;
    bodyGroup.rotation.z = Math.sin(t * 0.8) * 0.1;
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ - 0.3 + Math.sin(t * 2) * 0.1;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 0.3 + Math.sin(t * 2 + 1) * 0.1;
    leftLegJoint.rotation.z = defaultPose.leftLegJointRotZ + 0.1 + Math.sin(t * 1.2) * 0.05;
    rightLegJoint.rotation.z = defaultPose.rightLegJointRotZ - 0.1 + Math.sin(t * 1.2 + 0.5) * 0.05;
    neckJoint.rotation.z = Math.sin(t * 0.7) * 0.1;
}

function animateRoll(t) {
    const duration = 1.5;
    const progress = Math.min(t / duration, 1);
    
    characterGroup.rotation.y = defaultPose.characterRotY + progress * Math.PI * 4;
    
    if (progress < 0.5) {
        characterGroup.position.y = progress * 0.3;
        leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ - progress * 1.0;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + progress * 1.0;
    } else {
        characterGroup.position.y = 0.3 - (progress - 0.5) * 0.6;
        leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ - 1.0 + (progress - 0.5) * 2.0;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 1.0 - (progress - 0.5) * 2.0;
    }
    
    leftLegJoint.rotation.x = Math.sin(progress * Math.PI) * 0.5;
    
    if (progress >= 1) oneShotComplete = true;
}

function animateWave(t) {
    const duration = 2.0;
    const progress = Math.min(t / duration, 1);
    const headTilt = -Math.PI / 9;
    
    if (progress < 0.2) {
        const p = progress / 0.2;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0 * p;
        rightArmJoint.rotation.x = -0.5 * p;
        neckJoint.rotation.z = headTilt * p;
    } else if (progress < 0.8) {
        const waveProgress = (progress - 0.2) / 0.6;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0;
        rightArmJoint.rotation.x = -0.5 + Math.sin(waveProgress * Math.PI * 6) * 0.3;
        neckJoint.rotation.z = headTilt;
    } else {
        const p = (progress - 0.8) / 0.2;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0 * (1 - p);
        rightArmJoint.rotation.x = -0.5 * (1 - p);
        neckJoint.rotation.z = headTilt * (1 - p);
    }
    
    bodyGroup.rotation.z = Math.sin(t * 3) * 0.05;
    
    if (progress >= 1) oneShotComplete = true;
}

export function playAnimation(name) {
    resetPose();
    currentAnimation = name;
    animationTime = 0;
    isOneShot = ['yata', 'roll', 'wave'].includes(name);
    oneShotComplete = false;
    
    // Update button states
    document.querySelectorAll('.anim-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-anim="${name}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

export function updateAnimation(deltaTime) {
    if (!defaultPose) return;
    
    animationTime += deltaTime / 1000;
    
    if (isOneShot && oneShotComplete) {
        playAnimation('idle');
        return;
    }
    
    switch (currentAnimation) {
        case 'idle': animateIdle(animationTime); break;
        case 'dance': animateDance(animationTime); break;
        case 'yata': animateYata(animationTime); break;
        case 'sleep': animateSleep(animationTime); break;
        case 'walk': animateWalk(animationTime); break;
        case 'run': animateRun(animationTime); break;
        case 'float': animateFloat(animationTime); break;
        case 'roll': animateRoll(animationTime); break;
        case 'wave': animateWave(animationTime); break;
    }
}

// Export for global access
window.playAnimation = playAnimation;

