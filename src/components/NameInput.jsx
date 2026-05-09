import React, { useState, useEffect, useRef } from 'react';

const MAX_CHARS = 6;

const NameInput = ({ score, onSubmit }) => {
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const hiddenInputRef = useRef(null);

  // Auto-focus hidden input on mount to trigger mobile keyboard
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    }, 600); // delay to let entry animation finish
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard typing for arcade feel (desktop fallback)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if hidden input is focused — it handles input via onChange
      if (document.activeElement === hiddenInputRef.current) return;

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

  // Handle hidden input changes (mobile keyboard)
  const handleInputChange = (e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, MAX_CHARS);
    setName(raw);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && name.length > 0) {
      e.preventDefault();
      onSubmit(name, consent);
    }
  };

  const handleSubmit = () => {
    if (name.length > 0) {
      onSubmit(name, consent);
    }
  };

  // Focus the hidden input when tapping on the arcade slots
  const handleSlotsClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
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
      
      {/* Hidden input for mobile keyboard trigger */}
      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck="false"
        maxLength={MAX_CHARS}
        value={name}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        className="name-hidden-input"
        aria-label="Wpisz nick"
      />

      <div className="arcade-input" onClick={handleSlotsClick}>
        {slots.map((char, i) => (
          <div key={i} className={`char-slot ${i < name.length ? 'char-filled' : ''} ${i === name.length ? 'char-active' : ''}`}>
            {char}
          </div>
        ))}
      </div>
      
      <div className="consent-box">
        <label className="consent-label">
          <input 
            type="checkbox" 
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="consent-checkbox"
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
