import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const PHASES = [
  { key: 'init', label: 'INICJALIZACJA', percent: 10 },
  { key: 'wasm', label: 'ŁADOWANIE SILNIKA AI', percent: 35 },
  { key: 'model', label: 'POBIERANIE MODELU AI', percent: 60 },
  { key: 'camera_ask', label: 'DOSTĘP DO KAMERY', percent: 75 },
  { key: 'camera_init', label: 'URUCHAMIANIE KAMERY', percent: 90 },
  { key: 'done', label: 'GOTOWE!', percent: 100 },
];

export default function Preloader({ onReady, onProgress, onExitStart }) {
  const [phase, setPhase] = useState('init');
  const [progress, setProgress] = useState(0);
  const [cameraState, setCameraState] = useState('pending'); // pending | prompting | denied | granted
  const [isExiting, setIsExiting] = useState(false);
  const [statusText, setStatusText] = useState('INICJALIZACJA...');
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const hasStarted = useRef(false);

  // Smooth progress animation
  const targetProgress = PHASES.find(p => p.key === phase)?.percent || 0;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.5) return targetProgress;
        return prev + diff * 0.08;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [targetProgress]);

  // Sync progress to parent for the global hero ring
  useEffect(() => {
    if (onProgress) onProgress(progress);
  }, [progress, onProgress]);

  // Update status text
  useEffect(() => {
    const phaseData = PHASES.find(p => p.key === phase);
    if (phaseData) {
      setStatusText(phaseData.label + '...');
    }
  }, [phase]);

  const startLoading = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    try {
      // Phase 1: WASM Runtime
      setPhase('wasm');
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      // Phase 2: AI Model
      setPhase('model');
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.3,
        minPosePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3
      });
      landmarkerRef.current = landmarker;

      // Phase 3: Camera Permission
      setPhase('camera_ask');
      
      // Check if permission already granted
      let permissionGranted = false;
      try {
        const permStatus = await navigator.permissions.query({ name: 'camera' });
        if (permStatus.state === 'granted') {
          permissionGranted = true;
          setCameraState('granted');
        } else if (permStatus.state === 'denied') {
          setCameraState('denied');
          return; // Stop here, user needs to fix in browser settings
        }
      } catch {
        // permissions API not supported, we'll try getUserMedia directly
      }

      if (!permissionGranted) {
        setCameraState('prompting');
        // Wait for user to click the "enable camera" button
        // The button click will call requestCamera()
        return;
      }

      // Permission already granted, proceed
      await initCamera();
    } catch (e) {
      console.error("Preloader error:", e);
      setStatusText('BŁĄD ŁADOWANIA — ODŚWIEŻ STRONĘ');
    }
  }, []);

  const requestCamera = async () => {
    setCameraState('pending');
    setPhase('camera_init');
    setStatusText('URUCHAMIANIE KAMERY...');
    try {
      await initCamera();
    } catch (e) {
      console.error("Camera request failed:", e);
      setCameraState('denied');
      setPhase('camera_ask');
    }
  };

  const initCamera = async () => {
    setPhase('camera_init');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: { ideal: 60, min: 30 }
        }
      });
      streamRef.current = stream;
      setCameraState('granted');

      // Phase 4: Done!
      setPhase('done');
      setStatusText('GOTOWE!');

      // Wait a beat for the "GOTOWE!" to register, then exit
      setTimeout(() => {
        setIsExiting(true);
        if (onExitStart) onExitStart();
        
        // After exit animation, call onReady
        setTimeout(() => {
          onReady(stream, landmarkerRef.current);
        }, 900);
      }, 600);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraState('denied');
      setPhase('camera_ask');
    }
  };

  // Start loading on mount
  useEffect(() => {
    // Small delay so initial render is smooth
    const t = setTimeout(() => startLoading(), 300);
    return () => clearTimeout(t);
  }, [startLoading]);

  // Circular progress ring math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const showCameraPrompt = cameraState === 'prompting';
  const showCameraDenied = cameraState === 'denied';

  return (
    <div className={`preloader ${isExiting ? 'preloader--exiting' : ''}`}>
      <div className="preloader__content">
        {/* Spacer to replace the physical space of the global 67 hero */}
        <div style={{ height: '220px', width: '100%', flexShrink: 0 }} className="preloader__hero-spacer" />

        {/* Status text */}
        <div className="preloader__status-wrap">
          <span className="preloader__status" key={statusText}>
            {statusText}
          </span>
        </div>

        {/* Progress bar (linear) */}
        <div className="preloader__bar-track">
          <div 
            className="preloader__bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Camera Permission Prompt */}
        {showCameraPrompt && createPortal(
          <div className="camera-modal-overlay">
            <div className="preloader__camera-card" key="camera-prompt">
              <div className="preloader__camera-icon">📸</div>
              <h3 className="preloader__camera-title">POTRZEBUJEMY KAMERY!</h3>
              <p className="preloader__camera-desc">
                Gra 67 używa kamery do wykrywania ruchów rąk.
                <br />Twoje nagranie nie jest nigdzie wysyłane.
              </p>
              <button className="btn-primary preloader__camera-btn" onClick={requestCamera}>
                WŁĄCZ KAMERĘ
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Camera Denied State */}
        {showCameraDenied && createPortal(
          <div className="camera-modal-overlay">
            <div className="preloader__camera-card preloader__camera-card--denied" key="camera-denied">
              <div className="preloader__camera-icon">🚫</div>
              <h3 className="preloader__camera-title">BRAK DOSTĘPU DO KAMERY</h3>
              <p className="preloader__camera-desc">
                Kamera jest wymagana do gry. Aby włączyć dostęp:
              </p>
              <div className="preloader__camera-steps">
                <div className="preloader__step">
                  <span className="preloader__step-num">1</span>
                  Kliknij ikonę 🔒 w pasku adresu
                </div>
                <div className="preloader__step">
                  <span className="preloader__step-num">2</span>
                  Znajdź "Kamera" i zmień na "Zezwalaj"
                </div>
                <div className="preloader__step">
                  <span className="preloader__step-num">3</span>
                  Odśwież stronę
                </div>
              </div>
              <button className="btn-primary preloader__camera-btn" onClick={requestCamera}>
                SPRÓBUJ PONOWNIE
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Bottom decorative label */}
        <div className="preloader__footer-label">
          <span className="preloader__made-by">MADE BY ITOM • FESTIWAL NAUKI UO 2025</span>
        </div>
      </div>
    </div>
  );
}
