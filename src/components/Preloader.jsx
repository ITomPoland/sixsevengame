import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const PHASES = [
  { key: 'init', label: 'INICJALIZACJA', percent: 10 },
  { key: 'wasm', label: 'SILNIK AI', percent: 35 },
  { key: 'model', label: 'MODEL AI', percent: 60 },
  { key: 'camera_ask', label: 'DOSTĘP DO KAMERY', percent: 75 },
  { key: 'camera_init', label: 'KAMERA', percent: 90 },
  { key: 'done', label: 'GOTOWE', percent: 100 },
];

// Get 3 zero-padded digits from a number (e.g., 87 → ['0','8','7'])
const getDigits = (n) => {
  const s = String(Math.min(Math.round(n), 100)).padStart(3, '0');
  return [s[0], s[1], s[2]];
};

export default function Preloader({ onReady, onProgress, onExitStart }) {
  const [phase, setPhase] = useState('init');
  const [progress, setProgress] = useState(0);
  const [cameraState, setCameraState] = useState('pending');
  const [isExiting, setIsExiting] = useState(false);
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

  // Sync progress to parent
  useEffect(() => {
    if (onProgress) onProgress(progress);
  }, [progress, onProgress]);



  const startLoading = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    try {
      setPhase('wasm');
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

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

      setPhase('camera_ask');
      
      let permissionGranted = false;
      try {
        const permStatus = await navigator.permissions.query({ name: 'camera' });
        if (permStatus.state === 'granted') {
          permissionGranted = true;
          setCameraState('granted');
        } else if (permStatus.state === 'denied') {
          setCameraState('denied');
          return;
        }
      } catch {
        // permissions API not supported
      }

      if (!permissionGranted) {
        setCameraState('prompting');
        return;
      }

      await initCamera();
    } catch (e) {
      console.error("Preloader error:", e);
    }
  }, []);

  const requestCamera = async () => {
    setCameraState('pending');
    setPhase('camera_init');
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

      setPhase('done');
      // Force progress to 100 instantly (skip interpolation)
      setProgress(100);

      // Wait for user to see the counter hit 100, then exit
      setTimeout(() => {
        setIsExiting(true);
        if (onExitStart) onExitStart();
        
        setTimeout(() => {
          onReady(stream, landmarkerRef.current);
        }, 900);
      }, 1500);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraState('denied');
      setPhase('camera_ask');
    }
  };

  useEffect(() => {
    const t = setTimeout(() => startLoading(), 300);
    return () => clearTimeout(t);
  }, [startLoading]);

  const digits = getDigits(progress);
  const isDone = phase === 'done';
  const showCameraPrompt = cameraState === 'prompting';
  const showCameraDenied = cameraState === 'denied';


  return (
    <div className={`preloader ${isExiting ? 'preloader--exiting' : ''}`}>
      <div className="preloader__content">
        {/* Spacer for the global 67 hero */}
        <div className="preloader__hero-spacer" />

        {/* HORIZON LINES */}
        <div className="horizon-lines">
          <div className="horizon-line horizon-line--left" style={{ width: `${progress / 2}%` }} />
          <div className="horizon-line horizon-line--right" style={{ width: `${progress / 2}%` }} />
        </div>
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
    </div>
  );
}
