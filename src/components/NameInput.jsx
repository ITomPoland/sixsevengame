import React, { useState, useEffect } from 'react';

const MAX_CHARS = 6;

const NameInput = ({ score, onSubmit }) => {
  const [name, setName] = useState('');

  const [consent, setConsent] = useState(false);

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
        onSubmit(name, consent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, consent, onSubmit]);

  const handleSubmit = () => {
    if (name.length > 0) {
      onSubmit(name, consent);
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
      
      <div style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '400px', margin: '1.5rem auto 0 auto', background: 'rgba(0,0,0,0.4)', padding: '1rem', border: '2px solid var(--secondary)' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', lineHeight: '1.4' }}>
          <input 
            type="checkbox" 
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: '3px', transform: 'scale(1.2)', accentColor: 'var(--neo-pink)' }}
          />
          <span>Zgadzam się na publikację mojego wyniku oraz pamiątkowego zdjęcia na profilach społecznościowych twórców (np. LinkedIn) w celach promocyjnych.</span>
        </label>
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
