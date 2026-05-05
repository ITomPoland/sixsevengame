import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref as dbRef, onValue, remove } from 'firebase/database';

const AdminPanel = ({ onBack }) => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const leaderboardRef = dbRef(database, 'leaderboard');
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sortedEntries = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.score - a.score);
        
        setEntries(sortedEntries);
      } else {
        setEntries([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Czy na pewno chcesz usunąć wynik gracza: ${name}?`)) {
      try {
        await remove(dbRef(database, `leaderboard/${id}`));
      } catch (error) {
        console.error("Błąd podczas usuwania:", error);
        alert("Wystąpił błąd podczas usuwania wpisu.");
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Brak daty';
    return new Date(timestamp).toLocaleString('pl-PL');
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Panel Administratora</h2>
        <button className="btn-secondary" onClick={onBack}>Wróć do menu</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Miejsce</th>
              <th>Nick</th>
              <th>Wynik</th>
              <th>Data</th>
              <th>Certyfikat</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Brak wpisów w bazie.</td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td>#{index + 1}</td>
                  <td><strong>{entry.name}</strong></td>
                  <td><span className="admin-score">{entry.score}</span></td>
                  <td className="admin-date">{formatDate(entry.timestamp)}</td>
                  <td>
                    {entry.photoUrl ? (
                      <a href={entry.photoUrl} target="_blank" rel="noopener noreferrer">
                        <img src={entry.photoUrl} alt={`Certyfikat ${entry.name}`} className="admin-photo-thumb" />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>Brak zdjęcia</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(entry.id, entry.name)}
                      title="Usuń wpis"
                    >
                      🗑️ Usuń
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
