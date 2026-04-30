import React, { useState, useEffect } from 'react';

const MAX_CHARS = 6;

const NameInput = ({ score, onSubmit }) => {
  const [name, setName] = useState('');

  // Handle keyboard typing for arcade feel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
        if (name.length < MAX_CHARS) {
          setName((prev) => (prev + e.key.toUpperCase()).slice(0, MAX_CHARS));
        }
      } else if (e.key === 'Backspace') {
        setName((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter' && name.length > 0) {
        onSubmit(name);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, onSubmit]);

  const handleSubmit = () => {
    if (name.length > 0) {
      onSubmit(name);
    }
  };

  // Build slots array
  const slots = [];
  for (let i = 0; i < MAX_CHARS; i++) {
    slots.push(name[i] || '_');
  }

  return (
    <div className="name-input-container">
      <h2 className="glow-text" style={{ color: 'var(--neo-pink)' }}>KONIEC!</h2>
      <p className="subtitle" style={{ fontSize: '2rem', fontWeight: '800' }}>Twój wynik: <strong>{score}</strong></p>
      <p className="instruction">Wpisz swój nick aby odebrać certyfikat:</p>
      
      <div className="arcade-input">
        {slots.map((char, i) => (
          <div key={i} className={`char-slot ${i < name.length ? 'char-filled' : ''}`}>
            {char}
          </div>
        ))}
      </div>
      
      <button 
        className={`btn-primary arcade-btn`}
        onClick={handleSubmit}
        disabled={name.length === 0}
        style={{ marginTop: '1rem', background: 'var(--neo-pink)' }}
      >
        ZAPISZ
      </button>
    </div>
  );
};

export default NameInput;
