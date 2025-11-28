// ============================================
// CHARACTER CONSTRUCTION MODULE
// Builds the 3D avatar model (body, head, limbs, etc.)
// ============================================

import * as THREE from 'three';
import { scene, whiteMaterial, blueMaterial, debugJointMaterial } from './scene.js';
import { faceMaterial, setFaceMesh, loadFaceTexture } from './face.js';

// Character groups and joints (exported for animation)
export let characterGroup;
export let bodyGroup;
export let neckJoint;
export let leftArmJoint, rightArmJoint;
export let leftLegJoint, rightLegJoint;
export let ornamentGroup;
export let ornamentMaterial;
export let headRadius;

// Joint meshes for debug
export const joints = [];

// Connection status colors for the star ornament
const CONNECTION_COLORS = {
    'connected': 0x4a90d9,
    'connecting': 0xffa500,
    'disconnected': 0xff4444,
    'error': 0xff4444
};

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

function createCurvedHorn(isLeft) {
    const side = isLeft ? 1 : -1;
    
    const startPoint = new THREE.Vector3(0, 0, 0);
    const controlPoint = new THREE.Vector3(side * 0.25, 0.15, 0);
    const endPoint = new THREE.Vector3(side * 0.4, 0.25, 0);
    
    const curve = new THREE.QuadraticBezierCurve3(startPoint, controlPoint, endPoint);
    
    const tubeSegments = 20;
    const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.15, 12, false);
    
    const positions = tubeGeo.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        
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
        
        const taper = 1.0 - (t * 0.8);
        const pointOnCurve = curve.getPoint(t);
        const offset = vertex.clone().sub(pointOnCurve);
        offset.multiplyScalar(taper);
        vertex.copy(pointOnCurve).add(offset);
        
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    tubeGeo.attributes.position.needsUpdate = true;
    tubeGeo.computeVertexNormals();
    
    const horn = new THREE.Mesh(tubeGeo, whiteMaterial);
    horn.castShadow = true;
    
    const baseCapGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const baseCap = new THREE.Mesh(baseCapGeo, whiteMaterial);
    baseCap.scale.set(1, 0.5, 1);
    baseCap.position.copy(startPoint);
    
    const tipGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const tip = new THREE.Mesh(tipGeo, whiteMaterial);
    tip.position.copy(endPoint);
    
    const hornGroup = new THREE.Group();
    hornGroup.add(horn);
    hornGroup.add(baseCap);
    hornGroup.add(tip);
    
    return hornGroup;
}

function createArm(isLeft) {
    const armGroup = new THREE.Group();
    
    const armLength = 0.45;
    const armWidthBase = 0.12;
    const armWidthTip = 0.08;
    
    const armGeo = new THREE.CylinderGeometry(armWidthTip, armWidthBase, armLength, 16);
    const arm = new THREE.Mesh(armGeo, blueMaterial);
    arm.castShadow = true;
    
    const handGeo = new THREE.SphereGeometry(armWidthTip, 16, 16);
    const hand = new THREE.Mesh(handGeo, blueMaterial);
    hand.position.y = armLength / 2;
    arm.add(hand);
    
    armGroup.add(arm);
    
    return { group: armGroup, length: armLength };
}

function createLeg() {
    const legGroup = new THREE.Group();
    
    const legLength = 0.45;
    const legWidth = 0.12;
    
    const legGeo = new THREE.CapsuleGeometry(legWidth, legLength - legWidth * 2, 8, 16);
    const leg = new THREE.Mesh(legGeo, blueMaterial);
    leg.castShadow = true;
    
    legGroup.add(leg);
    
    return { group: legGroup, length: legLength };
}

export function buildCharacter() {
    // Main character group
    characterGroup = new THREE.Group();
    characterGroup.rotation.y = Math.PI;
    scene.add(characterGroup);
    
    // Body
    bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.5;
    characterGroup.add(bodyGroup);
    
    const bodyHeight = 0.5;
    const bodyWidth = 0.35;
    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const body = new THREE.Mesh(bodyGeo, blueMaterial);
    body.scale.set(bodyWidth, bodyHeight, bodyWidth * 0.8);
    body.castShadow = true;
    bodyGroup.add(body);
    
    // Head
    headRadius = 0.55;
    const headGeo = new THREE.SphereGeometry(headRadius, 32, 32);
    const head = new THREE.Mesh(headGeo, whiteMaterial);
    head.scale.set(1, 0.92, 0.95);
    head.castShadow = true;
    
    neckJoint = createJoint(bodyGroup, 0, bodyHeight * 0.85, 0);
    head.position.y = headRadius * 0.75;
    neckJoint.add(head);
    
    // Face
    const faceRadius = headRadius * 1.08;
    const phiStart = Math.PI * 0.25;
    const phiLength = Math.PI * 0.5;
    const thetaStart = Math.PI * 0.15;
    const thetaLength = Math.PI * 0.55;
    
    const faceGeo = new THREE.SphereGeometry(faceRadius, 32, 32, phiStart, phiLength, thetaStart, thetaLength);
    
    const faceMesh = new THREE.Mesh(faceGeo, faceMaterial);
    faceMesh.rotation.y = Math.PI;
    faceMesh.position.y = -0.05;
    faceMesh.renderOrder = 1;
    head.add(faceMesh);
    setFaceMesh(faceMesh);
    
    // Horns
    const leftHorn = createCurvedHorn(true);
    leftHorn.position.set(headRadius * 0.5, headRadius * 0.25, 0);
    head.add(leftHorn);
    
    const rightHorn = createCurvedHorn(false);
    rightHorn.position.set(-headRadius * 0.5, headRadius * 0.25, 0);
    head.add(rightHorn);
    
    // Ornament (connection indicator)
    ornamentGroup = new THREE.Group();
    
    ornamentMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff4444,
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
    
    const centerGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const centerSphere = new THREE.Mesh(centerGeo, ornamentMaterial);
    ornamentGroup.add(centerSphere);
    
    ornamentGroup.position.y = headRadius + 0.35;
    ornamentGroup.castShadow = true;
    head.add(ornamentGroup);
    
    // Arms
    const leftArmData = createArm(true);
    leftArmJoint = createJoint(bodyGroup, bodyWidth * 0.55, bodyHeight * 0.4, 0);
    leftArmData.group.rotation.z = -Math.PI / 2 - 0.3;
    leftArmData.group.position.x = leftArmData.length / 2;
    leftArmJoint.add(leftArmData.group);
    
    const rightArmData = createArm(false);
    rightArmJoint = createJoint(bodyGroup, -bodyWidth * 0.55, bodyHeight * 0.4, 0);
    rightArmData.group.rotation.z = Math.PI / 2 + 0.3;
    rightArmData.group.position.x = -(rightArmData.length / 2);
    rightArmJoint.add(rightArmData.group);
    
    // Legs
    const leftLegData = createLeg();
    leftLegJoint = createJoint(bodyGroup, bodyWidth * 0.55, -bodyHeight * 0.5, 0);
    leftLegData.group.rotation.z = 0.15;
    leftLegData.group.position.y = -leftLegData.length / 2;
    leftLegJoint.add(leftLegData.group);
    
    const rightLegData = createLeg();
    rightLegJoint = createJoint(bodyGroup, -bodyWidth * 0.55, -bodyHeight * 0.5, 0);
    rightLegData.group.rotation.z = -0.15;
    rightLegData.group.position.y = -rightLegData.length / 2;
    rightLegJoint.add(rightLegData.group);
    
    // Load face texture
    loadFaceTexture('face.png');
    
    // Debug helpers
    const axisHelper = new THREE.AxesHelper(1);
    axisHelper.position.set(1.5, 0.5, 0);
    axisHelper.visible = false;
    scene.add(axisHelper);
    
    return {
        characterGroup,
        bodyGroup,
        neckJoint,
        leftArmJoint,
        rightArmJoint,
        leftLegJoint,
        rightLegJoint,
        ornamentGroup,
        headRadius,
        axisHelper
    };
}

export function updateConnectionStatus(status) {
    if (ornamentMaterial) {
        const color = CONNECTION_COLORS[status] || CONNECTION_COLORS.disconnected;
        ornamentMaterial.color.setHex(color);
        
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

export function updateOrnament(time) {
    if (ornamentGroup) {
        ornamentGroup.position.y = headRadius + 0.35 + Math.sin(time) * 0.03;
        ornamentGroup.rotation.y += 0.015;
        ornamentGroup.rotation.z = Math.sin(time * 0.5) * 0.1;
    }
}

