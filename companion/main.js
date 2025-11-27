import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8e8e8); // Light grey background like the reference

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// --- Texture Loader ---
const textureLoader = new THREE.TextureLoader();

// --- Materials ---
// Head and horns - plain color to match face texture background
const whiteMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xe3dfd4 // Slightly darker cream to match face background
});
const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90d9 }); // Soft blue like reference
const debugJointMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    transparent: true, 
    opacity: 0.5,
    wireframe: true
});

// --- Face Texture System ---

// Face expression sprite sheet settings
// Layout: 8 columns x 4 rows
const FACE_GRID_COLS = 8;
const FACE_GRID_ROWS = 4;

// Map expressions to grid positions (col, row) - 0-indexed
const faceExpressions = {
    neutral: { col: 0, row: 0 },
    happy: { col: 1, row: 0 },
    wink: { col: 2, row: 0 },
    sleepy: { col: 3, row: 0 },
    worried: { col: 4, row: 0 },
    surprised: { col: 5, row: 0 },
    shocked: { col: 6, row: 0 },
    angry: { col: 7, row: 0 },
    // Row 2
    neutral2: { col: 0, row: 1 },
    closed: { col: 1, row: 1 },
    squint: { col: 2, row: 1 },
    sad: { col: 3, row: 1 },
    cry: { col: 4, row: 1 },
    fear: { col: 5, row: 1 },
    annoyed: { col: 6, row: 1 },
    grumpy: { col: 7, row: 1 },
    // Row 3
    talking1: { col: 0, row: 2 },
    talking2: { col: 1, row: 2 },
    excited: { col: 2, row: 2 },
    love: { col: 3, row: 2 },
    sparkle: { col: 4, row: 2 },
    dizzy: { col: 5, row: 2 },
    smirk: { col: 6, row: 2 },
    meh: { col: 7, row: 2 },
    // Row 4
    talking3: { col: 0, row: 3 },
    bored: { col: 1, row: 3 },
    thinking: { col: 2, row: 3 },
    confused: { col: 3, row: 3 },
    tired: { col: 4, row: 3 },
    dead: { col: 5, row: 3 },
    sassy: { col: 6, row: 3 },
    rage: { col: 7, row: 3 }
};

// Face texture and material (separate from head)
let faceTexture = null;
let faceMesh = null;
const faceMaterial = new THREE.MeshBasicMaterial({ 
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false
});

// Current expression state
let currentExpression = 'neutral';
let preBlinkExpression = 'neutral';

// Load face texture
function loadFaceTexture(texturePath) {
    console.log('Loading face texture from:', texturePath);
    
    textureLoader.load(
        texturePath,
        (texture) => {
            console.log('Texture loaded successfully!', texture);
            faceTexture = texture;
            faceTexture.colorSpace = THREE.SRGBColorSpace;
            
            // Set up for sprite sheet - show 1 cell at a time
            faceTexture.repeat.set(1 / FACE_GRID_COLS, 1 / FACE_GRID_ROWS);
            faceTexture.wrapS = THREE.ClampToEdgeWrapping;
            faceTexture.wrapT = THREE.ClampToEdgeWrapping;
            faceTexture.magFilter = THREE.LinearFilter;
            faceTexture.minFilter = THREE.LinearFilter;
            
            faceMaterial.map = faceTexture;
            faceMaterial.needsUpdate = true;
            
            // Make sure face mesh uses updated material
            if (faceMesh) {
                faceMesh.material = faceMaterial;
                faceMesh.material.needsUpdate = true;
            }
            
            // Set initial expression (first cell)
            setExpression('neutral');
            
            console.log('Face texture applied! Use setExpression("name") to change.');
            console.log('Available:', Object.keys(faceExpressions).join(', '));
        },
        (progress) => {
            console.log('Loading progress:', progress);
        },
        (error) => {
            console.error('Error loading face texture:', error);
        }
    );
}

// Set face expression by name or by grid position
function setExpression(expressionName) {
    if (!faceTexture) return;
    
    let col, row;
    
    if (typeof expressionName === 'string') {
        const expr = faceExpressions[expressionName];
        if (!expr) {
            console.warn(`Expression "${expressionName}" not found`);
            return;
        }
        col = expr.col;
        row = expr.row;
        currentExpression = expressionName;
    }
    
    // Calculate UV offset for the sprite sheet
    const offsetX = col / FACE_GRID_COLS;
    const offsetY = 1 - ((row + 1) / FACE_GRID_ROWS); // Flip Y
    
    faceTexture.offset.set(offsetX, offsetY);
}

// Set expression by grid position directly (0-indexed)
function setExpressionByGrid(col, row) {
    if (!faceTexture) return;
    
    const offsetX = col / FACE_GRID_COLS;
    const offsetY = 1 - ((row + 1) / FACE_GRID_ROWS);
    
    faceTexture.offset.set(offsetX, offsetY);
    currentExpression = `grid_${col}_${row}`;
}

// Blink animation
let blinkTimer = 0;
let isBlinking = false;
const BLINK_INTERVAL = 3000;
const BLINK_DURATION = 150;

function updateBlink(deltaTime) {
    if (!faceTexture) return;
    
    blinkTimer += deltaTime;
    
    if (!isBlinking && blinkTimer > BLINK_INTERVAL) {
        isBlinking = true;
        blinkTimer = 0;
        preBlinkExpression = currentExpression;
        setExpression('closed');
    } else if (isBlinking && blinkTimer > BLINK_DURATION) {
        isBlinking = false;
        blinkTimer = 0;
        setExpression(preBlinkExpression);
    }
}

// Talking animation
let isTalking = false;
let talkTimer = 0;
const TALK_SPEED = 120;
let savedExpression = 'neutral';
const talkFrames = ['talking1', 'talking2', 'talking3', 'neutral2'];
let talkFrameIndex = 0;

function startTalking() {
    if (!isTalking) {
        savedExpression = currentExpression;
        isTalking = true;
        talkTimer = 0;
    }
}

function stopTalking() {
    isTalking = false;
    setExpression(savedExpression);
}

function updateTalking(deltaTime) {
    if (!faceTexture || !isTalking) return;
    
    talkTimer += deltaTime;
    
    if (talkTimer > TALK_SPEED) {
        talkTimer = 0;
        talkFrameIndex = (talkFrameIndex + 1) % talkFrames.length;
        setExpression(talkFrames[talkFrameIndex]);
    }
}

// Export functions to window for easy testing
window.loadFaceTexture = loadFaceTexture;
window.setExpression = setExpression;
window.setExpressionByGrid = setExpressionByGrid;
window.startTalking = startTalking;
window.stopTalking = stopTalking;

// --- UI Controls for expressions ---
document.getElementById('expression-select').addEventListener('change', (e) => {
    setExpression(e.target.value);
});

document.getElementById('grid-btn').addEventListener('click', () => {
    const col = parseInt(document.getElementById('grid-col').value);
    const row = parseInt(document.getElementById('grid-row').value);
    setExpressionByGrid(col, row);
});

let talkingActive = false;
document.getElementById('talk-btn').addEventListener('click', (e) => {
    talkingActive = !talkingActive;
    if (talkingActive) {
        startTalking();
        e.target.textContent = 'Stop Talking';
    } else {
        stopTalking();
        e.target.textContent = 'Start Talking';
    }
});

// --- Character Construction ---
const characterGroup = new THREE.Group();
scene.add(characterGroup);

// Helpers
const joints = [];

function createJoint(parent, x, y, z) {
    const container = new THREE.Group();
    container.position.set(x, y, z);
    parent.add(container);

    const geometry = new THREE.SphereGeometry(0.12, 12, 12);
    const mesh = new THREE.Mesh(geometry, debugJointMaterial);
    container.add(mesh);
    joints.push(mesh);
    
    return container;
}

// ============================================
// SD PROPORTIONS: Big head, tiny body
// Total height ~2 units, head is ~60% of that
// ============================================

// 1. BODY - Rounded bean/pill shape (blue like reference)
// Using a capsule-like shape: sphere top + cylinder + sphere bottom
const bodyGroup = new THREE.Group();
bodyGroup.position.y = 0.5; // Lift body up
characterGroup.add(bodyGroup);

// Body main - stretched sphere for that bean shape
const bodyHeight = 0.5;
const bodyWidth = 0.35;
const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
const body = new THREE.Mesh(bodyGeo, blueMaterial);
body.scale.set(bodyWidth, bodyHeight, bodyWidth * 0.8); // Flatten front-to-back slightly
body.castShadow = true;
bodyGroup.add(body);

// 2. HEAD - Large sphere, slightly squashed
const headRadius = 0.55;
const headGeo = new THREE.SphereGeometry(headRadius, 32, 32);
const head = new THREE.Mesh(headGeo, whiteMaterial); // Back to white material for the head sphere
head.scale.set(1, 0.92, 0.95); // Slightly squash vertically
head.castShadow = true;

// Neck joint
const neckJoint = createJoint(bodyGroup, 0, bodyHeight * 0.85, 0);
head.position.y = headRadius * 0.75; // Overlap slightly with body
neckJoint.add(head);

// FACE - Spherical cap that wraps around the front of the head
// Using a sphere segment (partial sphere) instead of flat plane
const faceRadius = headRadius * 1.08; // Larger radius to sit fully on top of head surface
// SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
// Adjusted to show full face without clipping
const phiStart = Math.PI * 0.25;  // Start angle (horizontal) - wider
const phiLength = Math.PI * 0.5; // How much to cover horizontally - wider
const thetaStart = Math.PI * 0.15; // Start angle (vertical) - start higher up
const thetaLength = Math.PI * 0.55; // How much to cover vertically - taller

const faceGeo = new THREE.SphereGeometry(
    faceRadius, 
    32, 32,
    phiStart, phiLength,
    thetaStart, thetaLength
);

// Rotate UV coordinates so the texture maps correctly to the front
// We need to remap UVs to use the full texture on this partial sphere
const uvAttribute = faceGeo.attributes.uv;
for (let i = 0; i < uvAttribute.count; i++) {
    // UVs are already normalized 0-1 for the partial sphere
    // Just need to make sure they map correctly
    let u = uvAttribute.getX(i);
    let v = uvAttribute.getY(i);
    uvAttribute.setXY(i, u, v);
}

faceMesh = new THREE.Mesh(faceGeo, faceMaterial);
faceMesh.rotation.y = 0; // Face forward (camera)
faceMesh.position.y = -0.05; // Slightly lower to center on face area
faceMesh.scale.z = -1; // Flip to show on the outer surface (facing outward)
faceMesh.renderOrder = 1;
head.add(faceMesh);

// Auto-load face texture
console.log('Attempting to load face texture...');
loadFaceTexture('face.png');

// 3. HORNS/EARS - Custom curved tapered horn using TubeGeometry
function createCurvedHorn(isLeft) {
    const side = isLeft ? 1 : -1;
    
    // Create a curved path for the horn using QuadraticBezierCurve3
    // Curve bends along X axis (outward from head)
    const startPoint = new THREE.Vector3(0, 0, 0);
    const controlPoint = new THREE.Vector3(side * 0.25, 0.15, 0); // Control curve - more X, less Y
    const endPoint = new THREE.Vector3(side * 0.4, 0.25, 0); // Tip extends outward on X
    
    const curve = new THREE.QuadraticBezierCurve3(startPoint, controlPoint, endPoint);
    
    // Create tube along the curve - 3x thicker (0.05 -> 0.15)
    const tubeSegments = 20;
    const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.15, 12, false);
    
    // Now we need to taper it - modify the vertices
    const positions = tubeGeo.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        
        // Find how far along the tube this vertex is (0 = base, 1 = tip)
        // Project onto the curve to find t parameter
        let minDist = Infinity;
        let t = 0;
        for (let j = 0; j <= 20; j++) {
            const testT = j / 20;
            const pointOnCurve = curve.getPoint(testT);
            const dist = vertex.distanceTo(pointOnCurve);
            if (dist < minDist) {
                minDist = dist;
                t = testT;
            }
        }
        
        // Taper: scale down as we go from base to tip
        // Base radius = 1.0, tip radius = 0.2
        const taper = 1.0 - (t * 0.8);
        
        // Get the point on curve and direction
        const pointOnCurve = curve.getPoint(t);
        
        // Scale the vertex position relative to curve center
        const offset = vertex.clone().sub(pointOnCurve);
        offset.multiplyScalar(taper);
        vertex.copy(pointOnCurve).add(offset);
        
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    tubeGeo.attributes.position.needsUpdate = true;
    tubeGeo.computeVertexNormals();
    
    const horn = new THREE.Mesh(tubeGeo, whiteMaterial);
    horn.castShadow = true;
    
    // Add a rounded cap at the base - 3x thicker
    const baseCapGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const baseCap = new THREE.Mesh(baseCapGeo, whiteMaterial);
    baseCap.scale.set(1, 0.5, 1);
    baseCap.position.copy(startPoint);
    
    // Add a tiny sphere at the tip - scaled up proportionally
    const tipGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const tip = new THREE.Mesh(tipGeo, whiteMaterial);
    tip.position.copy(endPoint);
    
    const hornGroup = new THREE.Group();
    hornGroup.add(horn);
    hornGroup.add(baseCap);
    hornGroup.add(tip);
    
    return hornGroup;
}

const leftHorn = createCurvedHorn(true);
leftHorn.position.set(headRadius * 0.5, headRadius * 0.25, 0);
head.add(leftHorn);

const rightHorn = createCurvedHorn(false);
rightHorn.position.set(-headRadius * 0.5, headRadius * 0.25, 0);
head.add(rightHorn);

// 4. MAGIC ORNAMENT - 4-pointed star shape
// Create with two elongated octahedrons intersecting
const ornamentGroup = new THREE.Group();

function createStarPoint(scaleY) {
    const geo = new THREE.OctahedronGeometry(0.08, 0);
    const mesh = new THREE.Mesh(geo, blueMaterial);
    mesh.scale.set(0.5, scaleY, 0.5);
    return mesh;
}

const starVertical = createStarPoint(2.5);
ornamentGroup.add(starVertical);

const starHorizontal = createStarPoint(2.5);
starHorizontal.rotation.z = Math.PI / 2;
ornamentGroup.add(starHorizontal);

// Small center sphere for smoothness
const centerGeo = new THREE.SphereGeometry(0.05, 16, 16);
const centerSphere = new THREE.Mesh(centerGeo, blueMaterial);
ornamentGroup.add(centerSphere);

ornamentGroup.position.y = headRadius + 0.35;
ornamentGroup.castShadow = true;
head.add(ornamentGroup);

// 5. ARMS - Stubby tapered capsules (blue, part of outfit)
function createArm(isLeft) {
    const armGroup = new THREE.Group();
    
    const armLength = 0.45;
    const armWidthBase = 0.12;
    const armWidthTip = 0.08;
    
    // Tapered cylinder for arm
    const armGeo = new THREE.CylinderGeometry(armWidthTip, armWidthBase, armLength, 16);
    const arm = new THREE.Mesh(armGeo, blueMaterial);
    arm.castShadow = true;
    
    // Rounded end cap at hand (tip of arm)
    const handGeo = new THREE.SphereGeometry(armWidthTip, 16, 16);
    const hand = new THREE.Mesh(handGeo, blueMaterial);
    hand.position.y = armLength / 2; // At the tip (hand end)
    arm.add(hand);
    
    armGroup.add(arm);
    
    return { group: armGroup, length: armLength };
}

// Left arm - joint closer to body center
const leftArmData = createArm(true);
const leftArmJoint = createJoint(bodyGroup, bodyWidth * 0.55, bodyHeight * 0.4, 0);
leftArmData.group.rotation.z = -Math.PI / 2 - 0.3; // T-pose with slight downward angle
leftArmData.group.position.x = leftArmData.length / 2;
leftArmJoint.add(leftArmData.group);

// Right arm - joint closer to body center
const rightArmData = createArm(false);
const rightArmJoint = createJoint(bodyGroup, -bodyWidth * 0.55, bodyHeight * 0.4, 0);
rightArmData.group.rotation.z = Math.PI / 2 + 0.3; // T-pose with slight downward angle
rightArmData.group.position.x = -(rightArmData.length / 2);
rightArmJoint.add(rightArmData.group);

// 6. LEGS - Short stubby nubs (blue, part of outfit)
function createLeg() {
    const legGroup = new THREE.Group();
    
    const legLength = 0.45; // Longer legs
    const legWidth = 0.12;
    
    // Capsule-like leg
    const legGeo = new THREE.CapsuleGeometry(legWidth, legLength - legWidth * 2, 8, 16);
    const leg = new THREE.Mesh(legGeo, blueMaterial);
    leg.castShadow = true;
    
    legGroup.add(leg);
    
    return { group: legGroup, length: legLength };
}

// Left leg - anchored higher on body, spread apart, slightly angled outward
const leftLegData = createLeg();
const leftLegJoint = createJoint(bodyGroup, bodyWidth * 0.55, -bodyHeight * 0.5, 0);
leftLegData.group.rotation.z = 0.15; // Slight outward angle
leftLegData.group.position.y = -leftLegData.length / 2;
leftLegJoint.add(leftLegData.group);

// Right leg - anchored higher on body, spread apart, slightly angled outward
const rightLegData = createLeg();
const rightLegJoint = createJoint(bodyGroup, -bodyWidth * 0.55, -bodyHeight * 0.5, 0);
rightLegData.group.rotation.z = -0.15; // Slight outward angle
rightLegData.group.position.y = -rightLegData.length / 2;
rightLegJoint.add(rightLegData.group);

// --- Axis Helper (for debugging) ---
const axisHelper = new THREE.AxesHelper(1); // Red=X, Green=Y, Blue=Z
axisHelper.position.set(1.5, 0.5, 0); // Position to the side
scene.add(axisHelper);

// --- Debug Toggle ---
const debugToggle = document.getElementById('debug-toggle');
debugToggle.checked = false; // Default off for cleaner look
function updateDebug() {
    const visible = debugToggle.checked;
    joints.forEach(j => j.visible = visible);
    axisHelper.visible = visible;
}
debugToggle.addEventListener('change', updateDebug);
updateDebug();

// --- Animation Loop ---
let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);
    
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    
    // Animate ornament - gentle hover and rotation
    const time = now * 0.002;
    ornamentGroup.position.y = headRadius + 0.35 + Math.sin(time) * 0.03;
    ornamentGroup.rotation.y += 0.015;
    ornamentGroup.rotation.z = Math.sin(time * 0.5) * 0.1; // Gentle wobble
    
    // Update face animations
    updateBlink(deltaTime);
    updateTalking(deltaTime);

    controls.update();
    renderer.render(scene, camera);
}

// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
