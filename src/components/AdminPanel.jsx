import React, { useState, useEffect } from 'react';
import { database, auth } from '../firebase';
import { ref as dbRef, onValue, remove } from 'firebase/database';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import Certificate from './Certificate';

const AdminPanel = ({ onBack }) => {
  const [entries, setEntries] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return; // Only fetch if logged in

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
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError('Nieprawidłowy email lub hasło.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Błąd wylogowania", err);
    }
  };

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
        <div>
          {user && <button className="btn-secondary" style={{ marginRight: '10px' }} onClick={handleLogout}>Wyloguj</button>}
          <button className="btn-secondary" onClick={onBack}>Wróć do menu</button>
        </div>
      </div>

      {!user ? (
        <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
          <h3>Zaloguj się</h3>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '0.8rem', fontSize: '1.2rem', border: '3px solid var(--neo-black)', borderRadius: '8px' }}
              required 
            />
            <input 
              type="password" 
              placeholder="Hasło" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '0.8rem', fontSize: '1.2rem', border: '3px solid var(--neo-black)', borderRadius: '8px' }}
              required 
            />
            {loginError && <div style={{ color: 'var(--neo-pink)', fontWeight: 'bold' }}>{loginError}</div>}
            <button type="submit" className="btn-primary">Zaloguj</button>
          </form>
        </div>
      ) : (
        <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Miejsce</th>
              <th>Nick</th>
              <th>Wynik</th>
              <th>Data</th>
              <th>Zgoda</th>
              <th>Certyfikat</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Brak wpisów w bazie.</td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td>#{index + 1}</td>
                  <td><strong>{entry.name}</strong></td>
                  <td><span className="admin-score">{entry.score}</span></td>
                  <td className="admin-date">{formatDate(entry.timestamp)}</td>
                  <td>
                    {entry.consentGiven ? (
                      <span style={{ color: 'var(--neo-green)', fontWeight: 'bold' }}>✅ TAK</span>
                    ) : (
                      <span style={{ color: 'var(--neo-pink)', fontWeight: 'bold' }}>❌ NIE</span>
                    )}
                  </td>
                  <td>
                    {entry.photoUrl ? (
                      <div 
                        onClick={() => setSelectedCert(entry)} 
                        style={{ cursor: 'pointer', display: 'inline-block' }}
                        title="Pokaż pełny certyfikat"
                      >
                        <img src={entry.photoUrl} alt={`Certyfikat ${entry.name}`} className="admin-photo-thumb" />
                      </div>
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

      )}

      {selectedCert && (
        <Certificate 
          name={selectedCert.name}
          score={selectedCert.score}
          uploadedPhotoUrl={selectedCert.photoUrl}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
