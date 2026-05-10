# 67 Game ⚡

> **A kinetic brutalist speed game** built for Festiwal Nauki UO 2026.  
> Players use real-time hand tracking to compete for the fastest alternating arm swings in 15 seconds.

## 🎮 How It Works

1. **Camera Access** — MediaPipe Pose Landmarker detects wrist positions via webcam
2. **Calibration** — 5 practice gestures to verify tracking
3. **Gameplay** — 15 seconds of alternating left-high / right-high arm swings
4. **Leaderboard** — Scores saved to Firebase Realtime Database in real-time
5. **Certificate** — Auto-generated brutalist certificate with QR code sharing

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8 |
| **Pose Detection** | MediaPipe Tasks Vision (PoseLandmarker) |
| **Database** | Firebase Realtime Database |
| **Photo Upload** | ImgBB API |
| **PDF Generation** | jsPDF + Canvas API |
| **QR Codes** | qrcode.react |
| **Testing** | Vitest + Testing Library |

## 📁 Project Structure

```
src/
├── hooks/                          # Custom React hooks
│   ├── useLeaderboard.js           # Firebase live subscription
│   ├── useScrollLock.js            # Scroll lock during transitions
│   └── useOdometerLayout.js        # FLIP-lite positioning system
├── components/                     # React components
│   ├── CameraDetector.jsx          # MediaPipe pose tracking + canvas overlay
│   ├── Preloader.jsx               # Loading screen with camera init
│   ├── Certificate.jsx             # Canvas-rendered brutalist certificate
│   ├── AdminPanel.jsx              # Firebase auth + leaderboard management
│   ├── ProgressBar.jsx             # Rank progress with thresholds
│   ├── CircularTimer.jsx           # SVG countdown ring
│   ├── ParticleCanvas.jsx          # Score burst particle effects
│   ├── Flames.jsx                  # Fire mode particle system
│   ├── FloatingScores.jsx          # Animated +N score popups
│   ├── ShockwaveRing.jsx           # Expanding ring on score milestones
│   ├── ComboCounter.jsx            # Combo streak display
│   ├── NameInput.jsx               # Arcade-style character input
│   ├── Leaderboard.jsx             # Top 5 scoreboard
│   ├── CreatorBadge.jsx            # Author attribution with QR
│   └── NoiseOverlay.jsx            # Film grain SVG filter
├── styles/                         # Modular CSS
│   ├── base.css                    # Variables, reset, typography
│   ├── header.css                  # Marquee, hero 67, layout
│   ├── game.css                    # HUD, cards, camera effects
│   ├── components.css              # Camera, certificate, admin, result
│   ├── preloader.css               # Loading screen, odometer, horizon
│   └── responsive.css              # Media queries
├── test/                           # Unit tests
│   ├── gameLogic.test.js           # Gesture detection tests
│   └── progressBar.test.js         # Rank system tests
├── App.jsx                         # Main orchestrator (~800 lines)
├── gameLogic.js                    # Gesture detection algorithm
├── firebase.js                     # Firebase config & exports
└── index.css                       # CSS import hub
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file with:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
```

## 🎨 Design Philosophy

**Mechanics-first brutalism** — The project prioritizes core logic, layout, and performance before aesthetic layers. Key design decisions:

- **GPU-accelerated transitions** — All animations use `transform` and `will-change` instead of layout-triggering properties
- **Anti-epilepsy throttling** — Visual effects are rate-limited to prevent rapid flashing
- **FLIP-lite positioning** — Odometer slots use measured coordinates for pixel-perfect flight animations
- **Semantic z-index system** — CSS variables (`--z-header`, `--z-modal`, etc.) replace magic numbers

## ⚡ Performance

- **60fps pose detection** via MediaPipe WASM + GPU delegate
- **Swap-and-pop particle removal** — O(1) instead of Array.splice O(n)
- **Canvas particle systems** avoid DOM overhead for flames and score bursts
- **EMA smoothing** on wrist tracking for stable visual feedback
- **Deferred rendering** for noise overlay to avoid blocking initial paint

## 📝 Testing

```bash
npm test          # Run all tests once
npm run test:watch  # Watch mode
```

Tests cover:
- **Gesture detection** — null handling, threshold boundaries, directional detection
- **Rank system** — threshold accuracy, boundary values, max rank handling

## 👤 Author

**ITom** — [itomdev.com](https://itomdev.com)

Built for Festiwal Nauki Uniwersytetu Opolskiego 2026.
