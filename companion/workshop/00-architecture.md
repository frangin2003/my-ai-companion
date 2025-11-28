# Module Architecture Overview

## Introduction

The AI Companion Avatar is built with a **modular architecture** that separates concerns into individual files. This makes the code easier to understand, maintain, and extend.

## File Structure

```
companion/
├── main.js                    # Entry point - ties everything together
├── modules/
│   ├── websocket.js          # WebSocket connection & reconnection
│   ├── audio.js              # Audio playback & recording (PTT)
│   ├── waveform.js           # Waveform visualization
│   ├── textInput.js          # Text input handling
│   ├── scene.js              # Three.js scene, camera, renderer
│   ├── character.js          # 3D character construction
│   ├── face.js               # Face expressions & animations
│   ├── cape.js               # Cape cloth physics
│   ├── animations.js         # Body animation system
│   ├── stateHandler.js       # Backend state message handling
│   └── ui.js                 # UI controls & panel
├── index.html                 # HTML structure
├── style.css                  # Styles
└── face.png                   # Face sprite sheet
```

## Module Responsibilities

### `main.js` - Entry Point
The main file that imports and initializes all modules:
- Initializes the scene and character
- Sets up callbacks between modules
- Handles keyboard shortcuts
- Runs the animation loop

### `modules/websocket.js` - Network Connection
Handles communication with the backend:
- WebSocket connection/disconnection
- Automatic reconnection
- Message sending

```javascript
// Key exports
connectWebSocket()           // Start connection
sendMessage(type, data)      // Send a message
setMessageCallback(fn)       // Handle incoming messages
setConnectionStatusCallback(fn)  // Handle status changes
```

### `modules/audio.js` - Audio System
Handles both playback and recording:
- Audio context management
- Base64 audio decoding & playback
- Microphone recording (PTT)
- Audio queue management

```javascript
// Key exports
playBase64Audio(base64)      // Play audio from backend
startRecording()             // Start PTT recording
stopRecording()              // Stop PTT recording
setTalkingCallbacks(onStart, onStop)  // Avatar animation callbacks
```

### `modules/waveform.js` - Visualization
Real-time audio visualization during recording:
- Canvas-based frequency bars
- Show/hide with CSS transitions

```javascript
// Key exports
showWaveform()               // Show the waveform container
hideWaveform()               // Hide the waveform container
startWaveformAnimation()     // Start drawing
stopWaveformAnimation()      // Stop drawing
```

### `modules/textInput.js` - Text Messages
Handles text input UI:
- Send on Enter key
- Toggle visibility
- Send via WebSocket

```javascript
// Key exports
sendTextMessage(text)        // Send text to backend
toggleTextInput()            // Show/hide input
initTextInput()              // Set up event listeners
```

### `modules/scene.js` - 3D Scene
Three.js setup and management:
- Scene, camera, renderer creation
- Lighting
- Materials (shared across modules)
- Window dragging for Electron

```javascript
// Key exports
initScene()                  // Initialize Three.js
render()                     // Render one frame
scene, camera, renderer      // Three.js objects
whiteMaterial, blueMaterial  // Shared materials
```

### `modules/character.js` - Avatar Model
Builds the 3D character:
- Body, head, limbs
- Horns, ornament (connection indicator)
- Joint system for animation

```javascript
// Key exports
buildCharacter()             // Create the 3D model
updateConnectionStatus(status)  // Change star color
updateOrnament(time)         // Animate the star
characterGroup, bodyGroup    // Three.js groups
leftArmJoint, rightArmJoint  // Animation targets
```

### `modules/face.js` - Expressions
Face texture and expression system:
- Sprite sheet management
- Expression switching
- Blink animation
- Talking animation

```javascript
// Key exports
setExpression(name)          // Change face expression
startTalking() / stopTalking()  // Mouth animation
updateBlink(deltaTime)       // Auto-blink
updateTalking(deltaTime)     // Mouth movement
faceExpressions              // Available expressions map
```

### `modules/cape.js` - Cloth Physics
Verlet integration cloth simulation:
- Particle system
- Constraint satisfaction
- Collision detection
- Wind effects

```javascript
// Key exports
buildCape()                  // Create cape mesh
updateCapePhysics(deltaTime) // Simulate physics
```

### `modules/animations.js` - Body Animations
Animation system for the character body:
- Idle, dance, walk, run, etc.
- One-shot animations (wave, yata)
- Pose management

```javascript
// Key exports
playAnimation(name)          // Play an animation
updateAnimation(deltaTime)   // Update current animation
storeDefaultPose()           // Save rest pose
```

### `modules/stateHandler.js` - Backend States
Processes messages from the backend:
- Maps states to animations/expressions
- Handles audio messages
- Coordinates avatar response

```javascript
// Key exports
handleWebSocketMessage(data) // Process incoming message
```

### `modules/ui.js` - User Interface
UI controls and debug mode:
- Expression radio buttons
- Animation buttons
- Debug toggle
- Panel visibility

```javascript
// Key exports
initUIControls()             // Set up UI listeners
initUIPanel()                // Set up F1 panel toggle
```

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Backend   │────▶│  websocket   │────▶│ stateHandler  │
│   Server    │◀────│    .js       │     │     .js       │
└─────────────┘     └──────────────┘     └───────────────┘
                                                │
                           ┌────────────────────┼────────────────────┐
                           ▼                    ▼                    ▼
                    ┌────────────┐      ┌────────────┐      ┌────────────┐
                    │  face.js   │      │ animations │      │  audio.js  │
                    │expressions │      │    .js     │      │  playback  │
                    └────────────┘      └────────────┘      └────────────┘
```

## Adding New Features

To add a new feature:

1. **Create a new module** in `modules/` folder
2. **Export functions** that other modules might need
3. **Import in main.js** and initialize
4. **Connect callbacks** if it needs to communicate with other modules

Example: Adding a particle effect system

```javascript
// modules/particles.js
export function createParticles() { ... }
export function updateParticles(deltaTime) { ... }

// main.js
import { createParticles, updateParticles } from './modules/particles.js';

// In initialization
createParticles();

// In animation loop
updateParticles(deltaTime);
```

## Best Practices

1. **Keep modules focused** - Each module should do one thing well
2. **Use callbacks** - Let main.js wire modules together
3. **Export what's needed** - Only export functions other modules need
4. **Avoid circular imports** - Use callbacks instead

## Workshop Features by Module

| Feature | Primary Module | Supporting Modules |
|---------|---------------|-------------------|
| 1. WebSocket | `websocket.js` | `character.js` (status) |
| 2. Push to Talk | `audio.js` | `waveform.js` |
| 3. Waveform | `waveform.js` | `audio.js` |
| 4. Audio Playback | `audio.js` | `face.js` (talking) |
| 5. Text Input | `textInput.js` | `websocket.js` |
| 6. State Handling | `stateHandler.js` | `face.js`, `animations.js` |

