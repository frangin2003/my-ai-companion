# 🎭 Kawaii 3D Avatar Workshop

## Overview

Build your own kawaii superdeformed 3D character using Three.js, running as a desktop companion in Electron! This workshop guides you through creating a customizable animated avatar that floats on your desktop.

---

## 🚀 Quick Start Prompt

Copy this prompt to your AI coding assistant to begin:

```
I want to create a kawaii superdeformed 3D character avatar using Three.js served in an Electron desktop app.

Please follow the detailed instructions in the workshop/AVATAR_INSTRUCTIONS.md file.

For the character design, I want:
- Head: [DESCRIBE YOUR HEAD SHAPE - e.g., "large round sphere, slightly squashed vertically"]
- Body: [DESCRIBE YOUR BODY - e.g., "bean-shaped blue body"]
- Arms: [DESCRIBE YOUR ARMS - e.g., "short stubby blue arms with round hands"]
- Legs: [DESCRIBE YOUR LEGS - e.g., "short stubby blue legs"]
- Head Ornament: [DESCRIBE ORNAMENT - e.g., "4-pointed star floating above head" or "halo" or "small crown" or "antenna"]
- Head Accessories: [DESCRIBE - e.g., "curved horns" or "cat ears" or "bunny ears" or "none"]
- Body Accessory: [DESCRIBE - e.g., "red cape with physics" or "bow on back" or "wings" or "scarf" or "none"]
- Color Scheme: [DESCRIBE COLORS - e.g., "cream head, blue body, red cape"]

The face texture is already available at companion/face.png (8x4 sprite sheet).

Start with Phase 1: Basic Setup.
```

---

## 📁 Project Structure

```
companion/
├── index.html          # Main HTML with UI controls
├── style.css           # Styling for UI panel
├── main.js             # Three.js character & animations
├── face.png            # Face sprite sheet (8x4 grid) [PROVIDED]
├── package.json        # Electron dependencies
├── electron-main.js    # Electron main process
└── preload.js          # Electron IPC bridge
```

---

## 🎨 Customization Ideas

### Head Ornaments (floating above head)
- ⭐ 4-pointed star (intersecting octahedrons)
- 😇 Halo (torus geometry)
- 👑 Crown (cylinder + small boxes)
- 📡 Antenna (thin cylinder + sphere)
- 💎 Gem (octahedron)
- 🌙 Moon (partial torus)

### Head Accessories (attached to head)
- 😈 Curved horns
- 🐱 Cat ears (cones)
- 🐰 Bunny ears (elongated capsules)
- 🎀 Hair bow
- 🎧 Headphones (torus + boxes)
- 🧢 Hat (cylinder + wider cylinder)

### Body Accessories
- 🦸 Cape with physics
- 🎀 Back bow (scaled spheres)
- 🪽 Wings (flat planes or 3D shapes)
- 🧣 Scarf (cylinder segments)
- 🎒 Backpack (box)
- 🌸 Floating petals

### Body Shapes
- Bean/pill shape (stretched sphere)
- Round (sphere)
- Dress shape (cone + sphere)
- Robot (box)

### Color Palettes
- **Classic**: Cream head, blue body, red accessory
- **Pastel**: Pink head, lavender body, mint accessory
- **Monochrome**: White/grey gradient
- **Nature**: Green body, brown accessories
- **Fire**: Orange/red gradient body, yellow accents
- **Ice**: Light blue body, white accessories
- **Galaxy**: Purple body, star patterns

---

## 🎬 Available Animations

| Animation | Description |
|-----------|-------------|
| `idle` | Gentle breathing/bobbing motion |
| `wave` | Waves one arm with head tilt |
| `dance` | Rhythmic body movement |
| `yata` | Victory pose (Japanese "yay!") |
| `sleep` | Droopy, sleepy pose |
| `walk` | Walking in place |
| `run` | Running in place |
| `float` | Levitating motion |
| `roll` | Full body rotation |

---

## 🖼️ Face Sprite Sheet Format

The provided `face.png` is an **8 columns × 4 rows** sprite sheet.

### Expression Map (customize as needed)
```
Row 0: neutral, happy, wink, sleepy, surprised, angry, confused, excited
Row 1: sad, thinking, love, dizzy, scared, annoyed, smug, laughing  
Row 2: talking frames (mouth open variations)
Row 3: blink frames and special expressions
```

### How Expressions Work
- Each cell is one expression
- UV coordinates select which cell to display
- Blinking: cycles through blink frames automatically
- Talking: cycles through mouth-open frames when active

---

## ⌨️ Controls

| Key/Action | Function |
|------------|----------|
| `F1` | Toggle UI panel visibility |
| `Escape` | Close the app |
| Click + Drag | Move avatar on desktop |
| Mouse wheel | Zoom (when UI visible) |
| Right-click drag | Rotate camera (when UI visible) |

---

## 🔧 Technical Notes

### Hierarchical Structure
```
characterGroup
├── bodyGroup
│   ├── body mesh
│   ├── cape/accessory (if any)
│   ├── leftArmJoint (Group)
│   │   └── leftArm mesh
│   ├── rightArmJoint (Group)
│   │   └── rightArm mesh
│   ├── leftLegJoint (Group)
│   │   └── leftLeg mesh
│   └── rightLegJoint (Group)
│       └── rightLeg mesh
├── neckJoint (Group)
│   └── headGroup
│       ├── head mesh
│       ├── faceMesh (spherical cap with texture)
│       └── horns/ears (if any)
└── magicOrnament
```

### Animation System
- Animations rotate the **Joint Groups**, not the meshes
- This ensures proper pivot points
- `defaultPose` stores rest positions for resetting

### Cape Physics (if used)
- Verlet integration for cloth simulation
- Particle grid with distance constraints
- Collision spheres prevent clipping through body
- Top row of particles fixed to attachment point

### Electron Features
- Frameless transparent window
- Always on top
- Window resizes: compact (character only) ↔ expanded (with UI)
- IPC for drag functionality

---

## 📝 Phase Checklist

- [ ] Phase 1: Basic Three.js setup with primitives
- [ ] Phase 2: Character hierarchy and joints
- [ ] Phase 3: Kawaii styling (shapes, colors)
- [ ] Phase 4: Face texture system
- [ ] Phase 5: Debug mode
- [ ] Phase 6: Animations
- [ ] Phase 7: Accessories (cape/bow/wings)
- [ ] Phase 8: UI controls
- [ ] Phase 9: Electron integration
- [ ] Phase 10: Polish and personalization

---

## 🎯 Tips for Success

1. **Start simple**: Get basic shapes working before adding complexity
2. **Use debug mode**: Keep joints visible while positioning parts
3. **Test often**: Check each change before moving on
4. **Iterate**: Don't try to perfect everything at once
5. **Have fun**: Make the avatar YOUR character!

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Parts inside body | Adjust position offsets on joints |
| Face on wrong side | Check `faceMesh.rotation.y` and `characterGroup.rotation.y` |
| Arms/legs disappear | Ensure meshes are children of joint groups, not replaced by them |
| Cape goes through body | Add collision spheres, adjust attachment point |
| Window not transparent | Set `transparent: true` in BrowserWindow and `alpha: true` in WebGLRenderer |
| Can't drag window | Disable OrbitControls when UI is hidden |

---

Happy creating! 🎨✨

