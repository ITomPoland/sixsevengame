import React, { useState, useEffect, useRef } from 'react';
import CameraDetector from './components/CameraDetector';
import Leaderboard from './components/Leaderboard';
import NameInput from './components/NameInput';
import Flames from './components/Flames';
import ParticleCanvas from './components/ParticleCanvas';
import FloatingScores from './components/FloatingScores';
import ComboCounter from './components/ComboCounter';
import ShockwaveRing from './components/ShockwaveRing';
import Certificate from './components/Certificate';
import ProgressBar, { getRank } from './components/ProgressBar';
import { check67Gesture } from './gameLogic';
import './index.css';

function App() {
  const [screen, setScreen] = useState('START');
  const [score, setScore] = useState(0);
  const [calibrationCount, setCalibrationCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [countdownTime, setCountdownTime] = useState(3);
  const [showStartText, setShowStartText] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [combo, setCombo] = useState(0);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const MAX_LEADERBOARD_ENTRIES = 5;
  const photoCapturedRef = useRef(false);
  const calibrationRef = useRef(0);
  
  // Refs to avoid re-renders on every frame
  const lastGestureRef = useRef('neutral');
  const scoreRef = useRef(0);
  const screenRef = useRef('START');
  
  // Cache for wrists to handle frame drops during fast motion
  const lastLeftWristRef = useRef(null);
  const lastRightWristRef = useRef(null);
  
  // Ref to camera container for imperative animation (bump)
  const cameraWrapperRef = useRef(null);

  // Effect system refs — anti-epilepsy throttling
  const particleRef = useRef(null);
  const floatingScoresRef = useRef(null);
  const shockwaveRef = useRef(null);
  const lastEffectTimeRef = useRef(0);
  const pendingScoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastScoreTimeRef = useRef(0);
  const comboTimeoutRef = useRef(null);

  // Load leaderboard on mount and check URL for QR certificate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('cert') && params.has('score')) {
      const paramName = params.get('cert');
      const paramScore = parseInt(params.get('score'), 10) || 0;
      setPlayerName(paramName);
      setScore(paramScore);
      setShowCertificate(true);
      // Clean up the URL so if they refresh or play, it doesn't keep showing the cert
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const saved = localStorage.getItem('sixseven_leaderboard');
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse leaderboard", e);
      }
    }
  }, []);

  // Sync refs with state
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // 1. Obsługa samego tykania zegara
  useEffect(() => {
    let timer;
    if (screen === 'COUNTDOWN' && countdownTime > 0) {
      timer = setInterval(() => setCountdownTime(prev => prev - 1), 1000);
    } else if (screen === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [screen, countdownTime > 0, timeLeft > 0]);

  // 2. Przejście po zakończeniu COUNTDOWN
  useEffect(() => {
    if (screen === 'COUNTDOWN' && countdownTime === 0) {
      // Reset ALL refs directly — useEffect sync is async and too late
      setScore(0);
      scoreRef.current = 0;
      setTimeLeft(15);
      setCombo(0);
      comboRef.current = 0;
      pendingScoreRef.current = 0;
      lastEffectTimeRef.current = 0;
      lastScoreTimeRef.current = 0;
      lastGestureRef.current = 'neutral';
      // Reset photo for new game
      setPhotoDataUrl(null);
      photoCapturedRef.current = false;
      setScreen('PLAYING');
      setShowStartText(true);
      setTimeout(() => setShowStartText(false), 1000);
    }
  }, [countdownTime, screen]);

  // 3. Capture photo during gameplay (at 10s and 5s marks)
  useEffect(() => {
    if (screen === 'PLAYING' && (timeLeft === 10 || timeLeft === 5) && !photoCapturedRef.current) {
      capturePhoto();
    }
  }, [timeLeft, screen]);

  // 4. Przejście po zakończeniu czasu w grze
  useEffect(() => {
    if (screen === 'PLAYING' && timeLeft === 0) {
      // Final photo capture if not done yet
      if (!photoCapturedRef.current) capturePhoto();
      
      // Always go to NAME_INPUT so everyone gets a certificate
      setScreen('NAME_INPUT');
    }
  }, [timeLeft, screen]);

  const capturePhoto = () => {
    try {
      const video = document.querySelector('.camera-video');
      if (!video) return;
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(-1, 1); // mirror to match display
      ctx.drawImage(video, -640, 0, 640, 480);
      ctx.restore();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoDataUrl(dataUrl);
      photoCapturedRef.current = true;
    } catch (e) {
      console.error('Photo capture failed:', e);
    }
  };

  // Flush effects — throttled at max 3x/sec to prevent epilepsy
  const flushEffects = (newScore) => {
    const now = performance.now();
    
    // Accumulate pending score for batched visual
    pendingScoreRef.current += 1;
    
    // Combo system — 1.2s window
    if (now - lastScoreTimeRef.current < 1200) {
      comboRef.current += 1;
    } else {
      comboRef.current = 1;
    }
    lastScoreTimeRef.current = now;
    setCombo(comboRef.current);
    
    // Reset combo after inactivity
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = setTimeout(() => {
      comboRef.current = 0;
      setCombo(0);
    }, 1500);

    // Throttle visual bursts: max every 300ms (~3/sec)
    if (now - lastEffectTimeRef.current < 300) return;
    lastEffectTimeRef.current = now;
    
    const pending = pendingScoreRef.current;
    pendingScoreRef.current = 0;

    // 1. Particle burst — emit at camera center area
    if (particleRef.current) {
      const cx = 0.3 + Math.random() * 0.4; // 30-70% horizontal
      const cy = 0.3 + Math.random() * 0.4; // 30-70% vertical
      const count = Math.min(pending * 6, 25); // Cap particles
      particleRef.current.emit(cx, cy, count);
    }

    // 2. Floating score numbers
    if (floatingScoresRef.current) {
      floatingScoresRef.current.add(pending);
    }

    // 3. Shockwave ring every 5 points
    if (newScore % 5 === 0 && shockwaveRef.current) {
      shockwaveRef.current.trigger();
    }

    // 4. Camera bump every 5 points
    if (newScore % 5 === 0 && cameraWrapperRef.current) {
      cameraWrapperRef.current.classList.remove('camera-bump');
      void cameraWrapperRef.current.offsetWidth;
      cameraWrapperRef.current.classList.add('camera-bump');
    }
  };

  const handlePoseUpdate = (leftWrist, rightWrist) => {
    if (screenRef.current !== 'CALIBRATION' && screenRef.current !== 'PLAYING') return;

    // Cache the positions
    if (leftWrist) lastLeftWristRef.current = leftWrist;
    if (rightWrist) lastRightWristRef.current = rightWrist;

    const currentGesture = check67Gesture(lastLeftWristRef.current, lastRightWristRef.current);
    const lastGesture = lastGestureRef.current;

    // Detect transition from left_high to right_high or vice versa
    if (
      (currentGesture === 'left_high' && lastGesture === 'right_high') ||
      (currentGesture === 'right_high' && lastGesture === 'left_high')
    ) {
      // Gesture detected!
      if (screenRef.current === 'CALIBRATION') {
        const newCal = calibrationRef.current + 1;
        calibrationRef.current = newCal;
        setCalibrationCount(newCal);
        if (newCal >= 5) {
          setCountdownTime(3);
          setScreen('COUNTDOWN');
        }
      } else if (screenRef.current === 'PLAYING') {
        // Increment score
        const newScore = scoreRef.current + 1;
        setScore(newScore);
        
        // Trigger all visual effects (throttled internally)
        flushEffects(newScore);
      }
    }

    if (currentGesture !== 'neutral') {
      lastGestureRef.current = currentGesture;
    }
  };

  const handleNameSubmit = (name) => {
    setPlayerName(name);
    const newEntry = { name, score };
    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LEADERBOARD_ENTRIES);
      
    setLeaderboard(newLeaderboard);
    localStorage.setItem('sixseven_leaderboard', JSON.stringify(newLeaderboard));
    setScreen('RESULT');
  };

  const restartGame = () => {
    // CRITICAL: Block pose processing FIRST
    screenRef.current = 'START';
    
    // Reset all values
    scoreRef.current = 0;
    calibrationRef.current = 0;
    setScore(0);
    setCalibrationCount(0);
    setTimeLeft(15);
    setCombo(0);
    comboRef.current = 0;
    pendingScoreRef.current = 0;
    lastEffectTimeRef.current = 0;
    lastScoreTimeRef.current = 0;
    lastGestureRef.current = 'neutral';
    lastLeftWristRef.current = null;
    lastRightWristRef.current = null;
    setPhotoDataUrl(null);
    setPlayerName('');
    setShowCertificate(false);
    photoCapturedRef.current = false;
    setScreen('CALIBRATION');
  };

  const isFireMode = screen === 'PLAYING' && score >= 45;
  const isWarmGlow = screen === 'PLAYING' && score >= 10 && score < 45;
  const isGameplay = screen === 'CALIBRATION' || screen === 'COUNTDOWN' || screen === 'PLAYING';

  return (
    <div className={`app-container ${isFireMode ? 'fire-mode' : ''} ${isWarmGlow ? 'glow-warm' : ''} ${isGameplay ? 'is-gameplay' : ''}`}>
      <div className="marquee-container">
        <div className="marquee-content">
          <div className="marquee-track">
            <span>/// 67 GAME ///</span>
            <span>FESTIWAL NAUKI UO</span>
            <span>/// ZAGRAJ TERAZ ///</span>
            <span>SPRAWDŹ SWOJĄ SZYBKOŚĆ</span>
            <span>/// 67 GAME ///</span>
            <span>FESTIWAL NAUKI UO</span>
            <span>/// ZAGRAJ TERAZ ///</span>
            <span>SPRAWDŹ SWOJĄ SZYBKOŚĆ</span>
            <span>/// 67 GAME ///</span>
            <span>FESTIWAL NAUKI UO</span>
          </div>
          <div className="marquee-track" aria-hidden="true">
            <span>/// 67 GAME ///</span>
            <span>FESTIWAL NAUKI UO</span>
            <span>/// ZAGRAJ TERAZ ///</span>
            <span>SPRAWDŹ SWOJĄ SZYBKOŚĆ</span>
            <span>/// 67 GAME ///</span>
            <span>FESTIWAL NAUKI UO</span>
            <span>/// ZAGRAJ TERAZ ///</span>
            <span>SPRAWDŹ SWOJĄ SZYBKOŚĆ</span>
            <span>/// 67 GAME ///</span>
            <span>FESTIWAL NAUKI UO</span>
          </div>
        </div>
      </div>
      
      {screen === 'START' && (
        <header className="header">
          <h1>67 GAME</h1>
        </header>
      )}

      <main className="main-content">
        {screen === 'START' && (
          <div className="start-layout">
            <div className="card start-card">
              <h2 className="glow-text">Festiwal Nauki UO - Wyzwanie "67"</h2>
              <p>Sprawdź swoją szybkość! Masz 15 sekund, by wykonać jak najwięcej naprzemiennych wymachów rąk (lewa góra, prawa dół i na odwrót).</p>
              <div className="instruction-box" style={{marginBottom: '2rem'}}>
                <span className="icon">⚠️</span> Odsun się odrobinę, by kamera widziała Twoje ramiona!
              </div>
              <button className="btn-primary" onClick={() => setScreen('CALIBRATION')}>
                ROZPOCZNIJ GRĘ
              </button>
            </div>
            <Leaderboard leaderboard={leaderboard} />
          </div>
        )}

        {(screen === 'CALIBRATION' || screen === 'COUNTDOWN' || screen === 'PLAYING') && (
          <div className="game-area">
            <div className="stats-bar">
              {screen === 'CALIBRATION' ? (
                <div className="instruction-box">
                  Zrób 5 próbnych wymachów! (Zrobiono: {calibrationCount}/5)
                </div>
              ) : screen === 'COUNTDOWN' ? (
                <div className="instruction-box" style={{color: '#f59e0b'}}>
                  Przygotuj się...
                </div>
              ) : (
                <>
                  <div className="stat">Wynik: <span key={score} className="score-punch">{score}</span></div>
                  <div className="stat">Czas: <span>{timeLeft}s</span></div>
                </>
              )}
            </div>
            
            {/* Progress bar — always visible during gameplay to prevent layout shift */}
            <div style={{ width: '100%', maxWidth: '640px', marginBottom: '0.5rem', minHeight: '52px' }}>
              {screen === 'PLAYING' ? (
                <ProgressBar score={score} leaderboard={leaderboard} />
              ) : (
                <div style={{ opacity: 0.3 }}>
                  <ProgressBar score={0} leaderboard={leaderboard} />
                </div>
              )}
            </div>
            
            <div 
              ref={cameraWrapperRef}
              className="camera-wrapper"
              style={{ position: 'relative', width: '100%', maxWidth: '640px', overflow: 'visible' }}
            >
              
              <div className="camera-inner">
                <CameraDetector onPoseUpdate={handlePoseUpdate} />
                
                {/* Particle canvas — inside camera for clean clipping */}
                {screen === 'PLAYING' && (
                  <ParticleCanvas ref={particleRef} />
                )}

                {/* Shockwave rings — inside camera */}
                {screen === 'PLAYING' && (
                  <ShockwaveRing ref={shockwaveRef} />
                )}

                {/* Combo counter — inside camera, top-right */}
                {screen === 'PLAYING' && (
                  <ComboCounter combo={combo} />
                )}
                
                {screen === 'COUNTDOWN' && (
                  <div className="countdown-overlay">
                    {countdownTime}
                  </div>
                )}
                
                {showStartText && screen === 'PLAYING' && (
                  <div className="countdown-overlay" style={{ color: 'var(--neo-yellow)' }}>
                    START!
                  </div>
                )}
              </div>

              {/* Floating scores — outside overflow:hidden to fly upward */}
              {screen === 'PLAYING' && (
                <FloatingScores ref={floatingScoresRef} />
              )}

              <Flames active={isFireMode} />
            </div>
          </div>
        )}

        {screen === 'NAME_INPUT' && (
          <div className="card text-center">
            <NameInput score={score} onSubmit={handleNameSubmit} />
          </div>
        )}

        {screen === 'RESULT' && (
          <div className="card text-center">
            <h2 className="glow-text">Koniec czasu!</h2>
            <div className="final-score">
              Udało Ci się zrobić <br/>
              <span className="huge-number">{score}</span> <br/>
              powtórzeń!
            </div>
            
            <div className="rank-display" style={{ margin: '1rem 0', fontSize: '1.5rem', color: 'var(--secondary)' }}>
              Ranga: <strong>{getRank(score).label}</strong>
            </div>

            <div className="result-actions">
              <button className="btn-primary mt-4" onClick={() => setShowCertificate(true)}
                style={{ background: 'var(--neo-green)' }}>
                🏆 ZOBACZ CERTYFIKAT
              </button>
              <button className="btn-primary mt-4" onClick={restartGame}>
                ZAGRAJ PONOWNIE
              </button>
              <button className="btn-secondary mt-4" onClick={() => setScreen('START')}>
                MENU GŁÓWNE
              </button>
            </div>
          </div>
        )}

        {showCertificate && (
          <Certificate
            name={playerName || 'GRACZ'}
            score={score}
            photoDataUrl={photoDataUrl}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
