# 📋 Detailed Avatar Build Instructions

This document contains step-by-step technical instructions for building the kawaii 3D avatar. Follow each phase in order.

---

## Phase 1: Basic Project Setup

### 1.1 Create Project Structure

Create the `companion/` folder with these files:
- `index.html`
- `style.css`  
- `main.js`
- `package.json`
- `electron-main.js`
- `preload.js`

### 1.2 HTML Setup (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Avatar Companion</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- UI Panel (hidden by default) -->
    <div id="ui-panel" class="hidden">
        <h2>🛡️ Avatar Controls</h2>
        
        <!-- Debug Toggle -->
        <div class="control-group">
            <label>
                <input type="checkbox" id="debug-toggle">
                Debug Mode
            </label>
        </div>
        
        <!-- Expression Selection -->
        <div class="control-group">
            <h3>EXPRESSIONS</h3>
            <div id="expression-grid">
                <!-- Expression radio buttons will be added here or in JS -->
            </div>
        </div>
        
        <!-- Talk Button -->
        <div class="control-group">
            <button id="talk-btn">🗣️ Start Talking</button>
        </div>
        
        <!-- Animation Buttons -->
        <div class="control-group">
            <h3>ANIMATIONS</h3>
            <div id="animation-buttons">
                <button data-anim="idle">Idle</button>
                <button data-anim="wave">Wave</button>
                <button data-anim="dance">Dance</button>
                <button data-anim="yata">Yata!</button>
                <button data-anim="sleep">Sleep</button>
                <button data-anim="walk">Walk</button>
                <button data-anim="run">Run</button>
                <button data-anim="float">Float</button>
            </div>
        </div>
    </div>
    
    <!-- Three.js Canvas Container -->
    <div id="canvas-container"></div>
    
    <!-- Three.js Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    
    <!-- Main Script -->
    <script src="main.js"></script>
</body>
</html>
```

### 1.3 Basic CSS (`style.css`)

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow: hidden;
    background: transparent;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#canvas-container {
    width: 100vw;
    height: 100vh;
}

#canvas-container.panel-open {
    margin-left: 290px;
    width: calc(100% - 290px);
}

/* UI Panel Styling */
#ui-panel {
    position: fixed;
    left: 0;
    top: 0;
    width: 280px;
    height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 20px;
    color: white;
    overflow-y: auto;
    z-index: 1000;
    border-right: 2px solid #4a69bd;
}

#ui-panel.hidden {
    display: none;
}

#ui-panel h2 {
    margin-bottom: 20px;
    text-align: center;
}

#ui-panel h3 {
    margin: 15px 0 10px 0;
    font-size: 12px;
    letter-spacing: 1px;
    color: #888;
}

.control-group {
    margin-bottom: 15px;
}

/* Expression Grid */
#expression-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
}

#expression-grid label {
    cursor: pointer;
}

#expression-grid input[type="radio"] {
    display: none;
}

.face-preview {
    width: 40px;
    height: 40px;
    background-image: url('face.png');
    background-size: 800% 400%; /* 8 cols x 4 rows */
    border: 2px solid transparent;
    border-radius: 5px;
}

#expression-grid input[type="radio"]:checked + .face-preview {
    border-color: #4a69bd;
    box-shadow: 0 0 10px #4a69bd;
}

/* Buttons */
button {
    background: linear-gradient(135deg, #4a69bd, #6a89cc);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.1s, box-shadow 0.1s;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(74, 105, 189, 0.4);
}

button:active {
    transform: translateY(0);
}

#animation-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

#animation-buttons button {
    font-size: 12px;
    padding: 8px;
}

#talk-btn {
    width: 100%;
}

#talk-btn.talking {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    animation: pulse 0.5s infinite alternate;
}

@keyframes pulse {
    from { box-shadow: 0 0 5px #e74c3c; }
    to { box-shadow: 0 0 20px #e74c3c; }
}

/* Debug joint styling */
.debug-sphere {
    opacity: 0.6;
}
```

### 1.4 Package Configuration (`package.json`)

```json
{
  "name": "avatar-companion",
  "version": "1.0.0",
  "main": "electron-main.js",
  "scripts": {
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "^28.0.0"
  }
}
```

---

## Phase 2: Three.js Scene Setup

### 2.1 Basic Scene (`main.js` - Part 1)

```javascript
// ============================================
// SCENE SETUP
// ============================================

const scene = new THREE.Scene();
scene.background = null; // Transparent for Electron

const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0.5, 4);

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true  // Enable transparency
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const container = document.getElementById('canvas-container');
container.appendChild(renderer.domElement);

// Orbit Controls (for camera rotation/zoom when UI visible)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.5, 0);
controls.enabled = false; // Disabled by default

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);
```

### 2.2 Window Resize Handler

```javascript
// Window sizes for Electron
const COMPACT_WIDTH = 350;
const COMPACT_HEIGHT = 450;
const EXPANDED_WIDTH = 700;
const EXPANDED_HEIGHT = 500;

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## Phase 3: Character Creation

### 3.1 Materials

Define materials for your character. Customize colors here!

```javascript
// ============================================
// MATERIALS - CUSTOMIZE YOUR COLORS HERE!
// ============================================

const textureLoader = new THREE.TextureLoader();

// Head material (MeshBasicMaterial to avoid lighting affecting color match with face)
const headMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xdcd8cc  // Cream color to match face.png background
});

// Body material
const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5b8dd9  // Blue - CUSTOMIZE THIS!
});

// Accessory material (cape, bow, etc.)
const accessoryMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcc3333,  // Red - CUSTOMIZE THIS!
    side: THREE.DoubleSide
});

// Debug joint material
const debugMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000, 
    transparent: true, 
    opacity: 0.6 
});
```

### 3.2 Character Hierarchy

```javascript
// ============================================
// CHARACTER HIERARCHY
// ============================================

// Main character group - rotate this to face camera
const characterGroup = new THREE.Group();
characterGroup.rotation.y = Math.PI; // Face the camera
scene.add(characterGroup);

// Body group (arms and legs attach here)
const bodyGroup = new THREE.Group();
characterGroup.add(bodyGroup);

// Neck joint (head attaches here)
const neckJoint = new THREE.Group();
neckJoint.position.set(0, 0.6, 0); // Adjust based on body height
bodyGroup.add(neckJoint);

// Head group
const headGroup = new THREE.Group();
neckJoint.add(headGroup);

// Store references to joints for animation
let leftArmJoint, rightArmJoint, leftLegJoint, rightLegJoint;

// Debug spheres array
const debugSpheres = [];
```

### 3.3 Create Joint Helper Function

```javascript
// Helper function to create a joint with debug sphere
function createJoint(parent, position, name) {
    const joint = new THREE.Group();
    joint.position.copy(position);
    joint.name = name;
    parent.add(joint);
    
    // Debug sphere
    const debugGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const debugSphere = new THREE.Mesh(debugGeo, debugMaterial);
    debugSphere.visible = false;
    joint.add(debugSphere);
    debugSpheres.push(debugSphere);
    
    return joint;
}
```

### 3.4 Body Creation

Customize the body shape here!

```javascript
// ============================================
// BODY - CUSTOMIZE SHAPE HERE!
// ============================================

// Option A: Bean/Pill shape (stretched sphere)
const bodyGeo = new THREE.SphereGeometry(0.35, 32, 32);
bodyGeo.scale(1, 1.3, 0.9); // Stretch vertically, flatten front-back
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
bodyMesh.position.set(0, 0, 0);
bodyGroup.add(bodyMesh);

// Option B: Round body (simple sphere)
// const bodyGeo = new THREE.SphereGeometry(0.4, 32, 32);

// Option C: Dress shape (cone + sphere)
// const bodyGeo = new THREE.ConeGeometry(0.4, 0.8, 32);

// Option D: Robot body (box)
// const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.4);
```

### 3.5 Head Creation

```javascript
// ============================================
// HEAD - CUSTOMIZE SHAPE HERE!
// ============================================

// Large kawaii head (squashed sphere)
const headRadius = 0.55;
const headGeo = new THREE.SphereGeometry(headRadius, 32, 32);
headGeo.scale(1, 0.9, 0.95); // Slightly squash
const headMesh = new THREE.Mesh(headGeo, headMaterial);
headGroup.add(headMesh);
```

### 3.6 Arms Creation

```javascript
// ============================================
// ARMS - CUSTOMIZE HERE!
// ============================================

function createArm(isLeft) {
    const side = isLeft ? 1 : -1;
    const armLength = 0.35;
    const armRadius = 0.08;
    
    // Create joint at shoulder position
    const shoulderPos = new THREE.Vector3(
        side * 0.35,  // X: side of body
        0.25,         // Y: upper body
        0
    );
    const armJoint = createJoint(bodyGroup, shoulderPos, isLeft ? 'leftArm' : 'rightArm');
    
    // Arm geometry (tapered cylinder or capsule)
    const armGeo = new THREE.CapsuleGeometry(armRadius, armLength, 8, 16);
    const armMesh = new THREE.Mesh(armGeo, bodyMaterial);
    
    // Position arm extending outward from joint
    armMesh.rotation.z = side * Math.PI / 2; // Point outward (T-pose)
    armMesh.position.x = side * (armLength / 2 + 0.05);
    armJoint.add(armMesh);
    
    // Hand (sphere at end)
    const handGeo = new THREE.SphereGeometry(armRadius * 1.2, 16, 16);
    const handMesh = new THREE.Mesh(handGeo, bodyMaterial);
    handMesh.position.x = side * (armLength + 0.1);
    armJoint.add(handMesh);
    
    return armJoint;
}

leftArmJoint = createArm(true);
rightArmJoint = createArm(false);
```

### 3.7 Legs Creation

```javascript
// ============================================
// LEGS - CUSTOMIZE HERE!
// ============================================

function createLeg(isLeft) {
    const side = isLeft ? 1 : -1;
    const legLength = 0.25;
    const legRadius = 0.1;
    
    // Create joint at hip position
    const hipPos = new THREE.Vector3(
        side * 0.15,  // X: spread apart
        -0.35,        // Y: bottom of body
        0
    );
    const legJoint = createJoint(bodyGroup, hipPos, isLeft ? 'leftLeg' : 'rightLeg');
    
    // Leg geometry (short stubby capsule)
    const legGeo = new THREE.CapsuleGeometry(legRadius, legLength, 8, 16);
    const legMesh = new THREE.Mesh(legGeo, bodyMaterial);
    
    // Position leg extending downward with slight outward angle
    legMesh.rotation.z = side * 0.15; // Slight outward angle
    legMesh.position.y = -legLength / 2 - 0.05;
    legJoint.add(legMesh);
    
    // Foot (sphere at end)
    const footGeo = new THREE.SphereGeometry(legRadius * 1.1, 16, 16);
    const footMesh = new THREE.Mesh(footGeo, bodyMaterial);
    footMesh.position.y = -legLength - 0.1;
    footMesh.position.x = side * 0.03;
    legJoint.add(footMesh);
    
    return legJoint;
}

leftLegJoint = createLeg(true);
rightLegJoint = createLeg(false);
```

---

## Phase 4: Head Accessories

### 4.1 Magic Ornament (Floating Above Head)

Choose ONE of these options or create your own!

```javascript
// ============================================
// HEAD ORNAMENT - CHOOSE YOUR STYLE!
// ============================================

const ornamentMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a90d9,  // Blue - CUSTOMIZE!
    emissive: 0x1a4a7a,
    emissiveIntensity: 0.3
});

// OPTION A: 4-Pointed Star (two intersecting octahedrons)
function createStarOrnament() {
    const ornamentGroup = new THREE.Group();
    
    const starGeo = new THREE.OctahedronGeometry(0.12);
    const star1 = new THREE.Mesh(starGeo, ornamentMaterial);
    const star2 = new THREE.Mesh(starGeo, ornamentMaterial);
    star2.rotation.y = Math.PI / 4;
    
    ornamentGroup.add(star1);
    ornamentGroup.add(star2);
    ornamentGroup.position.set(0, 1.3, 0); // Float above head
    
    return ornamentGroup;
}

// OPTION B: Halo
function createHaloOrnament() {
    const haloGeo = new THREE.TorusGeometry(0.3, 0.03, 16, 32);
    const halo = new THREE.Mesh(haloGeo, ornamentMaterial);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 1.2, 0);
    return halo;
}

// OPTION C: Crown
function createCrownOrnament() {
    const crownGroup = new THREE.Group();
    
    // Base
    const baseGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.1, 32);
    const base = new THREE.Mesh(baseGeo, ornamentMaterial);
    crownGroup.add(base);
    
    // Points
    for (let i = 0; i < 5; i++) {
        const pointGeo = new THREE.ConeGeometry(0.04, 0.12, 8);
        const point = new THREE.Mesh(pointGeo, ornamentMaterial);
        const angle = (i / 5) * Math.PI * 2;
        point.position.set(Math.cos(angle) * 0.15, 0.1, Math.sin(angle) * 0.15);
        crownGroup.add(point);
    }
    
    crownGroup.position.set(0, 1.1, 0);
    return crownGroup;
}

// OPTION D: Floating Gem
function createGemOrnament() {
    const gemGeo = new THREE.OctahedronGeometry(0.1);
    const gem = new THREE.Mesh(gemGeo, ornamentMaterial);
    gem.position.set(0, 1.2, 0);
    return gem;
}

// ADD YOUR CHOSEN ORNAMENT:
const magicOrnament = createStarOrnament(); // Change this!
characterGroup.add(magicOrnament);
```

### 4.2 Head Accessories (Horns, Ears, etc.)

Choose ONE or NONE!

```javascript
// ============================================
// HEAD ACCESSORIES - CHOOSE YOUR STYLE!
// ============================================

// OPTION A: Curved Horns
function createHorns() {
    const hornMaterial = new THREE.MeshBasicMaterial({ color: 0xdcd8cc });
    
    function createHorn(isLeft) {
        const side = isLeft ? 1 : -1;
        
        // Create curved path
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(side * 0.15, 0.2, -0.05),
            new THREE.Vector3(side * 0.25, 0.35, -0.1)
        );
        
        // Create tube with tapering
        const segments = 20;
        const points = curve.getPoints(segments);
        const geometry = new THREE.TubeGeometry(curve, segments, 0.06, 8, false);
        
        // Taper the horn (modify vertices)
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            );
            // Find progress along curve (0 to 1)
            const progress = vertex.y / 0.35;
            const scale = 1 - progress * 0.7; // Taper from 1 to 0.3
            
            // Scale x and z relative to curve center
            positions.setX(i, positions.getX(i) * scale);
            positions.setZ(i, positions.getZ(i) * scale);
        }
        geometry.attributes.position.needsUpdate = true;
        
        const horn = new THREE.Mesh(geometry, hornMaterial);
        horn.position.set(side * 0.3, 0.3, -0.1);
        
        return horn;
    }
    
    headGroup.add(createHorn(true));
    headGroup.add(createHorn(false));
}

// OPTION B: Cat Ears
function createCatEars() {
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xdcd8cc });
    
    function createEar(isLeft) {
        const side = isLeft ? 1 : -1;
        const earGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
        const ear = new THREE.Mesh(earGeo, earMaterial);
        ear.position.set(side * 0.35, 0.4, 0);
        ear.rotation.z = side * -0.3;
        return ear;
    }
    
    headGroup.add(createEar(true));
    headGroup.add(createEar(false));
}

// OPTION C: Bunny Ears
function createBunnyEars() {
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xdcd8cc });
    
    function createEar(isLeft) {
        const side = isLeft ? 1 : -1;
        const earGeo = new THREE.CapsuleGeometry(0.08, 0.4, 8, 16);
        const ear = new THREE.Mesh(earGeo, earMaterial);
        ear.position.set(side * 0.2, 0.55, -0.1);
        ear.rotation.z = side * -0.2;
        ear.rotation.x = -0.1;
        return ear;
    }
    
    headGroup.add(createEar(true));
    headGroup.add(createEar(false));
}

// ADD YOUR CHOSEN ACCESSORY (or comment out for none):
createHorns(); // Change this!
```

---

## Phase 5: Face Texture System

### 5.1 Face Sprite Sheet Configuration

```javascript
// ============================================
// FACE TEXTURE SYSTEM
// ============================================

// Sprite sheet configuration (8 columns x 4 rows)
const FACE_GRID_COLS = 8;
const FACE_GRID_ROWS = 4;

// Expression name to grid position mapping - CUSTOMIZE!
const faceExpressions = {
    'neutral':   { col: 0, row: 0 },
    'happy':     { col: 1, row: 0 },
    'wink':      { col: 2, row: 0 },
    'sleepy':    { col: 3, row: 0 },
    'surprised': { col: 4, row: 0 },
    'angry':     { col: 5, row: 0 },
    'confused':  { col: 6, row: 0 },
    'excited':   { col: 7, row: 0 },
    'sad':       { col: 0, row: 1 },
    'thinking':  { col: 1, row: 1 },
    // Add more as needed based on your sprite sheet
};

// Blink frames (for automatic blinking)
const blinkFrames = [
    { col: 0, row: 3 },
    { col: 1, row: 3 },
    { col: 2, row: 3 },
];

// Talking frames (mouth open variations)
const talkFrames = [
    { col: 0, row: 2 },
    { col: 1, row: 2 },
    { col: 2, row: 2 },
    { col: 3, row: 2 },
];
```

### 5.2 Face Material and Mesh

```javascript
// Face material with sprite sheet
const faceTexture = textureLoader.load('face.png');
faceTexture.repeat.set(1 / FACE_GRID_COLS, 1 / FACE_GRID_ROWS);

const faceMaterial = new THREE.MeshBasicMaterial({
    map: faceTexture,
    transparent: true
});

// Create spherical cap for face (partial sphere that wraps around front of head)
const faceRadius = headRadius + 0.01; // Slightly larger than head
const faceGeo = new THREE.SphereGeometry(
    faceRadius,
    32, 32,
    Math.PI * 0.25,    // phiStart: start angle around Y axis
    Math.PI * 0.5,     // phiLength: how much to sweep around Y
    Math.PI * 0.2,     // thetaStart: start from top
    Math.PI * 0.5      // thetaLength: how far down to go
);

// Remap UVs to show single sprite cell correctly
const uvs = faceGeo.attributes.uv;
for (let i = 0; i < uvs.count; i++) {
    let u = uvs.getX(i);
    let v = uvs.getY(i);
    // Remap to fill the face area properly
    uvs.setXY(i, u, v);
}

const faceMesh = new THREE.Mesh(faceGeo, faceMaterial);
faceMesh.rotation.y = Math.PI; // Face forward
headGroup.add(faceMesh);
```

### 5.3 Expression Control Functions

```javascript
// Current expression state
let currentExpression = 'neutral';
let isBlinking = false;
let blinkTimer = 0;
let blinkInterval = 3; // Seconds between blinks
let isTalking = false;
let talkTimer = 0;
let talkFrameIndex = 0;

// Set expression by name
function setExpression(name) {
    if (faceExpressions[name]) {
        currentExpression = name;
        const { col, row } = faceExpressions[name];
        setExpressionByGrid(col, row);
    }
}

// Set expression by grid position
function setExpressionByGrid(col, row) {
    faceTexture.offset.set(
        col / FACE_GRID_COLS,
        1 - (row + 1) / FACE_GRID_ROWS
    );
}

// Automatic blinking
function updateBlink(deltaTime) {
    if (isTalking) return; // Don't blink while talking
    
    blinkTimer += deltaTime;
    
    if (isBlinking) {
        // Blink animation (quick close-open)
        const blinkProgress = (blinkTimer % 0.15) / 0.15;
        const frameIndex = Math.min(
            Math.floor(blinkProgress * blinkFrames.length),
            blinkFrames.length - 1
        );
        const frame = blinkFrames[frameIndex];
        setExpressionByGrid(frame.col, frame.row);
        
        if (blinkTimer > 0.15) {
            isBlinking = false;
            blinkTimer = 0;
            setExpression(currentExpression);
        }
    } else if (blinkTimer > blinkInterval) {
        isBlinking = true;
        blinkTimer = 0;
        blinkInterval = 2 + Math.random() * 3; // Random interval
    }
}

// Talking animation
function startTalking() {
    isTalking = true;
    talkTimer = 0;
}

function stopTalking() {
    isTalking = false;
    setExpression(currentExpression);
}

function updateTalking(deltaTime) {
    if (!isTalking) return;
    
    talkTimer += deltaTime;
    if (talkTimer > 0.1) { // Change mouth every 100ms
        talkTimer = 0;
        talkFrameIndex = (talkFrameIndex + 1) % talkFrames.length;
        const frame = talkFrames[talkFrameIndex];
        setExpressionByGrid(frame.col, frame.row);
    }
}
```

---

## Phase 6: Body Accessory (Cape/Bow/Wings)

Choose ONE or create your own!

### 6.1 OPTION A: Cape with Physics

```javascript
// ============================================
// CAPE WITH CLOTH PHYSICS
// ============================================

const CAPE_WIDTH = 0.5;
const CAPE_HEIGHT = 0.7;
const CAPE_SEGMENTS_W = 8;
const CAPE_SEGMENTS_H = 12;

// Cloth particle class
class ClothParticle {
    constructor(x, y, z, pinned = false) {
        this.position = new THREE.Vector3(x, y, z);
        this.previous = new THREE.Vector3(x, y, z);
        this.pinned = pinned;
        this.acceleration = new THREE.Vector3();
    }
    
    update(deltaTime) {
        if (this.pinned) return;
        
        const velocity = this.position.clone().sub(this.previous);
        velocity.multiplyScalar(0.98); // Damping
        
        this.previous.copy(this.position);
        this.position.add(velocity);
        this.position.add(this.acceleration.multiplyScalar(deltaTime * deltaTime));
        this.acceleration.set(0, 0, 0);
    }
    
    applyForce(force) {
        this.acceleration.add(force);
    }
}

// Cloth constraint class
class ClothConstraint {
    constructor(p1, p2, restLength) {
        this.p1 = p1;
        this.p2 = p2;
        this.restLength = restLength;
    }
    
    satisfy() {
        const diff = this.p2.position.clone().sub(this.p1.position);
        const distance = diff.length();
        const correction = diff.multiplyScalar((distance - this.restLength) / distance / 2);
        
        if (!this.p1.pinned) this.p1.position.add(correction);
        if (!this.p2.pinned) this.p2.position.sub(correction);
    }
}

// Create cape particles and constraints
const capeParticles = [];
const capeConstraints = [];

const capeAttachY = 0.35;  // Neck height
const capeAttachZ = -0.25; // Behind body

for (let y = 0; y <= CAPE_SEGMENTS_H; y++) {
    const row = [];
    for (let x = 0; x <= CAPE_SEGMENTS_W; x++) {
        // Make cape wider at bottom (trapezoidal)
        const widthMultiplier = 1 + (y / CAPE_SEGMENTS_H) * 2;
        const px = (x / CAPE_SEGMENTS_W - 0.5) * CAPE_WIDTH * widthMultiplier;
        const py = capeAttachY - (y / CAPE_SEGMENTS_H) * CAPE_HEIGHT;
        const pz = capeAttachZ;
        
        const pinned = y === 0; // Pin top row
        const particle = new ClothParticle(px, py, pz, pinned);
        row.push(particle);
    }
    capeParticles.push(row);
}

// Create constraints (horizontal and vertical)
for (let y = 0; y <= CAPE_SEGMENTS_H; y++) {
    for (let x = 0; x <= CAPE_SEGMENTS_W; x++) {
        if (x < CAPE_SEGMENTS_W) {
            const restLen = capeParticles[y][x].position.distanceTo(capeParticles[y][x + 1].position);
            capeConstraints.push(new ClothConstraint(capeParticles[y][x], capeParticles[y][x + 1], restLen));
        }
        if (y < CAPE_SEGMENTS_H) {
            const restLen = capeParticles[y][x].position.distanceTo(capeParticles[y + 1][x].position);
            capeConstraints.push(new ClothConstraint(capeParticles[y][x], capeParticles[y + 1][x], restLen));
        }
    }
}

// Create cape mesh
const capeGeometry = new THREE.PlaneGeometry(
    CAPE_WIDTH, CAPE_HEIGHT,
    CAPE_SEGMENTS_W, CAPE_SEGMENTS_H
);
const capeMesh = new THREE.Mesh(capeGeometry, accessoryMaterial);
bodyGroup.add(capeMesh);

// Collision spheres (body)
const collisionSpheres = [
    { center: new THREE.Vector3(0, 0, 0), radius: 0.4 }
];

// Update cape physics
function updateCapePhysics(deltaTime) {
    const gravity = new THREE.Vector3(0, -9.8, 0);
    const wind = new THREE.Vector3(
        Math.sin(Date.now() * 0.001) * 0.5,
        0,
        Math.cos(Date.now() * 0.0015) * 0.3 - 1
    );
    
    // Apply forces
    for (let y = 0; y <= CAPE_SEGMENTS_H; y++) {
        for (let x = 0; x <= CAPE_SEGMENTS_W; x++) {
            const particle = capeParticles[y][x];
            particle.applyForce(gravity);
            particle.applyForce(wind);
        }
    }
    
    // Update particles
    for (let y = 0; y <= CAPE_SEGMENTS_H; y++) {
        for (let x = 0; x <= CAPE_SEGMENTS_W; x++) {
            capeParticles[y][x].update(deltaTime);
        }
    }
    
    // Satisfy constraints (multiple iterations for stability)
    for (let i = 0; i < 5; i++) {
        for (const constraint of capeConstraints) {
            constraint.satisfy();
        }
    }
    
    // Collision with body
    for (let y = 0; y <= CAPE_SEGMENTS_H; y++) {
        for (let x = 0; x <= CAPE_SEGMENTS_W; x++) {
            const particle = capeParticles[y][x];
            if (particle.pinned) continue;
            
            for (const sphere of collisionSpheres) {
                const toParticle = particle.position.clone().sub(sphere.center);
                const distance = toParticle.length();
                
                if (distance < sphere.radius) {
                    toParticle.normalize().multiplyScalar(sphere.radius);
                    particle.position.copy(sphere.center).add(toParticle);
                }
            }
            
            // Keep cape behind body
            if (particle.position.z > -0.15) {
                particle.position.z = -0.15;
            }
        }
    }
    
    // Update mesh geometry
    const positions = capeGeometry.attributes.position;
    for (let y = 0; y <= CAPE_SEGMENTS_H; y++) {
        for (let x = 0; x <= CAPE_SEGMENTS_W; x++) {
            const i = y * (CAPE_SEGMENTS_W + 1) + x;
            const particle = capeParticles[y][x];
            positions.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
        }
    }
    positions.needsUpdate = true;
    capeGeometry.computeVertexNormals();
}
```

### 6.2 OPTION B: Back Bow

```javascript
// ============================================
// BACK BOW (simpler alternative to cape)
// ============================================

function createBackBow() {
    const bowGroup = new THREE.Group();
    
    // Center knot
    const knotGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const knot = new THREE.Mesh(knotGeo, accessoryMaterial);
    bowGroup.add(knot);
    
    // Left loop
    const loopGeo = new THREE.TorusGeometry(0.12, 0.04, 8, 16, Math.PI);
    const leftLoop = new THREE.Mesh(loopGeo, accessoryMaterial);
    leftLoop.position.set(-0.1, 0, 0);
    leftLoop.rotation.z = Math.PI / 2;
    bowGroup.add(leftLoop);
    
    // Right loop
    const rightLoop = new THREE.Mesh(loopGeo, accessoryMaterial);
    rightLoop.position.set(0.1, 0, 0);
    rightLoop.rotation.z = -Math.PI / 2;
    bowGroup.add(rightLoop);
    
    // Ribbons hanging down
    const ribbonGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.3, 8);
    const leftRibbon = new THREE.Mesh(ribbonGeo, accessoryMaterial);
    leftRibbon.position.set(-0.05, -0.18, 0);
    leftRibbon.rotation.z = 0.2;
    bowGroup.add(leftRibbon);
    
    const rightRibbon = new THREE.Mesh(ribbonGeo, accessoryMaterial);
    rightRibbon.position.set(0.05, -0.18, 0);
    rightRibbon.rotation.z = -0.2;
    bowGroup.add(rightRibbon);
    
    bowGroup.position.set(0, 0.2, -0.35);
    bodyGroup.add(bowGroup);
    
    return bowGroup;
}

// Uncomment to use bow instead of cape:
// const backBow = createBackBow();
```

### 6.3 OPTION C: Wings

```javascript
// ============================================
// WINGS
// ============================================

function createWings() {
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    function createWing(isLeft) {
        const side = isLeft ? 1 : -1;
        
        // Wing shape using custom geometry or scaled sphere
        const wingGeo = new THREE.SphereGeometry(0.25, 16, 16);
        wingGeo.scale(0.3, 1, 0.1);
        
        const wing = new THREE.Mesh(wingGeo, wingMaterial);
        wing.position.set(side * 0.25, 0.15, -0.25);
        wing.rotation.z = side * -0.5;
        wing.rotation.y = side * 0.3;
        
        return wing;
    }
    
    bodyGroup.add(createWing(true));
    bodyGroup.add(createWing(false));
}

// Uncomment to use wings:
// createWings();
```

---

## Phase 7: Animation System

### 7.1 Default Pose and Animation State

```javascript
// ============================================
// ANIMATION SYSTEM
// ============================================

// Store default pose for resetting
const defaultPose = {
    leftArm: { x: 0, y: 0, z: 0 },
    rightArm: { x: 0, y: 0, z: 0 },
    leftLeg: { x: 0, y: 0, z: 0 },
    rightLeg: { x: 0, y: 0, z: 0 },
    neck: { x: 0, y: 0, z: 0 },
    body: { x: 0, y: 0, z: 0 },
    ornament: { y: 1.3 } // Floating height
};

let currentAnimation = 'idle';
let animationTime = 0;

function resetPose() {
    leftArmJoint.rotation.set(defaultPose.leftArm.x, defaultPose.leftArm.y, defaultPose.leftArm.z);
    rightArmJoint.rotation.set(defaultPose.rightArm.x, defaultPose.rightArm.y, defaultPose.rightArm.z);
    leftLegJoint.rotation.set(defaultPose.leftLeg.x, defaultPose.leftLeg.y, defaultPose.leftLeg.z);
    rightLegJoint.rotation.set(defaultPose.rightLeg.x, defaultPose.rightLeg.y, defaultPose.rightLeg.z);
    neckJoint.rotation.set(defaultPose.neck.x, defaultPose.neck.y, defaultPose.neck.z);
    bodyGroup.rotation.set(defaultPose.body.x, defaultPose.body.y, defaultPose.body.z);
}

function playAnimation(name) {
    if (currentAnimation !== name) {
        currentAnimation = name;
        animationTime = 0;
        resetPose();
    }
}
```

### 7.2 Animation Functions

```javascript
// Idle animation - gentle breathing/bobbing
function animateIdle(time) {
    const breathe = Math.sin(time * 2) * 0.02;
    bodyGroup.position.y = breathe;
    
    // Subtle arm sway
    leftArmJoint.rotation.z = Math.sin(time * 1.5) * 0.05;
    rightArmJoint.rotation.z = -Math.sin(time * 1.5) * 0.05;
    
    // Ornament bob
    magicOrnament.position.y = defaultPose.ornament.y + Math.sin(time * 3) * 0.05;
    magicOrnament.rotation.y = time * 0.5;
}

// Wave animation
function animateWave(time) {
    // Right arm waves
    rightArmJoint.rotation.z = -Math.PI / 3; // Arm up
    rightArmJoint.rotation.x = -0.3 + Math.sin(time * 8) * 0.3; // Wave motion
    
    // Head tilt
    neckJoint.rotation.z = THREE.MathUtils.degToRad(-20);
    
    // Slight body movement
    bodyGroup.position.y = Math.sin(time * 4) * 0.02;
}

// Dance animation
function animateDance(time) {
    const bounce = Math.abs(Math.sin(time * 6)) * 0.1;
    bodyGroup.position.y = bounce;
    bodyGroup.rotation.z = Math.sin(time * 3) * 0.1;
    
    // Arms swing
    leftArmJoint.rotation.z = Math.sin(time * 6) * 0.5;
    rightArmJoint.rotation.z = -Math.sin(time * 6) * 0.5;
    
    // Legs tap
    leftLegJoint.rotation.x = Math.max(0, Math.sin(time * 6)) * 0.3;
    rightLegJoint.rotation.x = Math.max(0, -Math.sin(time * 6)) * 0.3;
}

// Yata (victory) animation
function animateYata(time) {
    // Both arms up in victory pose
    leftArmJoint.rotation.z = Math.PI / 4 + Math.sin(time * 8) * 0.1;
    leftArmJoint.rotation.x = -0.3;
    rightArmJoint.rotation.z = -Math.PI / 4 - Math.sin(time * 8) * 0.1;
    rightArmJoint.rotation.x = -0.3;
    
    // Happy bounce
    bodyGroup.position.y = Math.abs(Math.sin(time * 8)) * 0.08;
    
    // Head tilt
    neckJoint.rotation.z = Math.sin(time * 4) * 0.1;
}

// Sleep animation
function animateSleep(time) {
    // Droopy pose
    neckJoint.rotation.x = 0.2; // Head down
    leftArmJoint.rotation.z = 0.3;
    rightArmJoint.rotation.z = -0.3;
    
    // Gentle breathing
    bodyGroup.position.y = Math.sin(time * 1) * 0.02;
}

// Walk animation
function animateWalk(time) {
    const speed = 4;
    
    // Leg movement
    leftLegJoint.rotation.x = Math.sin(time * speed) * 0.4;
    rightLegJoint.rotation.x = -Math.sin(time * speed) * 0.4;
    
    // Arm swing (opposite to legs)
    leftArmJoint.rotation.x = -Math.sin(time * speed) * 0.3;
    rightArmJoint.rotation.x = Math.sin(time * speed) * 0.3;
    
    // Body bob
    bodyGroup.position.y = Math.abs(Math.sin(time * speed * 2)) * 0.03;
}

// Run animation
function animateRun(time) {
    const speed = 8;
    
    // Faster leg movement
    leftLegJoint.rotation.x = Math.sin(time * speed) * 0.6;
    rightLegJoint.rotation.x = -Math.sin(time * speed) * 0.6;
    
    // Arm swing
    leftArmJoint.rotation.x = -Math.sin(time * speed) * 0.5;
    rightArmJoint.rotation.x = Math.sin(time * speed) * 0.5;
    
    // More pronounced bounce
    bodyGroup.position.y = Math.abs(Math.sin(time * speed * 2)) * 0.06;
    
    // Slight forward lean
    bodyGroup.rotation.x = -0.1;
}

// Float animation
function animateFloat(time) {
    // Hovering motion
    bodyGroup.position.y = 0.1 + Math.sin(time * 2) * 0.05;
    
    // Gentle rotation
    characterGroup.rotation.y = Math.PI + Math.sin(time * 0.5) * 0.1;
    
    // Relaxed arms
    leftArmJoint.rotation.z = 0.3 + Math.sin(time * 1.5) * 0.1;
    rightArmJoint.rotation.z = -0.3 - Math.sin(time * 1.5) * 0.1;
}

// Roll animation
function animateRoll(time) {
    characterGroup.rotation.z = time * 3;
    bodyGroup.position.y = Math.abs(Math.sin(time * 3)) * 0.1;
}

// Animation update dispatcher
function updateAnimation(deltaTime) {
    animationTime += deltaTime;
    
    switch (currentAnimation) {
        case 'idle': animateIdle(animationTime); break;
        case 'wave': animateWave(animationTime); break;
        case 'dance': animateDance(animationTime); break;
        case 'yata': animateYata(animationTime); break;
        case 'sleep': animateSleep(animationTime); break;
        case 'walk': animateWalk(animationTime); break;
        case 'run': animateRun(animationTime); break;
        case 'float': animateFloat(animationTime); break;
        case 'roll': animateRoll(animationTime); break;
    }
}
```

---

## Phase 8: Debug Mode

```javascript
// ============================================
// DEBUG MODE
// ============================================

let debugMode = false;

function updateDebug(visible) {
    debugMode = visible;
    for (const sphere of debugSpheres) {
        sphere.visible = visible;
    }
}

// Axis helper (useful during development)
// const axisHelper = new THREE.AxesHelper(1);
// scene.add(axisHelper);
```

---

## Phase 9: UI Controls

```javascript
// ============================================
// UI CONTROLS
// ============================================

const uiPanel = document.getElementById('ui-panel');
const canvasContainer = document.getElementById('canvas-container');
const debugToggle = document.getElementById('debug-toggle');
const talkBtn = document.getElementById('talk-btn');

// Debug toggle
debugToggle.addEventListener('change', (e) => {
    updateDebug(e.target.checked);
});

// Expression selection (add radio buttons dynamically or in HTML)
document.querySelectorAll('input[name="expression"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const col = parseInt(e.target.dataset.col);
        const row = parseInt(e.target.dataset.row);
        setExpressionByGrid(col, row);
    });
});

// Talk button
talkBtn.addEventListener('click', () => {
    if (isTalking) {
        stopTalking();
        talkBtn.textContent = '🗣️ Start Talking';
        talkBtn.classList.remove('talking');
    } else {
        startTalking();
        talkBtn.textContent = '🛑 Stop Talking';
        talkBtn.classList.add('talking');
    }
});

// Animation buttons
document.querySelectorAll('#animation-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        const anim = btn.dataset.anim;
        playAnimation(anim);
    });
});

// Toggle UI panel (called from Electron)
function toggleUIPanel() {
    uiPanel.classList.toggle('hidden');
    const isVisible = !uiPanel.classList.contains('hidden');
    
    if (isVisible) {
        canvasContainer.classList.add('panel-open');
        controls.enabled = true;
    } else {
        canvasContainer.classList.remove('panel-open');
        controls.enabled = false;
    }
    
    // Notify Electron to resize window
    if (window.api && window.api.resizeWindow) {
        window.api.resizeWindow(!isVisible);
    }
}

// Expose for Electron
window.toggleUIPanel = toggleUIPanel;
```

---

## Phase 10: Main Animation Loop

```javascript
// ============================================
// MAIN ANIMATION LOOP
// ============================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update animations
    updateAnimation(deltaTime);
    
    // Update face (blinking, talking)
    updateBlink(deltaTime);
    updateTalking(deltaTime);
    
    // Update cape physics (if using cape)
    // updateCapePhysics(deltaTime);
    
    // Update controls
    controls.update();
    
    // Render
    renderer.render(scene, camera);
}

// Start!
animate();
playAnimation('idle');
```

---

## Phase 11: Electron Integration

### 11.1 Main Process (`electron-main.js`)

```javascript
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');

let win;
let uiVisible = false;

const COMPACT_WIDTH = 350;
const COMPACT_HEIGHT = 450;
const EXPANDED_WIDTH = 700;
const EXPANDED_HEIGHT = 500;

function createWindow() {
    win = new BrowserWindow({
        width: COMPACT_WIDTH,
        height: COMPACT_HEIGHT,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    
    win.loadFile('index.html');
    win.setMovable(true);
}

app.whenReady().then(() => {
    createWindow();
    
    // F1 to toggle UI
    globalShortcut.register('F1', () => {
        uiVisible = !uiVisible;
        
        if (uiVisible) {
            win.setBounds({
                width: EXPANDED_WIDTH,
                height: EXPANDED_HEIGHT
            });
        } else {
            win.setBounds({
                width: COMPACT_WIDTH,
                height: COMPACT_HEIGHT
            });
        }
        
        win.webContents.executeScript('toggleUIPanel()');
    });
    
    // Escape to close
    globalShortcut.register('Escape', () => {
        app.quit();
    });
});

// Window dragging
let dragOffset = { x: 0, y: 0 };

ipcMain.on('drag-start', (event, mousePos) => {
    const winPos = win.getPosition();
    dragOffset.x = mousePos.x - winPos[0];
    dragOffset.y = mousePos.y - winPos[1];
});

ipcMain.on('drag-move', (event, mousePos) => {
    win.setPosition(
        mousePos.x - dragOffset.x,
        mousePos.y - dragOffset.y
    );
});

// Resize handler
ipcMain.handle('resize-window', (event, compact) => {
    if (compact) {
        win.setBounds({ width: COMPACT_WIDTH, height: COMPACT_HEIGHT });
    } else {
        win.setBounds({ width: EXPANDED_WIDTH, height: EXPANDED_HEIGHT });
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
```

### 11.2 Preload Script (`preload.js`)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startDrag: (mousePos) => ipcRenderer.send('drag-start', mousePos),
    moveDrag: (mousePos) => ipcRenderer.send('drag-move', mousePos),
    toggleUI: () => ipcRenderer.invoke('toggle-ui'),
    resizeWindow: (compact) => ipcRenderer.invoke('resize-window', compact)
});
```

### 11.3 Add Drag Handling to `main.js`

```javascript
// ============================================
// WINDOW DRAGGING (Electron)
// ============================================

let isDragging = false;

renderer.domElement.addEventListener('mousedown', (e) => {
    if (!controls.enabled && window.api) {
        isDragging = true;
        window.api.startDrag({ x: e.screenX, y: e.screenY });
    }
});

window.addEventListener('mousemove', (e) => {
    if (isDragging && window.api) {
        window.api.moveDrag({ x: e.screenX, y: e.screenY });
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});
```

---

## Phase 12: Running Your Avatar

### 12.1 Install Dependencies

```powershell
cd companion
npm install
```

### 12.2 Start the App

```powershell
npm start
```

### 12.3 Controls

- **F1**: Toggle control panel
- **Escape**: Close app
- **Click + Drag**: Move avatar (when panel hidden)
- **Mouse wheel / Right-drag**: Zoom/rotate camera (when panel visible)

---

## 🎉 Congratulations!

You've built your own kawaii desktop companion! Now personalize it:

1. Change colors in the materials section
2. Swap head accessories (horns → ears → hat)
3. Change body accessory (cape → bow → wings)
4. Add new animations
5. Create your own face sprite sheet
6. Add sound effects
7. Add interaction responses

Have fun! 🌟

