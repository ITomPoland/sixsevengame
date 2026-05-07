import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export default function CameraDetector({ onPoseUpdate, preloadedStream, preloadedLandmarker }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const poseLandmarkerRef = useRef(null);
  const requestRef = useRef(null);
  // Smoothed positions for stable circle rendering (EMA)
  const smoothLeftRef = useRef({ x: 0.5, y: 0.5 });
  const smoothRightRef = useRef({ x: 0.5, y: 0.5 });
  const SMOOTH = 0.4; // 0=frozen, 1=no smoothing

  useEffect(() => {
    let active = true;

    // If preloaded resources are available, use them directly (skips heavy init)
    if (preloadedStream && preloadedLandmarker) {
      poseLandmarkerRef.current = preloadedLandmarker;
      if (videoRef.current) {
        videoRef.current.srcObject = preloadedStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsLoaded(true);
          predictWebcam();
        };
      }

      return () => {
        active = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        // Don't close landmarker or stop stream here — they're managed by Preloader/App
      };
    }

    // Fallback: self-initialize (backwards compatible)
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
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
        
        if (!active) return;
        poseLandmarkerRef.current = landmarker;
        
        startCamera();
      } catch (e) {
        console.error("Blad ladowania MediaPipe", e);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            frameRate: { ideal: 60, min: 30 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsLoaded(true);
            predictWebcam();
          };
        }
      } catch (err) {
        console.error("Blad kamery:", err);
      }
    };

    initMediaPipe();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [preloadedStream, preloadedLandmarker]);

  const predictWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const poseLandmarker = poseLandmarkerRef.current;

    if (!video || !canvas || !poseLandmarker) return;

    let startTimeMs = performance.now();
    let results = null;

    if (video.currentTime > 0) {
      results = poseLandmarker.detectForVideo(video, startTimeMs);
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let leftWrist = null;
    let rightWrist = null;

    if (results && results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      
      leftWrist = landmarks[15]; // lewy nadgarstek
      rightWrist = landmarks[16]; // prawy nadgarstek

      // Smoothed wrist drawing — EMA for stability
      if (leftWrist && leftWrist.visibility > 0.4) {
        smoothLeftRef.current.x += (leftWrist.x - smoothLeftRef.current.x) * SMOOTH;
        smoothLeftRef.current.y += (leftWrist.y - smoothLeftRef.current.y) * SMOOTH;
        const sx = smoothLeftRef.current.x * canvas.width;
        const sy = smoothLeftRef.current.y * canvas.height;
        // Neon ring with glow
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, 2 * Math.PI);
        ctx.stroke();
        // Inner dot
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      if (rightWrist && rightWrist.visibility > 0.4) {
        smoothRightRef.current.x += (rightWrist.x - smoothRightRef.current.x) * SMOOTH;
        smoothRightRef.current.y += (rightWrist.y - smoothRightRef.current.y) * SMOOTH;
        const sx = smoothRightRef.current.x * canvas.width;
        const sy = smoothRightRef.current.y * canvas.height;
        // Neon ring with glow
        ctx.strokeStyle = '#0055ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#0055ff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, 2 * Math.PI);
        ctx.stroke();
        // Inner dot
        ctx.fillStyle = '#0055ff';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Animated dashed connection line between wrists
      if (leftWrist && rightWrist && leftWrist.visibility > 0.4 && rightWrist.visibility > 0.4) {
        const lx = smoothLeftRef.current.x * canvas.width;
        const ly = smoothLeftRef.current.y * canvas.height;
        const rx = smoothRightRef.current.x * canvas.width;
        const ry = smoothRightRef.current.y * canvas.height;
        ctx.strokeStyle = 'rgba(17, 17, 17, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -(performance.now() / 40); // animated dash
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(rx, ry);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Przekaż nadgarstki do App.jsx (jeżeli zgubiono z powodu widoczności, zostanie przesłane null)
    // Zostawiamy weryfikację widoczności do nadrzędnego komponentu
    onPoseUpdate(
       leftWrist && leftWrist.visibility > 0.4 ? leftWrist : null, 
       rightWrist && rightWrist.visibility > 0.4 ? rightWrist : null
    );

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="camera-container">
      {!isLoaded && <div className="loading-overlay">Ładowanie AI i kamery... Upewnij się, że masz połączenie z internetem.</div>}
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="camera-canvas"
        width={640}
        height={480}
      />
    </div>
  );
}
