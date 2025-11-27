import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// WEBSOCKET CONNECTION (Feature 1)
// ============================================
const WS_URL = 'ws://localhost:8080';
let websocket = null;
let wsReconnectTimer = null;
const WS_RECONNECT_DELAY = 3000; // 3 seconds
let wsConnected = false;

function connectWebSocket() {
    if (websocket && (websocket.readyState === WebSocket.CONNECTING || websocket.readyState === WebSocket.OPEN)) {
        return;
    }
    
    console.log('🔌 Connecting to WebSocket:', WS_URL);
    updateConnectionStatus('connecting');
    
    try {
        websocket = new WebSocket(WS_URL);
        
        websocket.onopen = () => {
            console.log('✅ WebSocket connected!');
            wsConnected = true;
            updateConnectionStatus('connected');
            
            // Clear any pending reconnect timer
            if (wsReconnectTimer) {
                clearTimeout(wsReconnectTimer);
                wsReconnectTimer = null;
            }
        };
        
        websocket.onclose = (event) => {
            console.log('❌ WebSocket closed:', event.code, event.reason);
            wsConnected = false;
            updateConnectionStatus('disconnected');
            scheduleReconnect();
        };
        
        websocket.onerror = (error) => {
            console.error('⚠️ WebSocket error:', error);
            updateConnectionStatus('error');
        };
        
        websocket.onmessage = (event) => {
            handleWebSocketMessage(event.data);
        };
        
    } catch (error) {
        console.error('Failed to create WebSocket:', error);
        updateConnectionStatus('error');
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (wsReconnectTimer) return;
    
    console.log(`⏳ Reconnecting in ${WS_RECONNECT_DELAY / 1000}s...`);
    wsReconnectTimer = setTimeout(() => {
        wsReconnectTimer = null;
        connectWebSocket();
    }, WS_RECONNECT_DELAY);
}

function sendWebSocketMessage(type, data) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot send message');
        return false;
    }
    
    const message = JSON.stringify({ type, ...data });
    websocket.send(message);
    return true;
}

// Connection status colors for the star ornament
const CONNECTION_COLORS = {
    'connected': 0x4a90d9,    // Blue - connected
    'connecting': 0xffa500,   // Orange - connecting
    'disconnected': 0xff4444, // Red - disconnected
    'error': 0xff4444         // Red - error
};

let ornamentMaterial = null; // Will be set when ornament is created

function updateConnectionStatus(status) {
    // Update the star ornament color
    if (ornamentMaterial) {
        const color = CONNECTION_COLORS[status] || CONNECTION_COLORS.disconnected;
        ornamentMaterial.color.setHex(color);
        
        // Add emissive glow for connected state
        if (status === 'connected') {
            ornamentMaterial.emissive.setHex(0x2255aa);
            ornamentMaterial.emissiveIntensity = 0.3;
        } else if (status === 'connecting') {
            ornamentMaterial.emissive.setHex(0x885500);
            ornamentMaterial.emissiveIntensity = 0.3;
        } else {
            ornamentMaterial.emissive.setHex(0x551111);
            ornamentMaterial.emissiveIntensity = 0.2;
        }
    }
    
    console.log(`🔌 Connection: ${status}`);
}

// Handle incoming WebSocket messages (Feature 6)
function handleWebSocketMessage(data) {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received:', message);
        
        switch (message.type) {
            case 'state':
                handleStateMessage(message);
                break;
            case 'audio':
                handleAudioMessage(message);
                break;
            case 'expression':
                if (message.expression && faceExpressions[message.expression]) {
                    setExpression(message.expression);
                }
                break;
            case 'animation':
                if (message.animation) {
                    playAnimation(message.animation);
                }
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
    }
}

// Feature 6: Handle backend state messages
function handleStateMessage(message) {
    const { state, expression, animation } = message;
    
    // Map backend states to avatar animations/expressions
    const stateMapping = {
        'idle': { animation: 'idle', expression: 'neutral' },
        'listening': { animation: 'idle', expression: 'happy' },
        'thinking': { animation: 'idle', expression: 'thinking' },
        'speaking': { animation: 'idle', expression: null, talking: true },
        'processing': { animation: 'float', expression: 'sparkle' },
        'error': { animation: 'idle', expression: 'worried' },
        'happy': { animation: 'dance', expression: 'happy' },
        'sad': { animation: 'idle', expression: 'sad' },
        'excited': { animation: 'yata', expression: 'excited' },
        'sleepy': { animation: 'sleep', expression: 'sleepy' }
    };
    
    // Use explicit values if provided, otherwise use state mapping
    const mapping = stateMapping[state] || {};
    
    if (animation) {
        playAnimation(animation);
    } else if (mapping.animation) {
        playAnimation(mapping.animation);
    }
    
    if (expression) {
        setExpression(expression);
    } else if (mapping.expression) {
        setExpression(mapping.expression);
    }
    
    // Handle talking state
    if (mapping.talking) {
        startTalking();
    } else if (state && state !== 'speaking') {
        stopTalking();
    }
}

// Feature 4: Handle audio playback from WebSocket
let audioContext = null;
let audioQueue = [];
let isPlayingAudio = false;

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function handleAudioMessage(message) {
    if (message.audio_base64) {
        playBase64Audio(message.audio_base64);
    }
}

async function playBase64Audio(base64Audio) {
    try {
        const ctx = initAudioContext();
        
        // Decode base64 to binary
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decode audio data
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        
        // Add to queue
        audioQueue.push(audioBuffer);
        
        // Start playing if not already
        if (!isPlayingAudio) {
            playNextInQueue();
        }
    } catch (error) {
        console.error('Failed to play audio:', error);
    }
}

function playNextInQueue() {
    if (audioQueue.length === 0) {
        isPlayingAudio = false;
        stopTalking();
        return;
    }
    
    isPlayingAudio = true;
    startTalking();
    
    const ctx = initAudioContext();
    const audioBuffer = audioQueue.shift();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
        playNextInQueue();
    };
    
    source.start();
}

// ============================================
// PUSH TO TALK (Feature 2)
// ============================================
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStream = null;

async function startRecording() {
    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        // Create AudioContext for waveform visualization
        initAudioContext();
        const analyserSource = audioContext.createMediaStreamSource(recordingStream);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        analyserSource.connect(analyserNode);
        
        mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await sendAudioToBackend(audioBlob);
            hideWaveform();
            
            // Clean up
            if (recordingStream) {
                recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }
        };
        
        mediaRecorder.start(100); // Collect data every 100ms
        isRecording = true;
        
        // Show waveform
        showWaveform();
        startWaveformAnimation();
        
        // Update UI
        updatePTTButton(true);
        
        console.log('🎤 Recording started');
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        updatePTTButton(false);
        stopWaveformAnimation();
        console.log('🎤 Recording stopped');
    }
}

async function sendAudioToBackend(audioBlob) {
    try {
        // Convert blob to base64
        const base64Audio = await blobToBase64(audioBlob);
        
        // Send via WebSocket
        sendWebSocketMessage('audio', {
            audio_base64: base64Audio,
            format: 'webm',
            timestamp: Date.now()
        });
        
        console.log('📤 Audio sent to backend');
    } catch (error) {
        console.error('Failed to send audio:', error);
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function updatePTTButton(recording) {
    const btn = document.getElementById('ptt-btn');
    if (!btn) return;
    
    if (recording) {
        btn.classList.add('recording');
        btn.innerHTML = '🎙️ Recording...';
    } else {
        btn.classList.remove('recording');
        btn.innerHTML = '🎤 Push to Talk';
    }
}

// ============================================
// WAVEFORM ANIMATION (Feature 3)
// ============================================
let analyserNode = null;
let waveformAnimationId = null;
let waveformCanvas = null;
let waveformCtx = null;

function showWaveform() {
    const container = document.getElementById('waveform-container');
    if (container) {
        container.classList.add('visible');
    }
}

function hideWaveform() {
    const container = document.getElementById('waveform-container');
    if (container) {
        container.classList.remove('visible');
    }
}

function initWaveformCanvas() {
    waveformCanvas = document.getElementById('waveform-canvas');
    if (waveformCanvas) {
        waveformCtx = waveformCanvas.getContext('2d');
        // Set canvas size
        waveformCanvas.width = waveformCanvas.offsetWidth * 2;
        waveformCanvas.height = waveformCanvas.offsetHeight * 2;
        waveformCtx.scale(2, 2);
    }
}

function startWaveformAnimation() {
    if (!waveformCanvas) {
        initWaveformCanvas();
    }
    
    if (!analyserNode || !waveformCtx) return;
    
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!isRecording) return;
        
        waveformAnimationId = requestAnimationFrame(draw);
        
        analyserNode.getByteFrequencyData(dataArray);
        
        const width = waveformCanvas.offsetWidth;
        const height = waveformCanvas.offsetHeight;
        
        // Clear canvas
        waveformCtx.fillStyle = 'rgba(26, 26, 46, 0.3)';
        waveformCtx.fillRect(0, 0, width, height);
        
        // Draw bars
        const barCount = 32;
        const barWidth = width / barCount - 2;
        const barSpacing = 2;
        
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * bufferLength / barCount);
            const value = dataArray[dataIndex];
            const barHeight = (value / 255) * height * 0.8;
            
            const x = i * (barWidth + barSpacing);
            const y = (height - barHeight) / 2;
            
            // Gradient color based on height
            const hue = 200 + (value / 255) * 60; // Blue to cyan
            waveformCtx.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;
            
            // Rounded bars
            waveformCtx.beginPath();
            waveformCtx.roundRect(x, y, barWidth, barHeight, 3);
            waveformCtx.fill();
        }
    }
    
    draw();
}

function stopWaveformAnimation() {
    if (waveformAnimationId) {
        cancelAnimationFrame(waveformAnimationId);
        waveformAnimationId = null;
    }
}

// ============================================
// TEXT INPUT (Feature 5)
// ============================================
function sendTextMessage(text) {
    if (!text || !text.trim()) return;
    
    sendWebSocketMessage('text', {
        text: text.trim(),
        timestamp: Date.now()
    });
    
    console.log('📝 Text sent:', text);
}

function initTextInput() {
    const input = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-text-btn');
    
    if (!input || !sendBtn) return;
    
    // Send on Enter key
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
    
    // Send on button click
    sendBtn.addEventListener('click', () => {
        const text = input.value;
        if (text.trim()) {
            sendTextMessage(text);
            input.value = '';
        }
    });
}

// Export WebSocket functions for testing
window.connectWebSocket = connectWebSocket;
window.sendWebSocketMessage = sendWebSocketMessage;
window.playBase64Audio = playBase64Audio;
window.sendTextMessage = sendTextMessage;

// --- Setup ---
const scene = new THREE.Scene();
scene.background = null; // Transparent background for desktop overlay

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparency
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Fully transparent clear color
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Disable orbit controls rotation - we use drag to move window instead
controls.enableRotate = false;
controls.enablePan = false;

// --- Window Dragging (for Electron) ---
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

renderer.domElement.addEventListener('mousedown', (e) => {
    // Only drag with left mouse button
    if (e.button === 0) {
        isDragging = true;
        lastMouseX = e.screenX;
        lastMouseY = e.screenY;
    }
});

window.addEventListener('mousemove', (e) => {
    if (isDragging && window.electronAPI) {
        const deltaX = e.screenX - lastMouseX;
        const deltaY = e.screenY - lastMouseY;
        window.electronAPI.dragWindow(deltaX, deltaY);
        lastMouseX = e.screenX;
        lastMouseY = e.screenY;
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

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
// Radio buttons for expressions
document.querySelectorAll('input[name="expression"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        setExpression(e.target.value);
    });
});

// Talk button
let talkingActive = false;
const talkBtn = document.getElementById('talk-btn');
talkBtn.addEventListener('click', (e) => {
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

// Animation buttons
document.querySelectorAll('.anim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const animName = btn.getAttribute('data-anim');
        playAnimation(animName);
    });
});

// --- Character Construction ---
const characterGroup = new THREE.Group();
characterGroup.rotation.y = Math.PI; // Rotate 180 degrees to face camera at +Z
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
// phi: 0 = +X axis, PI/2 = +Z axis, PI = -X axis, 3PI/2 = -Z axis
// We want the face centered on +Z (facing camera at +Z)
// So phiStart should center around PI/2
const phiStart = Math.PI * 0.25;  // Start at 45 degrees
const phiLength = Math.PI * 0.5; // Cover 90 degrees (centered on +Z at 90 degrees)
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
faceMesh.rotation.y = Math.PI; // Rotate 180 degrees to face forward
faceMesh.position.y = -0.05; // Slightly lower to center on face area
faceMesh.renderOrder = 1;
head.add(faceMesh);

// Debug panel to show front direction - bright red box (only visible in debug mode)
const debugPanelGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1);
const debugPanelMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const debugPanel = new THREE.Mesh(debugPanelGeo, debugPanelMat);
debugPanel.position.set(0, 0.5, 1.0); // In front of character at +Z
debugPanel.visible = false; // Hidden by default, shown in debug mode
scene.add(debugPanel);

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

// 4. MAGIC ORNAMENT - 4-pointed star shape (CONNECTION INDICATOR)
// Create with two elongated octahedrons intersecting
const ornamentGroup = new THREE.Group();

// Create special material for ornament - will change color based on connection status
ornamentMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff4444,  // Start red (disconnected)
    emissive: 0x551111,
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.5
});

function createStarPoint(scaleY) {
    const geo = new THREE.OctahedronGeometry(0.08, 0);
    const mesh = new THREE.Mesh(geo, ornamentMaterial);
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
const centerSphere = new THREE.Mesh(centerGeo, ornamentMaterial);
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

// ============================================
// CAPE - Cloth Physics Simulation
// ============================================

const CAPE_WIDTH = 8;  // Number of particles horizontally
const CAPE_HEIGHT = 12; // Number of particles vertically
const CAPE_SEGMENT_WIDTH = 0.08;
const CAPE_SEGMENT_HEIGHT = 0.06;

// Cape material
const capeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.1
});

// Particle system for cloth simulation
class ClothParticle {
    constructor(x, y, z, pinned = false) {
        this.position = new THREE.Vector3(x, y, z);
        this.previousPosition = new THREE.Vector3(x, y, z);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.pinned = pinned;
        this.mass = 1;
    }
    
    applyForce(force) {
        if (!this.pinned) {
            this.acceleration.add(force.clone().divideScalar(this.mass));
        }
    }
    
    update(damping) {
        if (this.pinned) return;
        
        const velocity = this.position.clone().sub(this.previousPosition);
        velocity.multiplyScalar(damping);
        
        this.previousPosition.copy(this.position);
        this.position.add(velocity);
        this.position.add(this.acceleration);
        
        this.acceleration.set(0, 0, 0);
    }
}

class ClothConstraint {
    constructor(p1, p2, restLength) {
        this.p1 = p1;
        this.p2 = p2;
        this.restLength = restLength;
    }
    
    satisfy() {
        const diff = this.p2.position.clone().sub(this.p1.position);
        const currentLength = diff.length();
        const correction = diff.multiplyScalar(1 - this.restLength / currentLength);
        
        if (!this.p1.pinned && !this.p2.pinned) {
            this.p1.position.add(correction.clone().multiplyScalar(0.5));
            this.p2.position.sub(correction.clone().multiplyScalar(0.5));
        } else if (!this.p1.pinned) {
            this.p1.position.add(correction);
        } else if (!this.p2.pinned) {
            this.p2.position.sub(correction);
        }
    }
}

// Create cloth particles
const clothParticles = [];
const clothConstraints = [];

// Cape attachment point (back of neck/shoulders)
// Note: bodyGroup.position.y = 0.5, and the body sphere has scale bodyHeight = 0.5
// The neck is at the top of the body, cape attaches just below neck at shoulder level
const capeAttachY = -0.15; // Lower - right at the top of the body/base of neck (relative to bodyGroup)
const capeAttachZ = 0.18; // Closer to the body at the neck (positive Z = back)

for (let y = 0; y < CAPE_HEIGHT; y++) {
    clothParticles[y] = [];
    for (let x = 0; x < CAPE_WIDTH; x++) {
        // Trapezoid shape: wider at bottom (y increases going down)
        // At top (y=0): normal width, at bottom: 3x width (more dramatic trapezoid)
        const widthMultiplier = 1 + 2 * (y / (CAPE_HEIGHT - 1)); // 1 at top, 3 at bottom
        const px = (x - CAPE_WIDTH / 2 + 0.5) * CAPE_SEGMENT_WIDTH * widthMultiplier;
        const py = capeAttachY - y * CAPE_SEGMENT_HEIGHT;
        const pz = capeAttachZ;
        
        // Pin the top row (attached to shoulders)
        const pinned = (y === 0);
        clothParticles[y][x] = new ClothParticle(px, py, pz, pinned);
    }
}

// Create constraints (springs between particles)
// Rest lengths are calculated from actual particle positions to account for trapezoid shape
for (let y = 0; y < CAPE_HEIGHT; y++) {
    for (let x = 0; x < CAPE_WIDTH; x++) {
        // Horizontal constraint
        if (x < CAPE_WIDTH - 1) {
            const restLength = clothParticles[y][x].position.distanceTo(clothParticles[y][x + 1].position);
            clothConstraints.push(new ClothConstraint(
                clothParticles[y][x],
                clothParticles[y][x + 1],
                restLength
            ));
        }
        // Vertical constraint
        if (y < CAPE_HEIGHT - 1) {
            const restLength = clothParticles[y][x].position.distanceTo(clothParticles[y + 1][x].position);
            clothConstraints.push(new ClothConstraint(
                clothParticles[y][x],
                clothParticles[y + 1][x],
                restLength
            ));
        }
        // Diagonal constraints for stability
        if (x < CAPE_WIDTH - 1 && y < CAPE_HEIGHT - 1) {
            const diagLength1 = clothParticles[y][x].position.distanceTo(clothParticles[y + 1][x + 1].position);
            clothConstraints.push(new ClothConstraint(
                clothParticles[y][x],
                clothParticles[y + 1][x + 1],
                diagLength1
            ));
            const diagLength2 = clothParticles[y][x + 1].position.distanceTo(clothParticles[y + 1][x].position);
            clothConstraints.push(new ClothConstraint(
                clothParticles[y][x + 1],
                clothParticles[y + 1][x],
                diagLength2
            ));
        }
    }
}

// Create cape mesh geometry
const capeGeometry = new THREE.BufferGeometry();
const capeVertices = [];
const capeIndices = [];
const capeUvs = [];

// Build vertices and UVs
for (let y = 0; y < CAPE_HEIGHT; y++) {
    for (let x = 0; x < CAPE_WIDTH; x++) {
        const p = clothParticles[y][x];
        capeVertices.push(p.position.x, p.position.y, p.position.z);
        capeUvs.push(x / (CAPE_WIDTH - 1), 1 - y / (CAPE_HEIGHT - 1));
    }
}

// Build indices for triangles
for (let y = 0; y < CAPE_HEIGHT - 1; y++) {
    for (let x = 0; x < CAPE_WIDTH - 1; x++) {
        const topLeft = y * CAPE_WIDTH + x;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + CAPE_WIDTH;
        const bottomRight = bottomLeft + 1;
        
        capeIndices.push(topLeft, bottomLeft, topRight);
        capeIndices.push(topRight, bottomLeft, bottomRight);
    }
}

capeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(capeVertices, 3));
capeGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(capeUvs, 2));
capeGeometry.setIndex(capeIndices);
capeGeometry.computeVertexNormals();

const capeMesh = new THREE.Mesh(capeGeometry, capeMaterial);
capeMesh.castShadow = true;
capeMesh.receiveShadow = true;
bodyGroup.add(capeMesh);

// Collision spheres for body (simplified collision)
// These are in bodyGroup local space
const collisionSpheres = [
    { center: new THREE.Vector3(0, 0, 0), radius: 0.32 }, // Main body sphere
    { center: new THREE.Vector3(0, 0.25, 0), radius: 0.28 }, // Upper body
];

// Update cape physics
function updateCapePhysics(deltaTime) {
    const dt = Math.min(deltaTime / 1000, 0.033); // Cap at ~30fps worth of simulation
    const gravity = new THREE.Vector3(0, -2.5, 0);
    const damping = 0.97;
    const iterations = 3;
    
    // Get body world position for collision
    const bodyWorldPos = new THREE.Vector3();
    bodyGroup.getWorldPosition(bodyWorldPos);
    
    // Update pinned particles to follow body
    for (let x = 0; x < CAPE_WIDTH; x++) {
        const particle = clothParticles[0][x];
        const localX = (x - CAPE_WIDTH / 2 + 0.5) * CAPE_SEGMENT_WIDTH;
        
        // Get world position of attachment point
        const attachPoint = new THREE.Vector3(localX, capeAttachY, capeAttachZ);
        bodyGroup.localToWorld(attachPoint);
        characterGroup.worldToLocal(attachPoint);
        
        particle.position.copy(attachPoint);
        particle.previousPosition.copy(attachPoint);
    }
    
    // Apply forces
    for (let y = 1; y < CAPE_HEIGHT; y++) {
        for (let x = 0; x < CAPE_WIDTH; x++) {
            const particle = clothParticles[y][x];
            
            // Gravity
            particle.applyForce(gravity.clone().multiplyScalar(dt));
            
            // Wind effect based on character movement
            const wind = new THREE.Vector3(
                Math.sin(Date.now() * 0.002) * 0.3,
                0,
                0.5 + Math.sin(Date.now() * 0.003) * 0.2
            );
            particle.applyForce(wind.clone().multiplyScalar(dt));
        }
    }
    
    // Update particles
    for (let y = 1; y < CAPE_HEIGHT; y++) {
        for (let x = 0; x < CAPE_WIDTH; x++) {
            clothParticles[y][x].update(damping);
        }
    }
    
    // Satisfy constraints multiple times for stability
    for (let i = 0; i < iterations; i++) {
        for (const constraint of clothConstraints) {
            constraint.satisfy();
        }
        
        // Collision detection with body
        for (let y = 1; y < CAPE_HEIGHT; y++) {
            for (let x = 0; x < CAPE_WIDTH; x++) {
                const particle = clothParticles[y][x];
                
                // Convert particle position to body local space for collision
                const localPos = particle.position.clone();
                
                for (const sphere of collisionSpheres) {
                    const toParticle = localPos.clone().sub(sphere.center);
                    const distance = toParticle.length();
                    
                    if (distance < sphere.radius) {
                        // Push particle out of sphere
                        toParticle.normalize().multiplyScalar(sphere.radius);
                        particle.position.copy(sphere.center.clone().add(toParticle));
                    }
                }
                
                // Keep cape behind body (prevent going through front)
                // Positive Z is the back (since character is rotated 180)
                if (particle.position.z < 0.1) {
                    particle.position.z = 0.1;
                }
            }
        }
    }
    
    // Update geometry
    const positions = capeGeometry.attributes.position.array;
    for (let y = 0; y < CAPE_HEIGHT; y++) {
        for (let x = 0; x < CAPE_WIDTH; x++) {
            const idx = (y * CAPE_WIDTH + x) * 3;
            const p = clothParticles[y][x];
            positions[idx] = p.position.x;
            positions[idx + 1] = p.position.y;
            positions[idx + 2] = p.position.z;
        }
    }
    capeGeometry.attributes.position.needsUpdate = true;
    capeGeometry.computeVertexNormals();
}

// ============================================
// ANIMATION SYSTEM
// ============================================

// Store default poses for reset
// NOTE: We animate the JOINTS (leftArmJoint, rightArmJoint, etc.) not the arm groups
// This way the arm rotates from the shoulder, not from the hand
const defaultPose = {
    bodyY: bodyGroup.position.y,
    bodyRotX: bodyGroup.rotation.x,
    bodyRotY: bodyGroup.rotation.y,
    bodyRotZ: bodyGroup.rotation.z,
    // Arm joints - these are the shoulder pivots
    leftArmJointRotZ: leftArmJoint.rotation.z,
    leftArmJointRotX: leftArmJoint.rotation.x,
    rightArmJointRotZ: rightArmJoint.rotation.z,
    rightArmJointRotX: rightArmJoint.rotation.x,
    // Leg joints - these are the hip pivots
    leftLegJointRotZ: leftLegJoint.rotation.z,
    leftLegJointRotX: leftLegJoint.rotation.x,
    rightLegJointRotZ: rightLegJoint.rotation.z,
    rightLegJointRotX: rightLegJoint.rotation.x,
    // Neck
    neckRotX: neckJoint.rotation.x,
    neckRotZ: neckJoint.rotation.z,
    // Character
    characterRotY: characterGroup.rotation.y,
    characterY: characterGroup.position.y
};

// Animation state
let currentAnimation = 'idle';
let animationTime = 0;
let isOneShot = false;
let oneShotComplete = false;

// Reset to default pose
function resetPose() {
    bodyGroup.position.y = defaultPose.bodyY;
    bodyGroup.rotation.x = defaultPose.bodyRotX;
    bodyGroup.rotation.y = defaultPose.bodyRotY;
    bodyGroup.rotation.z = defaultPose.bodyRotZ;
    // Reset arm joints
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ;
    leftArmJoint.rotation.x = defaultPose.leftArmJointRotX;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ;
    rightArmJoint.rotation.x = defaultPose.rightArmJointRotX;
    // Reset leg joints
    leftLegJoint.rotation.z = defaultPose.leftLegJointRotZ;
    leftLegJoint.rotation.x = defaultPose.leftLegJointRotX;
    rightLegJoint.rotation.z = defaultPose.rightLegJointRotZ;
    rightLegJoint.rotation.x = defaultPose.rightLegJointRotX;
    // Reset neck
    neckJoint.rotation.x = defaultPose.neckRotX;
    neckJoint.rotation.z = defaultPose.neckRotZ;
    // Reset character
    characterGroup.rotation.y = defaultPose.characterRotY;
    characterGroup.position.y = defaultPose.characterY;
}

// Animation functions
// NOTE: We animate the JOINTS (shoulder/hip pivots), not the limb groups
// This ensures rotation happens from the correct pivot point

function animateIdle(t) {
    // Gentle breathing/bobbing
    const breathe = Math.sin(t * 2) * 0.02;
    bodyGroup.position.y = defaultPose.bodyY + breathe;
    
    // Slight arm sway - rotate from shoulder joint
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * 1.5) * 0.05;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * 1.5 + 0.5) * 0.05;
    
    // Tiny head tilt
    neckJoint.rotation.z = Math.sin(t * 0.8) * 0.03;
}

function animateDance(t) {
    // Bouncy body
    const bounce = Math.abs(Math.sin(t * 6)) * 0.1;
    bodyGroup.position.y = defaultPose.bodyY + bounce;
    
    // Body sway
    bodyGroup.rotation.z = Math.sin(t * 3) * 0.15;
    
    // Arms pumping - rotate from shoulder joints
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * 6) * 0.5;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * 6 + Math.PI) * 0.5;
    
    // Legs moving - rotate from hip joints
    leftLegJoint.rotation.x = Math.sin(t * 6) * 0.3;
    rightLegJoint.rotation.x = Math.sin(t * 6 + Math.PI) * 0.3;
    
    // Head bobbing
    neckJoint.rotation.z = Math.sin(t * 3) * 0.1;
}

function animateYata(t) {
    // One-shot punch the air animation (about 1 second)
    const duration = 1.0;
    const progress = Math.min(t / duration, 1);
    
    if (progress < 0.3) {
        // Wind up
        const p = progress / 0.3;
        bodyGroup.rotation.z = -0.1 * p;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 0.3 * p; // Wind up down slightly
        rightArmJoint.rotation.x = 0.3 * p; // Arm goes back
        neckJoint.rotation.z = -0.1 * p; // Head tilts away
    } else if (progress < 0.5) {
        // Punch UP and FORWARD!
        const p = (progress - 0.3) / 0.2;
        bodyGroup.rotation.z = -0.1 + 0.2 * p;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 0.3 - 1.3 * p; // Arm UP! (not too far)
        rightArmJoint.rotation.x = 0.3 - 0.8 * p; // Arm goes FORWARD (negative X)
        bodyGroup.position.y = defaultPose.bodyY + 0.15 * p; // Jump up
        neckJoint.rotation.z = -0.1 + 0.2 * p; // Head tilts toward arm
    } else if (progress < 0.8) {
        // Hold pose - arm up and forward
        bodyGroup.rotation.z = 0.1;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0; // Arm raised up (less extreme)
        rightArmJoint.rotation.x = -0.5; // Arm forward
        bodyGroup.position.y = defaultPose.bodyY + 0.15;
        neckJoint.rotation.z = 0.1; // Head looking at arm
    } else {
        // Return
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
    // Slow breathing
    const breathe = Math.sin(t * 1) * 0.03;
    bodyGroup.position.y = defaultPose.bodyY + breathe - 0.05;
    
    // Head drooped forward
    neckJoint.rotation.x = 0.3;
    
    // Arms relaxed down - rotate from shoulder joints
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + 0.3;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 0.3;
    
    // Slight sway
    bodyGroup.rotation.z = Math.sin(t * 0.5) * 0.02;
}

function animateWalk(t) {
    // Walking cycle
    const speed = 4;
    
    // Legs alternating - rotate from hip joints
    leftLegJoint.rotation.x = Math.sin(t * speed) * 0.4;
    rightLegJoint.rotation.x = Math.sin(t * speed + Math.PI) * 0.4;
    
    // Arms swinging opposite to legs - rotate from shoulder joints
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * speed + Math.PI) * 0.2;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * speed) * 0.2;
    
    // Body bob
    bodyGroup.position.y = defaultPose.bodyY + Math.abs(Math.sin(t * speed * 2)) * 0.03;
    
    // Slight body rotation
    bodyGroup.rotation.z = Math.sin(t * speed) * 0.05;
}

function animateRun(t) {
    // Running cycle - faster than walk
    const speed = 8;
    
    // Legs alternating faster and higher - rotate from hip joints
    leftLegJoint.rotation.x = Math.sin(t * speed) * 0.6;
    rightLegJoint.rotation.x = Math.sin(t * speed + Math.PI) * 0.6;
    
    // Arms pumping - rotate from shoulder joints
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ + Math.sin(t * speed + Math.PI) * 0.4;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + Math.sin(t * speed) * 0.4;
    
    // More pronounced body bob
    bodyGroup.position.y = defaultPose.bodyY + Math.abs(Math.sin(t * speed * 2)) * 0.08;
    
    // Body lean forward slightly
    bodyGroup.rotation.x = 0.1;
    bodyGroup.rotation.z = Math.sin(t * speed) * 0.08;
}

function animateFloat(t) {
    // Floating/hovering in air
    const floatHeight = Math.sin(t * 1.5) * 0.1;
    characterGroup.position.y = floatHeight + 0.2;
    
    // Gentle rotation
    bodyGroup.rotation.z = Math.sin(t * 0.8) * 0.1;
    
    // Arms spread out gently waving - rotate from shoulder joints
    leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ - 0.3 + Math.sin(t * 2) * 0.1;
    rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 0.3 + Math.sin(t * 2 + 1) * 0.1;
    
    // Legs relaxed - rotate from hip joints
    leftLegJoint.rotation.z = defaultPose.leftLegJointRotZ + 0.1 + Math.sin(t * 1.2) * 0.05;
    rightLegJoint.rotation.z = defaultPose.rightLegJointRotZ - 0.1 + Math.sin(t * 1.2 + 0.5) * 0.05;
    
    // Head looking around
    neckJoint.rotation.z = Math.sin(t * 0.7) * 0.1;
}

function animateRoll(t) {
    // Ballerina spin (about 1.5 seconds)
    const duration = 1.5;
    const progress = Math.min(t / duration, 1);
    
    // Spin around Y axis
    characterGroup.rotation.y = defaultPose.characterRotY + progress * Math.PI * 4; // Two full spins
    
    // Rise up during spin
    if (progress < 0.5) {
        characterGroup.position.y = progress * 0.3;
        // Arms out - rotate from shoulder joints
        leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ - progress * 1.0;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + progress * 1.0;
    } else {
        characterGroup.position.y = 0.3 - (progress - 0.5) * 0.6;
        // Arms back
        leftArmJoint.rotation.z = defaultPose.leftArmJointRotZ - 1.0 + (progress - 0.5) * 2.0;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ + 1.0 - (progress - 0.5) * 2.0;
    }
    
    // One leg up during spin - rotate from hip joint
    leftLegJoint.rotation.x = Math.sin(progress * Math.PI) * 0.5;
    
    if (progress >= 1) oneShotComplete = true;
}

function animateWave(t) {
    // Wave with right hand (about 2 seconds)
    const duration = 2.0;
    const progress = Math.min(t / duration, 1);
    
    // Raise arm UP and FORWARD - rotate from shoulder joint
    const headTilt = -Math.PI / 9; // -20 degrees in radians
    if (progress < 0.2) {
        const p = progress / 0.2;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0 * p; // UP (less extreme to avoid head)
        rightArmJoint.rotation.x = -0.5 * p; // FORWARD
        neckJoint.rotation.z = headTilt * p; // Head tilts 15 degrees to give space
    } else if (progress < 0.8) {
        // Wave back and forth - arm stays up and forward
        const waveProgress = (progress - 0.2) / 0.6;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0; // Keep arm up
        // Wave by rotating on X axis (forward/back motion)
        rightArmJoint.rotation.x = -0.5 + Math.sin(waveProgress * Math.PI * 6) * 0.3;
        neckJoint.rotation.z = headTilt; // Head tilted 15 degrees
    } else {
        // Lower arm back down
        const p = (progress - 0.8) / 0.2;
        rightArmJoint.rotation.z = defaultPose.rightArmJointRotZ - 1.0 * (1 - p);
        rightArmJoint.rotation.x = -0.5 * (1 - p);
        neckJoint.rotation.z = headTilt * (1 - p);
    }
    
    // Slight body movement
    bodyGroup.rotation.z = Math.sin(t * 3) * 0.05;
    
    if (progress >= 1) oneShotComplete = true;
}

// Play animation
function playAnimation(name) {
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

// Update animation each frame
function updateAnimation(deltaTime) {
    animationTime += deltaTime / 1000; // Convert to seconds
    
    // If one-shot is complete, return to idle
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

// Export for UI
window.playAnimation = playAnimation;

// --- Debug Toggle ---
const debugToggle = document.getElementById('debug-toggle');
debugToggle.checked = false; // Default OFF
function updateDebug() {
    const visible = debugToggle.checked;
    joints.forEach(j => j.visible = visible);
    axisHelper.visible = visible;
    debugPanel.visible = visible; // Red FRONT panel
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
    
    // Update body animations
    updateAnimation(deltaTime);
    
    // Update cape physics
    updateCapePhysics(deltaTime);

    controls.update();
    renderer.render(scene, camera);
}

// --- Resize Handler ---
window.addEventListener('resize', () => {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// --- UI Panel Toggle (for Electron F1 shortcut) ---
const uiPanel = document.getElementById('ui-panel');
const canvasContainer = document.getElementById('canvas-container');
let uiPanelVisible = false; // Hidden by default
uiPanel.style.display = 'none'; // Hide on startup

// Window sizes
const COMPACT_WIDTH = 350;
const COMPACT_HEIGHT = 450;
const EXPANDED_WIDTH = 700;  // Panel (280) + avatar area (400) + padding
const EXPANDED_HEIGHT = 500;

window.toggleUIPanel = function() {
    uiPanelVisible = !uiPanelVisible;
    uiPanel.style.display = uiPanelVisible ? 'block' : 'none';
    
    // Resize window in Electron
    if (window.electronAPI) {
        if (uiPanelVisible) {
            window.electronAPI.resizeWindow(EXPANDED_WIDTH, EXPANDED_HEIGHT);
        } else {
            window.electronAPI.resizeWindow(COMPACT_WIDTH, COMPACT_HEIGHT);
        }
    }
    
    // Shift canvas to make room for panel
    if (uiPanelVisible) {
        canvasContainer.classList.add('panel-open');
    } else {
        canvasContainer.classList.remove('panel-open');
    }
    
    // Update renderer size after layout change
    setTimeout(() => {
        camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    }, 50);
};

// Also allow F1 in browser
window.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
        e.preventDefault();
        window.toggleUIPanel();
    }
});

// ============================================
// INITIALIZE NEW FEATURES
// ============================================

// Text input toggle state
let textInputVisible = false;

function toggleTextInput() {
    const container = document.getElementById('text-input-container');
    const toggleBtn = document.getElementById('toggle-textbox-btn');
    
    textInputVisible = !textInputVisible;
    
    if (container) {
        if (textInputVisible) {
            container.classList.remove('hidden');
            // Focus the input when shown
            const input = document.getElementById('text-input');
            if (input) setTimeout(() => input.focus(), 100);
        } else {
            container.classList.add('hidden');
        }
    }
    
    if (toggleBtn) {
        if (textInputVisible) {
            toggleBtn.classList.add('active');
        } else {
            toggleBtn.classList.remove('active');
        }
    }
}

// Initialize toggle button
const toggleBtn = document.getElementById('toggle-textbox-btn');
if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTextInput);
}

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
        if (!isRecording) {
            startRecording();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftRight') {
        e.preventDefault();
        if (isRecording) {
            stopRecording();
        }
    }
});

// Export toggle function
window.toggleTextInput = toggleTextInput;

// Initialize text input
initTextInput();

// Connect to WebSocket server
connectWebSocket();

animate();