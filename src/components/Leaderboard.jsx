import React from 'react';

const Leaderboard = ({ leaderboard }) => {
  // Always pad the leaderboard array to exactly 5 elements
  const paddedLeaderboard = [...(leaderboard || [])];
  while (paddedLeaderboard.length < 5) {
    paddedLeaderboard.push(null);
  }

  return (
    <div className="leaderboard-container">
      <h3 className="glow-text-small">🏆 TOP 5 DZISIAJ</h3>
      <ul className="leaderboard-list">
        {paddedLeaderboard.map((entry, index) => (
          <li key={index} className={`leaderboard-item ${!entry ? 'empty-slot' : ''}`}>
            <span className="rank">#{index + 1}</span>
            <span className="name">{entry ? entry.name : '---'}</span>
            <span className="score">{entry ? entry.score : '-'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
