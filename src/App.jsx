import React, { useState, useEffect, useRef } from 'react';
import CameraDetector from './components/CameraDetector';
import { check67Gesture } from './gameLogic';
import './index.css';

function App() {
  const [screen, setScreen] = useState('START'); // START, CALIBRATION, COUNTDOWN, PLAYING, RESULT
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [countdownTime, setCountdownTime] = useState(5);
  
  // Refs to avoid re-renders on every frame
  const lastGestureRef = useRef('neutral');
  const scoreRef = useRef(0);
  const screenRef = useRef('START');
  
  // Cache for wrists to handle frame drops during fast motion
  const lastLeftWristRef = useRef(null);
  const lastRightWristRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (screen === 'COUNTDOWN' && countdownTime > 0) {
      timer = setInterval(() => setCountdownTime(prev => prev - 1), 1000);
    } else if (screen === 'COUNTDOWN' && countdownTime === 0) {
      setScore(0);
      setTimeLeft(15);
      setScreen('PLAYING');
    } else if (screen === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (screen === 'PLAYING' && timeLeft === 0) {
      setScreen('RESULT');
    }
    return () => clearInterval(timer);
  }, [screen, timeLeft, countdownTime]);

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
        const newScore = scoreRef.current + 1;
        setScore(newScore);
        if (newScore >= 5) {
          setCountdownTime(5);
          setScreen('COUNTDOWN');
        }
      } else if (screenRef.current === 'PLAYING') {
        // Increment score
        setScore(prev => prev + 1);
      }
    }

    if (currentGesture !== 'neutral') {
      lastGestureRef.current = currentGesture;
    }
  };

  const restartGame = () => {
    setScore(0);
    setTimeLeft(15);
    lastGestureRef.current = 'neutral';
    lastLeftWristRef.current = null;
    lastRightWristRef.current = null;
    setScreen('CALIBRATION');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>67 GAME</h1>
      </header>

      <main className="main-content">
        {screen === 'START' && (
          <div className="card text-center">
            <h2>Festiwal Nauki UO - Wyzwanie "67"</h2>
            <p>Sprawdź swoją szybkość! Masz 15 sekund, by wykonać jak najwięcej naprzemiennych wymachów rąk (lewa góra, prawa dół i na odwrót).</p>
            <div className="instruction-box" style={{marginBottom: '2rem'}}>
              ⚠️ Odsun się odrobinę, by kamera widziała Twoje ramiona!
            </div>
            <button className="btn-primary" onClick={() => setScreen('CALIBRATION')}>
              Rozpocznij
            </button>
          </div>
        )}

        {(screen === 'CALIBRATION' || screen === 'COUNTDOWN' || screen === 'PLAYING') && (
          <div className="game-area">
            <div className="stats-bar">
              {screen === 'CALIBRATION' ? (
                <div className="instruction-box">
                  Zrób 5 próbnych wymachów! (Zrobiono: {score}/5)
                </div>
              ) : screen === 'COUNTDOWN' ? (
                <div className="instruction-box" style={{color: '#f59e0b'}}>
                  Przygotuj się...
                </div>
              ) : (
                <>
                  <div className="stat">Wynik: <span>{score}</span></div>
                  <div className="stat">Czas: <span>{timeLeft}s</span></div>
                </>
              )}
            </div>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
              <CameraDetector onPoseUpdate={handlePoseUpdate} />
              
              {screen === 'COUNTDOWN' && (
                <div className="countdown-overlay">
                  {countdownTime > 0 ? countdownTime : "START!"}
                </div>
              )}
            </div>
          </div>
        )}

        {screen === 'RESULT' && (
          <div className="card text-center">
            <h2>Koniec czasu!</h2>
            <div className="final-score">
              Udało Ci się zrobić <br/>
              <span className="huge-number">{score}</span> <br/>
              powtórzeń!
            </div>
            <button className="btn-primary mt-4" onClick={restartGame}>
              Zagraj ponownie
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
