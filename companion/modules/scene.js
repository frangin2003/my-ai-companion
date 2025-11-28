// ============================================
// THREE.JS SCENE MODULE
// Sets up the 3D scene, camera, renderer, and lights
// ============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene elements
export let scene;
export let camera;
export let renderer;
export let controls;

// Materials (shared across modules)
export let whiteMaterial;
export let blueMaterial;
export let debugJointMaterial;
export let textureLoader;

export function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = null; // Transparent background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 4);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Create controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controls.enableRotate = false;
    controls.enablePan = false;
    
    // Setup window dragging
    setupWindowDragging();
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Create materials
    textureLoader = new THREE.TextureLoader();
    
    whiteMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xe3dfd4
    });
    
    blueMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a90d9 
    });
    
    debugJointMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.5,
        wireframe: true
    });
    
    // Setup resize handler
    window.addEventListener('resize', handleResize);
    
    return { scene, camera, renderer, controls };
}

function setupWindowDragging() {
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    renderer.domElement.addEventListener('mousedown', (e) => {
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
}

function handleResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

export function render() {
    controls.update();
    renderer.render(scene, camera);
}

