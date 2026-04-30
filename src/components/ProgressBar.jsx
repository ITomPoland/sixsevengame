import React from 'react';

// Rank thresholds optimized for 10pts/sec gameplay (15s = ~150 max theoretical)
const RANKS = [
  { min: 0,   label: 'Żółw 🐢',            color: '#e5e7eb' },
  { min: 20,  label: 'Szybki Bill 🏃',      color: '#d4ff00' },
  { min: 45,  label: 'Maszyna 🤖',          color: '#00e676' },
  { min: 70,  label: 'Turbina 🌪️',          color: '#0055ff' },
  { min: 100, label: 'Nadczłowiek ⚡',      color: '#ff00a0' },
  { min: 130, label: 'LEGENDA 67 👑',       color: '#ff6b00' },
];

const MAX_BAR = RANKS[RANKS.length - 1].min + 20; // 150

export const getRank = (score) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
};

export const getNextRank = (score) => {
  for (let i = 0; i < RANKS.length; i++) {
    if (score < RANKS[i].min) return RANKS[i];
  }
  return null;
};

const ProgressBar = ({ score }) => {
  const currentRank = getRank(score);
  const nextRank = getNextRank(score);

  let progress = 1;
  let progressLabel = '';

  if (nextRank) {
    const prevMin = currentRank.min;
    const range = nextRank.min - prevMin;
    progress = Math.min(1, (score - prevMin) / range);
    progressLabel = `→ ${nextRank.label} (${nextRank.min})`;
  } else {
    progressLabel = 'MAX RANGA!';
  }

  return (
    <div className="progress-bar-container">
      <div className="progress-rank-labels">
        <span className="progress-current">{currentRank.label}</span>
        <span className="progress-next">{progressLabel}</span>
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ 
            width: `${progress * 100}%`,
            background: currentRank.color,
          }}
        />
        {RANKS.slice(1).map((rank, i) => {
          const pos = (rank.min / MAX_BAR) * 100;
          return (
            <div 
              key={`rank-${i}`}
              className="progress-marker"
              style={{ left: `${pos}%` }}
              title={rank.label}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
