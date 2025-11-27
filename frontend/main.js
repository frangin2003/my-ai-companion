import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(3, 10, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Floor
const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
);
mesh.rotation.x = -Math.PI / 2;
mesh.receiveShadow = true;
scene.add(mesh);

// --- CHARACTER BUILD ---
const characterGroup = new THREE.Group();
scene.add(characterGroup);

// Materials
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
const blushMat = new THREE.MeshStandardMaterial({ color: 0xffaaAA, roughness: 0.5 });

// 1. Body (Egg shape)
const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
// Scale to make it egg-like (tapered top handled by scaling or just simple sphere scale)
bodyGeo.applyMatrix4(new THREE.Matrix4().makeScale(1, 1.3, 1)); 
const body = new THREE.Mesh(bodyGeo, whiteMat);
body.position.y = 1.3;
body.castShadow = true;
characterGroup.add(body);

// 2. Head (Round, sitting on top of body slightly merged)
// The prompt asks for "Round white head" AND "Egg shaped body".
// Let's put a head sphere on top of the egg body.
const headGeo = new THREE.SphereGeometry(0.7, 32, 32);
const head = new THREE.Mesh(headGeo, whiteMat);
head.position.y = 1.2; // Relative to body center? No, let's make separate or parent.
// Let's parent head to body for easier group animation, or keep separate logic.
// Positioning head relative to body (body center is at 1.3).
// Body height is approx 1.3*2 = 2.6. Top is around 1.3 + 1.3 = 2.6.
// Actually, "Egg shaped body" implies the whole thing might be the character, but "Head" implies distinction.
// Let's place the head slightly overlapping the top of the egg body.
head.position.set(0, 1.1, 0); // Local to body?
body.add(head);

// 3. Kawaii Eyes
const eyeGeo = new THREE.SphereGeometry(0.12, 32, 32);
const eyeLeft = new THREE.Mesh(eyeGeo, blackMat);
eyeLeft.position.set(0.25, 0.1, 0.6); // Relative to head
head.add(eyeLeft);

const eyeRight = new THREE.Mesh(eyeGeo, blackMat);
eyeRight.position.set(-0.25, 0.1, 0.6);
head.add(eyeRight);

// Eye shine (tiny white spheres)
const shineGeo = new THREE.SphereGeometry(0.03, 16, 16);
const shineLeft = new THREE.Mesh(shineGeo, whiteMat);
shineLeft.position.set(0.05, 0.05, 0.1); // Relative to eye
eyeLeft.add(shineLeft);

const shineRight = new THREE.Mesh(shineGeo, whiteMat);
shineRight.position.set(0.05, 0.05, 0.1);
eyeRight.add(shineRight);

// 4. Mouth
// Simple semi-circle line or small capsule
const mouthGeo = new THREE.TorusGeometry(0.1, 0.03, 16, 32, Math.PI);
const mouth = new THREE.Mesh(mouthGeo, blackMat);
mouth.rotation.x = Math.PI; // curve down (smile) is default torus arc? no, usually full circle. 
// Torus arc Math.PI creates a half circle. 
// Default orientation needs adjustment.
mouth.rotation.z = Math.PI; 
mouth.position.set(0, -0.2, 0.62);
head.add(mouth);

// 5. Tiny Arms
const armGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
const armLeft = new THREE.Mesh(armGeo, whiteMat);
armLeft.position.set(0.9, 0.2, 0);
armLeft.rotation.z = -Math.PI / 4;
body.add(armLeft);

const armRight = new THREE.Mesh(armGeo, whiteMat);
armRight.position.set(-0.9, 0.2, 0);
armRight.rotation.z = Math.PI / 4;
body.add(armRight);

// 6. Tiny Legs
const legGeo = new THREE.CapsuleGeometry(0.12, 0.4, 4, 8);
const legLeft = new THREE.Mesh(legGeo, whiteMat);
legLeft.position.set(0.4, -1.1, 0);
body.add(legLeft);

const legRight = new THREE.Mesh(legGeo, whiteMat);
legRight.position.set(-0.4, -1.1, 0);
body.add(legRight);


// --- ANIMATION STATE ---
let currentAnim = 'idle';
let time = 0;

// Helper for resetting transforms
function resetPose() {
    body.position.y = 1.3;
    body.rotation.set(0, 0, 0);
    body.scale.set(1, 1, 1);
    
    head.rotation.set(0, 0, 0);
    head.position.set(0, 1.1, 0);
    
    armLeft.rotation.z = -Math.PI / 4;
    armRight.rotation.z = Math.PI / 4;
    
    // Reset eyes
    eyeLeft.scale.set(1, 1, 1);
    eyeRight.scale.set(1, 1, 1);
    
    // Reset mouth
    mouth.scale.set(1, 1, 1);
    mouth.rotation.z = Math.PI; // Smile
    
    // Reset color
    body.material.color.setHex(0xffffff);
    head.material.color.setHex(0xffffff);
}

window.setAnimation = (animName) => {
    currentAnim = animName;
    resetPose();
    console.log("Switching to", animName);
};

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    time += 0.05;
    
    controls.update();

    // Logic per state
    switch (currentAnim) {
        case 'idle':
            // Float/Breathe
            body.position.y = 1.3 + Math.sin(time) * 0.05;
            body.scale.y = 1 + Math.sin(time * 2) * 0.01;
            break;

        case 'speak':
            // Mouth flap / scale
            mouth.scale.y = 0.5 + Math.abs(Math.sin(time * 5));
            // Slight body bob
            body.position.y = 1.3 + Math.sin(time * 10) * 0.02;
            break;

        case 'laugh':
            // Bouncing heavily
            body.position.y = 1.3 + Math.abs(Math.sin(time * 8)) * 0.2;
            // Mouth open wide
            mouth.scale.set(1.5, 2, 1);
            // Head tilt back
            head.rotation.x = -0.2 + Math.sin(time * 8) * 0.1;
            break;

        case 'think':
            // Look up and side
            head.rotation.y = 0.5;
            head.rotation.x = -0.3;
            // Finger/Arm up (simplified rotation)
            armRight.rotation.z = Math.PI - 0.5; // Lift arm
            // Eye squint?
            eyeLeft.scale.y = 0.5;
            eyeRight.scale.y = 0.5;
            break;

        case 'sleep':
            // Close eyes
            eyeLeft.scale.y = 0.1;
            eyeRight.scale.y = 0.1;
            // Breathe slow
            body.scale.set(1.1, 0.9, 1.1); // Compressed
            body.position.y = 1.3 + Math.sin(time * 0.5) * 0.02;
            break;

        case 'jump':
            // Jump of joy
            const jumpHeight = Math.abs(Math.sin(time * 5));
            body.position.y = 1.3 + jumpHeight * 2;
            // Arms up
            if (jumpHeight > 0.5) {
                armLeft.rotation.z = Math.PI - 0.5;
                armRight.rotation.z = -Math.PI + 0.5;
            } else {
                armLeft.rotation.z = -Math.PI / 4;
                armRight.rotation.z = Math.PI / 4;
            }
            break;

        case 'dance':
            // Spin and sway
            body.rotation.y = Math.sin(time * 2) * 0.5;
            body.position.x = Math.sin(time) * 0.5;
            // Arms waving
            armLeft.rotation.z = Math.sin(time * 5);
            armRight.rotation.z = Math.cos(time * 5);
            break;

        case 'angry':
            // Shake
            body.position.x = Math.sin(time * 50) * 0.05;
            // Red color
            body.material.color.setHex(0xffaaaa);
            head.material.color.setHex(0xffaaaa);
            // Eyebrows logic (simplified: tilt eyes)
            // Not implemented eyebrows, but we can tilt head down
            head.rotation.x = 0.2;
            break;
    }

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();




