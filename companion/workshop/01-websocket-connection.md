# Feature 1: WebSocket Connection with Auto-Reconnection

## Overview
In this step, we'll add a WebSocket connection to the companion avatar that automatically reconnects when the connection is lost.

## What You'll Learn
- How to establish WebSocket connections in JavaScript
- Implementing automatic reconnection logic
- Displaying connection status to users

---

## Step 1: The Star Connection Indicator

The connection status is shown using the **star ornament** on top of the avatar's head! The star changes color based on connection status:

| Status | Star Color |
|--------|------------|
| 🔴 Disconnected | Red |
| 🟠 Connecting | Orange |
| 🔵 Connected | Blue |

No HTML changes needed - the star is already part of the 3D avatar!

---

## Step 2: Add Connection Status Colors

In your `main.js`, add these color constants near the top (after imports):

```javascript
// Connection status colors for the star ornament
const CONNECTION_COLORS = {
    'connected': 0x4a90d9,    // Blue - connected
    'connecting': 0xffa500,   // Orange - connecting
    'disconnected': 0xff4444, // Red - disconnected
    'error': 0xff4444         // Red - error
};

let ornamentMaterial = null; // Will be set when ornament is created
```

---

## Step 3: Add WebSocket Logic

Add this JavaScript code at the **top** of your `main.js` file (after the imports):

```javascript
// ============================================
// WEBSOCKET CONNECTION
// ============================================
const WS_URL = 'ws://localhost:8080';
let websocket = null;
let wsReconnectTimer = null;
const WS_RECONNECT_DELAY = 3000; // 3 seconds
let wsConnected = false;

function connectWebSocket() {
    // Don't create a new connection if one is already active
    if (websocket && (websocket.readyState === WebSocket.CONNECTING || 
                      websocket.readyState === WebSocket.OPEN)) {
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
            console.log('📨 Received:', event.data);
            // We'll handle messages in a later feature
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

function updateConnectionStatus(status) {
    // Update the star ornament color
    if (ornamentMaterial) {
        const color = CONNECTION_COLORS[status] || CONNECTION_COLORS.disconnected;
        ornamentMaterial.color.setHex(color);
        
        // Add emissive glow based on status
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

// Export for debugging
window.connectWebSocket = connectWebSocket;
window.sendWebSocketMessage = sendWebSocketMessage;
```

---

## Step 4: Initialize the Connection

At the **end** of your `main.js` file (before `animate();`), add:

```javascript
// Connect to WebSocket server
connectWebSocket();
```

---

## Step 4: Update the Ornament Material

Find the ornament creation code in `main.js` and update it to use our custom material:

```javascript
// 4. MAGIC ORNAMENT - 4-pointed star shape (CONNECTION INDICATOR)
const ornamentGroup = new THREE.Group();

// Create special material for ornament - changes color based on connection
ornamentMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff4444,  // Start red (disconnected)
    emissive: 0x551111,
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.5
});

function createStarPoint(scaleY) {
    const geo = new THREE.OctahedronGeometry(0.08, 0);
    const mesh = new THREE.Mesh(geo, ornamentMaterial); // Use our material!
    mesh.scale.set(0.5, scaleY, 0.5);
    return mesh;
}
```

---

## Testing

1. Start your Electron app with `npm start`
2. The **star on the avatar's head** should be **RED** (disconnected)
3. Start a WebSocket server on `ws://localhost:8080`
4. The star should turn **BLUE** (connected)
5. Stop the server - star turns **ORANGE** briefly, then **RED**

### Simple Test Server (Node.js)

Create a file `test-server.js`:

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected!');
    ws.on('message', (msg) => console.log('Received:', msg.toString()));
    ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server running on ws://localhost:8080');
```

Run it with: `node test-server.js`

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| `WebSocket.CONNECTING` | Connection is being established |
| `WebSocket.OPEN` | Connection is open and ready |
| `WebSocket.CLOSING` | Connection is closing |
| `WebSocket.CLOSED` | Connection is closed |

---

## Next Step

Continue to [Feature 2: Push to Talk](./02-push-to-talk.md)

