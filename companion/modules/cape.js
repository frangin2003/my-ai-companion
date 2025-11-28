// ============================================
// CAPE PHYSICS MODULE
// Cloth simulation for the cape
// ============================================

import * as THREE from 'three';
import { bodyGroup, characterGroup } from './character.js';

const CAPE_WIDTH = 8;
const CAPE_HEIGHT = 12;
const CAPE_SEGMENT_WIDTH = 0.08;
const CAPE_SEGMENT_HEIGHT = 0.06;

let clothParticles = [];
let clothConstraints = [];
let capeGeometry;
let capeMesh;

const capeAttachY = -0.15;
const capeAttachZ = 0.18;

const collisionSpheres = [
    { center: new THREE.Vector3(0, 0, 0), radius: 0.32 },
    { center: new THREE.Vector3(0, 0.25, 0), radius: 0.28 },
];

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

export function buildCape() {
    // Create particles
    for (let y = 0; y < CAPE_HEIGHT; y++) {
        clothParticles[y] = [];
        for (let x = 0; x < CAPE_WIDTH; x++) {
            const widthMultiplier = 1 + 2 * (y / (CAPE_HEIGHT - 1));
            const px = (x - CAPE_WIDTH / 2 + 0.5) * CAPE_SEGMENT_WIDTH * widthMultiplier;
            const py = capeAttachY - y * CAPE_SEGMENT_HEIGHT;
            const pz = capeAttachZ;
            
            const pinned = (y === 0);
            clothParticles[y][x] = new ClothParticle(px, py, pz, pinned);
        }
    }
    
    // Create constraints
    for (let y = 0; y < CAPE_HEIGHT; y++) {
        for (let x = 0; x < CAPE_WIDTH; x++) {
            if (x < CAPE_WIDTH - 1) {
                const restLength = clothParticles[y][x].position.distanceTo(clothParticles[y][x + 1].position);
                clothConstraints.push(new ClothConstraint(clothParticles[y][x], clothParticles[y][x + 1], restLength));
            }
            if (y < CAPE_HEIGHT - 1) {
                const restLength = clothParticles[y][x].position.distanceTo(clothParticles[y + 1][x].position);
                clothConstraints.push(new ClothConstraint(clothParticles[y][x], clothParticles[y + 1][x], restLength));
            }
            if (x < CAPE_WIDTH - 1 && y < CAPE_HEIGHT - 1) {
                const diagLength1 = clothParticles[y][x].position.distanceTo(clothParticles[y + 1][x + 1].position);
                clothConstraints.push(new ClothConstraint(clothParticles[y][x], clothParticles[y + 1][x + 1], diagLength1));
                const diagLength2 = clothParticles[y][x + 1].position.distanceTo(clothParticles[y + 1][x].position);
                clothConstraints.push(new ClothConstraint(clothParticles[y][x + 1], clothParticles[y + 1][x], diagLength2));
            }
        }
    }
    
    // Create geometry
    capeGeometry = new THREE.BufferGeometry();
    const capeVertices = [];
    const capeIndices = [];
    const capeUvs = [];
    
    for (let y = 0; y < CAPE_HEIGHT; y++) {
        for (let x = 0; x < CAPE_WIDTH; x++) {
            const p = clothParticles[y][x];
            capeVertices.push(p.position.x, p.position.y, p.position.z);
            capeUvs.push(x / (CAPE_WIDTH - 1), 1 - y / (CAPE_HEIGHT - 1));
        }
    }
    
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
    
    const capeMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc2222,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1
    });
    
    capeMesh = new THREE.Mesh(capeGeometry, capeMaterial);
    capeMesh.castShadow = true;
    capeMesh.receiveShadow = true;
    bodyGroup.add(capeMesh);
    
    return capeMesh;
}

export function updateCapePhysics(deltaTime) {
    const dt = Math.min(deltaTime / 1000, 0.033);
    const gravity = new THREE.Vector3(0, -2.5, 0);
    const damping = 0.97;
    const iterations = 3;
    
    // Update pinned particles
    for (let x = 0; x < CAPE_WIDTH; x++) {
        const particle = clothParticles[0][x];
        const localX = (x - CAPE_WIDTH / 2 + 0.5) * CAPE_SEGMENT_WIDTH;
        
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
            
            particle.applyForce(gravity.clone().multiplyScalar(dt));
            
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
    
    // Satisfy constraints
    for (let i = 0; i < iterations; i++) {
        for (const constraint of clothConstraints) {
            constraint.satisfy();
        }
        
        // Collision detection
        for (let y = 1; y < CAPE_HEIGHT; y++) {
            for (let x = 0; x < CAPE_WIDTH; x++) {
                const particle = clothParticles[y][x];
                const localPos = particle.position.clone();
                
                for (const sphere of collisionSpheres) {
                    const toParticle = localPos.clone().sub(sphere.center);
                    const distance = toParticle.length();
                    
                    if (distance < sphere.radius) {
                        toParticle.normalize().multiplyScalar(sphere.radius);
                        particle.position.copy(sphere.center.clone().add(toParticle));
                    }
                }
                
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

