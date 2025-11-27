import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe0e0e0); // Light grey background from image

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.5, 0);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// Floor (Shadow catcher)
const planeGeometry = new THREE.PlaneGeometry(50, 50);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// --- CHARACTER BUILD ---
const characterGroup = new THREE.Group();
scene.add(characterGroup);

// Colors
const COLOR_WHITE = 0xf5f5f5; // Head, Horns
const COLOR_BLUE = 0x3b75ba;  // Body, Limbs (Reference image blue)
const COLOR_BLACK = 0x111111; // Eyes
const COLOR_DIAMOND = 0x3b75ba; // Diamond (same blue as body usually, or lighter)

// Materials
const whiteMat = new THREE.MeshStandardMaterial({ color: COLOR_WHITE, roughness: 0.4 });
const blueMat = new THREE.MeshStandardMaterial({ color: COLOR_BLUE, roughness: 0.5 });
const blackMat = new THREE.MeshStandardMaterial({ color: COLOR_BLACK, roughness: 0.1 });
const diamondMat = new THREE.MeshStandardMaterial({ 
    color: COLOR_DIAMOND, 
    roughness: 0.2,
    emissive: 0x112244
});

// 1. Body (Blue, Egg/Rounded shape)
// The image shows a body that is wider at bottom, like a blob/egg
const bodyGeo = new THREE.CapsuleGeometry(0.7, 0.6, 4, 16); 
const body = new THREE.Mesh(bodyGeo, blueMat);
body.position.y = 0.9; // Legs will be below
body.castShadow = true;
characterGroup.add(body);

// 2. Head (White, Round/Oblate)
// Head sits on top of body.
const headGeo = new THREE.SphereGeometry(0.9, 32, 32);
// Flatten slightly? The image head looks quite round but maybe slightly wide.
headGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.25, 0.9, 0.9)); 
const head = new THREE.Mesh(headGeo, whiteMat);
head.position.y = 0.9; // Relative to body center? No, let's parent to body for easier movement or keep separate. 
// If we parent to body, head rotates with body. Let's attach to characterGroup and sync positions or parent to body.
// Parenting to body makes "breathing" affects both.
body.add(head);
head.position.set(0, 1.0, 0); // On top of the body capsule

// 3. Horns (White, Curved)
// Simple approximation: Cones rotated
const hornGeo = new THREE.ConeGeometry(0.15, 0.8, 16);
// Curve fix: Just a straight cone for now, titled outward
const hornLeft = new THREE.Mesh(hornGeo, whiteMat);
hornLeft.position.set(0.7, 0.6, 0); // Slightly closer than before
hornLeft.rotation.z = -Math.PI / 6;
head.add(hornLeft);

const hornRight = new THREE.Mesh(hornGeo, whiteMat);
hornRight.position.set(-0.7, 0.6, 0); // Slightly closer
hornRight.rotation.z = Math.PI / 6;
head.add(hornRight);

// 4. Floating Diamond (Blue)
const diamondGeo = new THREE.OctahedronGeometry(0.25, 0);
const diamond = new THREE.Mesh(diamondGeo, diamondMat);
diamond.position.set(0, 1.4, 0); // Floating above head
head.add(diamond);

// 5. Eyes (Black, Large Oval)
const eyeGeo = new THREE.SphereGeometry(0.22, 32, 32);

const eyeLeft = new THREE.Mesh(eyeGeo, blackMat);
// Position calculated to be on the surface of the head (approx Z=0.8 at this X/Y for new scale)
eyeLeft.position.set(0.42, 0.1, 0.8); 
eyeLeft.rotation.y = 0.5; // Rotate slightly outward
eyeLeft.scale.set(0.8, 1.2, 0.25); 
head.add(eyeLeft);

const eyeRight = new THREE.Mesh(eyeGeo, blackMat);
eyeRight.position.set(-0.42, 0.1, 0.8);
eyeRight.rotation.y = -0.5; // Rotate slightly outward
eyeRight.scale.set(0.8, 1.2, 0.25);
head.add(eyeRight);

// Highlights
const shineGeo = new THREE.SphereGeometry(0.05, 16, 16);
const shineLeft = new THREE.Mesh(shineGeo, whiteMat);
shineLeft.position.set(0.1, 0.1, 0.2); // Relative to eye
eyeLeft.add(shineLeft);

const shineRight = new THREE.Mesh(shineGeo, whiteMat);
shineRight.position.set(0.1, 0.1, 0.2);
eyeRight.add(shineRight);

// 6. Mouth (Custom Shape - D shape for open smile)
const mouthShape = new THREE.Shape();
// Start top left
mouthShape.moveTo(-0.15, 0.05);
// Curve down to bottom center, then up to top right
mouthShape.quadraticCurveTo(0, -0.25, 0.15, 0.05);
// Curve top slightly down/flat to close
mouthShape.quadraticCurveTo(0, 0, -0.15, 0.05);

const mouthGeo = new THREE.ShapeGeometry(mouthShape);
const mouth = new THREE.Mesh(mouthGeo, blackMat);
// Position calculated to be on surface (approx Z=0.83 for new scale)
mouth.position.set(0, -0.2, 0.83); 
// Slight rotation x to match chin curve
mouth.rotation.x = -0.1; 
head.add(mouth);

// 7. Arms (Blue, Tiny, spread out)
const armGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
const armLeft = new THREE.Mesh(armGeo, blueMat);
armLeft.position.set(0.8, 0.1, 0);
armLeft.rotation.z = -Math.PI / 3; // Spread out
body.add(armLeft);

const armRight = new THREE.Mesh(armGeo, blueMat);
armRight.position.set(-0.8, 0.1, 0);
armRight.rotation.z = Math.PI / 3;
body.add(armRight);

// 8. Legs (Blue, Tiny nubs)
const legGeo = new THREE.CapsuleGeometry(0.12, 0.3, 4, 8);
const legLeft = new THREE.Mesh(legGeo, blueMat);
legLeft.position.set(0.3, -0.7, 0);
body.add(legLeft);

const legRight = new THREE.Mesh(legGeo, blueMat);
legRight.position.set(-0.3, -0.7, 0);
body.add(legRight);


// --- ANIMATION STATE ---
let currentAnim = 'idle';
let time = 0;

function resetPose() {
    body.position.y = 0.9;
    body.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    
    // Reset arms
    armLeft.rotation.z = -Math.PI / 3;
    armRight.rotation.z = Math.PI / 3;
    
    // Reset diamond
    diamond.position.set(0, 1.4, 0);
    
    // Reset expression
    mouth.scale.set(1, 0.3, 1); // Default small smile
    mouth.rotation.set(0, 0, 0); // Reset rotation
    
    // Reset eyes
    eyeLeft.scale.set(0.8, 1.2, 0.25);
    eyeRight.scale.set(0.8, 1.2, 0.25);
    
    // Reset colors
    head.material.color.setHex(COLOR_WHITE);
}

window.setAnimation = (animName) => {
    currentAnim = animName;
    resetPose();
    console.log("Switching to", animName);
};

function animate() {
    requestAnimationFrame(animate);
    time += 0.05;
    controls.update();

    // Diamond idle float (always happens a bit)
    diamond.position.y = 1.4 + Math.sin(time * 2) * 0.05;
    diamond.rotation.y += 0.02;

    switch (currentAnim) {
        case 'idle':
            // Breathe
            body.scale.y = 1 + Math.sin(time * 1.5) * 0.02;
            body.scale.x = 1 - Math.sin(time * 1.5) * 0.01;
            body.scale.z = 1 - Math.sin(time * 1.5) * 0.01;
            break;

        case 'speak':
            // Bobbing
            body.position.y = 0.9 + Math.sin(time * 10) * 0.02;
            // Mouth flap
            const talkScale = 0.5 + Math.abs(Math.sin(time * 15)) * 0.5;
            mouth.scale.set(1, talkScale, 1);
            break;

        case 'laugh':
            // Shake vertically
            body.position.y = 0.9 + Math.abs(Math.sin(time * 12)) * 0.1;
            // Head tilt back
            head.rotation.x = -0.3 + Math.sin(time * 12) * 0.05;
            // Arms shake
            armLeft.rotation.z = -Math.PI / 3 + Math.sin(time * 20) * 0.2;
            armRight.rotation.z = Math.PI / 3 - Math.sin(time * 20) * 0.2;
            // Big open mouth
            mouth.scale.set(1.2, 1.5, 1);
            break;

        case 'think':
            // Head tilt
            head.rotation.z = 0.3;
            head.rotation.y = -0.2;
            // One arm up
            armRight.rotation.z = 2.5; // Hand to chin area
            armRight.position.set(-0.6, 0.3, 0.4);
            break;

        case 'sleep':
            // Squish down
            body.scale.set(1.1, 0.9, 1.1);
            body.position.y = 0.8;
            // Close eyes (flatten them)
            eyeLeft.scale.y = 0.1;
            eyeRight.scale.y = 0.1;
            // Zzz motion (sway slightly)
            body.rotation.z = Math.sin(time * 0.5) * 0.05;
            break;

        case 'jump':
            const jumpY = Math.abs(Math.sin(time * 5));
            body.position.y = 0.9 + jumpY * 1.5;
            // Legs kick back
            if (jumpY > 0.2) {
                legLeft.rotation.x = 0.5;
                legRight.rotation.x = 0.5;
                // Arms up
                armLeft.rotation.z = 2.5;
                armRight.rotation.z = -2.5;
            } else {
                legLeft.rotation.x = 0;
                legRight.rotation.x = 0;
            }
            break;

        case 'dance':
            // Spin
            characterGroup.rotation.y = Math.sin(time) * 0.5;
            // Step side to side
            body.position.x = Math.sin(time * 4) * 0.3;
            body.rotation.z = Math.cos(time * 4) * 0.1;
            // Arms wave
            armLeft.rotation.z = Math.sin(time * 5) * 1.5;
            armRight.rotation.z = Math.cos(time * 5) * 1.5;
            break;

        case 'angry':
            // Red tint
            head.material.color.setHex(0xffcccc);
            // Shake vigorously
            characterGroup.position.x = Math.sin(time * 50) * 0.05;
            // Lean forward
            body.rotation.x = 0.2;
            // Arms rigid down
            armLeft.rotation.z = 0;
            armRight.rotation.z = 0;
            // Frown (rotate mouth 180)
            mouth.rotation.z = Math.PI;
            mouth.rotation.x = 0.1; // Invert tilt
            mouth.position.y = -0.35; // Adjust position for frown
            break;
    }

    renderer.render(scene, camera);
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
