// ============================================
// WEBSOCKET CONNECTION MODULE
// Handles connection to backend with auto-reconnect
// ============================================

const WS_URL = 'ws://localhost:8000/ws';
let websocket = null;
let wsReconnectTimer = null;
const WS_RECONNECT_DELAY = 3000;
let wsConnected = false;

// Callbacks that can be set by other modules
let onMessageCallback = null;
let onConnectionStatusChange = null;

export function setMessageCallback(callback) {
    onMessageCallback = callback;
}

export function setConnectionStatusCallback(callback) {
    onConnectionStatusChange = callback;
}

export function connectWebSocket() {
    if (websocket && (websocket.readyState === WebSocket.CONNECTING || websocket.readyState === WebSocket.OPEN)) {
        return;
    }
    
    console.log('🔌 Connecting to WebSocket:', WS_URL);
    if (onConnectionStatusChange) onConnectionStatusChange('connecting');
    
    try {
        websocket = new WebSocket(WS_URL);
        
        websocket.onopen = () => {
            console.log('✅ WebSocket connected!');
            wsConnected = true;
            if (onConnectionStatusChange) onConnectionStatusChange('connected');
            
            if (wsReconnectTimer) {
                clearTimeout(wsReconnectTimer);
                wsReconnectTimer = null;
            }
        };
        
        websocket.onclose = (event) => {
            console.log('❌ WebSocket closed:', event.code, event.reason);
            wsConnected = false;
            if (onConnectionStatusChange) onConnectionStatusChange('disconnected');
            scheduleReconnect();
        };
        
        websocket.onerror = (error) => {
            console.error('⚠️ WebSocket error:', error);
            if (onConnectionStatusChange) onConnectionStatusChange('error');
        };
        
        websocket.onmessage = (event) => {
            if (onMessageCallback) {
                onMessageCallback(event.data);
            }
        };
        
    } catch (error) {
        console.error('Failed to create WebSocket:', error);
        if (onConnectionStatusChange) onConnectionStatusChange('error');
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

export function sendMessage(type, data) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot send message');
        return false;
    }
    
    const message = JSON.stringify({ type, ...data });
    websocket.send(message);
    return true;
}

export function isConnected() {
    return wsConnected;
}

// Export for global access
window.connectWebSocket = connectWebSocket;
window.sendWebSocketMessage = sendMessage;

