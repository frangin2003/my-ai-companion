# Feature 5: Text Input to Send Messages

## Overview
Add a text input field that allows users to send text messages to the backend. The text input is **hidden by default** and can be toggled with a button or the **T** key.

## What You'll Learn
- Creating a toggleable UI component
- Handling keyboard events (Enter to send, T to toggle)
- Sending text via WebSocket
- CSS transitions for smooth show/hide

---

## Step 1: Update HTML

Add the toggle button and text input container inside `#bottom-controls` in `index.html`. The controls appear **below the avatar**:

```html
<!-- Bottom Controls - Below Avatar -->
<div id="bottom-controls">
    <!-- Toggle Text Input Button -->
    <button id="toggle-textbox-btn" class="toggle-btn" title="Toggle text input (T)">
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <span>Chat</span>
    </button>
    
    <!-- Text Input (Hidden by default) -->
    <div id="text-input-container" class="hidden">
        <input type="text" id="text-input" placeholder="Type a message... (Enter to send)" autocomplete="off">
        <button id="send-text-btn" class="comm-btn send-btn" title="Send message">
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
        </button>
    </div>
    
    <!-- PTT Hint -->
    <div class="ptt-hint">
        <span class="key-hint">Right Shift</span> to talk
    </div>
</div>
```

> **Note:** The avatar is always on top of these controls - you can drag the avatar and the controls stay below!

---

## Step 2: Add Input Styles

Add these styles to your `style.css`:

```css
/* Bottom Controls Container - Below Avatar */
#bottom-controls {
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 100;
    /* Hidden by default, shown on hover */
    opacity: 0;
    transition: opacity 0.3s ease;
}

/* Show controls when hovering over the app */
body:hover #bottom-controls {
    opacity: 1;
}

/* Keep controls visible when text input is active */
#bottom-controls:has(#text-input-container:not(.hidden)),
#bottom-controls:focus-within {
    opacity: 1;
}

/* Toggle Button */
.toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, rgba(40, 40, 60, 0.9) 0%, rgba(30, 30, 50, 0.95) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 25px;
    color: #ccc;
    font-size: 0.85em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.toggle-btn:hover {
    background: linear-gradient(135deg, rgba(50, 50, 75, 0.95) 0%, rgba(40, 40, 60, 0.98) 100%);
    color: #fff;
    transform: translateY(-2px);
}

.toggle-btn.active {
    background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
    color: #fff;
}

/* Text Input Container */
#text-input-container {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 14px;
    background: linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

#text-input-container.hidden {
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
    height: 0;
    padding: 0;
    overflow: hidden;
}

#text-input {
    width: 250px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 0.9em;
    outline: none;
    transition: all 0.2s ease;
}

#text-input:focus {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(74, 144, 217, 0.5);
}

.send-btn {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
}
```

---

## Step 3: Add Text Input Logic

Add this JavaScript to your `main.js`:

```javascript
// ============================================
// TEXT INPUT
// ============================================

// Text input visibility state
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
        toggleBtn.classList.toggle('active', textInputVisible);
    }
}

function sendTextMessage(text) {
    if (!text || !text.trim()) return;
    
    // Format per SERVER_SPEC.md: type="message", data.content
    sendWebSocketMessage('message', {
        data: {
            content: text.trim()
        }
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

// Export for testing
window.sendTextMessage = sendTextMessage;
window.toggleTextInput = toggleTextInput;
```

---

## Step 4: Initialize Toggle and Text Input

At the end of your `main.js` (before `animate();`), add:

```javascript
// Initialize toggle button
const toggleBtn = document.getElementById('toggle-textbox-btn');
if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTextInput);
}

// T key to toggle text input (when not already typing)
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyT' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        toggleTextInput();
    }
});

// Initialize text input
initTextInput();
```

---

## Testing

1. Start your Electron app
2. Press **T** or click the **Chat** button to show the text input
3. Type a message
4. Press **Enter** or click the send button
5. Check the console - you should see the message being sent
6. Press **T** again to hide the text input

### Backend Message Format (per SERVER_SPEC.md)

Your WebSocket server will receive:

```json
{
    "type": "message",
    "data": {
        "content": "Hello, companion!"
    }
}
```

---

## Message Flow

```
┌────────────────────────────────────────────────┐
│              Text Message Flow                  │
├────────────────────────────────────────────────┤
│                                                 │
│  User types message                             │
│       │                                         │
│       ▼                                         │
│  Presses Enter (or clicks Send)                │
│       │                                         │
│       ▼                                         │
│  sendTextMessage(text)                          │
│       │                                         │
│       ▼                                         │
│  sendWebSocketMessage('message', { data })     │
│       │                                         │
│       ▼                                         │
│  WebSocket.send(JSON.stringify(...))           │
│       │                                         │
│       ▼                                         │
│  Backend receives message                       │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## Enhancement Ideas

### Add a Loading State
Show that the message is being processed:

```javascript
function sendTextMessage(text) {
    const input = document.getElementById('text-input');
    input.disabled = true;
    input.placeholder = 'Sending...';
    
    sendWebSocketMessage('message', { data: { content: text.trim() } });
    
    // Re-enable after a short delay
    setTimeout(() => {
        input.disabled = false;
        input.placeholder = 'Type a message...';
        input.focus();
    }, 500);
}
```

### Show Message History
Add a chat history display:

```html
<div id="chat-history"></div>
```

```javascript
function addToHistory(sender, message) {
    const history = document.getElementById('chat-history');
    const entry = document.createElement('div');
    entry.className = `chat-entry ${sender}`;
    entry.textContent = message;
    history.appendChild(entry);
    history.scrollTop = history.scrollHeight;
}

// Call when sending
addToHistory('user', text);

// Call when receiving response
addToHistory('ai', responseText);
```

---

## Keyboard Shortcut Reference

| Key | Action |
|-----|--------|
| `T` | Toggle text input visibility |
| `Enter` | Send message |
| `Right Shift` | Push to talk (works anytime!) |

> **Note:** Right Shift for PTT works even when you're typing in the text input!

---

## Next Step

Continue to [Feature 6: Backend State Messages](./06-backend-state.md)

