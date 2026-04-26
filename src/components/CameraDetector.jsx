import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export default function CameraDetector({ onPoseUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const poseLandmarkerRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    let active = true;

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
  }, []);

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

      // Rysowanie nadgarstkow
      ctx.fillStyle = "#ff0055"; // Lewy na czerwono
      if (leftWrist && leftWrist.visibility > 0.4) {
        ctx.beginPath();
        ctx.arc(leftWrist.x * canvas.width, leftWrist.y * canvas.height, 15, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      ctx.fillStyle = "#0055ff"; // Prawy na niebiesko
      if (rightWrist && rightWrist.visibility > 0.4) {
        ctx.beginPath();
        ctx.arc(rightWrist.x * canvas.width, rightWrist.y * canvas.height, 15, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Rysowanie polaczenia miedzy nadgarstkami
      if (leftWrist && rightWrist && leftWrist.visibility > 0.4 && rightWrist.visibility > 0.4) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(leftWrist.x * canvas.width, leftWrist.y * canvas.height);
        ctx.lineTo(rightWrist.x * canvas.width, rightWrist.y * canvas.height);
        ctx.stroke();
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
