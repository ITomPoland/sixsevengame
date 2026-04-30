import React from 'react';

const Leaderboard = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="leaderboard-container">
        <h3 className="glow-text-small">🏆 TOP 5 DZISIAJ</h3>
        <p className="empty-leaderboard">Bądź pierwszym, który zagra!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h3 className="glow-text-small">🏆 TOP 5 DZISIAJ</h3>
      <ul className="leaderboard-list">
        {leaderboard.map((entry, index) => (
          <li key={index} className="leaderboard-item">
            <span className="rank">#{index + 1}</span>
            <span className="name">{entry.name}</span>
            <span className="score">{entry.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
