import { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref as dbRef, onValue } from 'firebase/database';

/**
 * Subscribes to the Firebase Realtime Database leaderboard.
 * Returns a live-updating sorted array of top N scores.
 *
 * @param {number} maxEntries - Number of top scores to return
 * @returns {Array} Sorted leaderboard entries [{ id, name, score, ... }]
 */
export default function useLeaderboard(maxEntries = 5) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const leaderboardRef = dbRef(database, 'leaderboard');
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert snapshot to array, sort by score descending, take top N
        const topScores = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxEntries);

        setLeaderboard(topScores);
      } else {
        setLeaderboard([]);
      }
    });

    return () => unsubscribe();
  }, [maxEntries]);

  return leaderboard;
}
