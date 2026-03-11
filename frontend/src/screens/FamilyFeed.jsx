import { useState, useEffect, useCallback } from 'react';
import { NoteCard } from '../components/NoteCard.jsx';
import { getNotes } from '../utils/api.js';

export function FamilyFeed({ user, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data.notes || []);
      setError(null);
    } catch {
      setError('Could not load notes. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, [fetchNotes]);

  return (
    <div className="page" style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Family Updates</h1>
          <p style={styles.subtitle}>{user.familyName || 'Your family'}</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={fetchNotes} style={styles.refreshBtn} aria-label="Refresh">Refresh</button>
          <button onClick={onLogout} style={styles.logoutBtn} aria-label="Log out">Log out</button>
        </div>
      </div>

      {loading && <div style={styles.center}><p style={styles.loadingText}>Loading...</p></div>}

      {error && (
        <div style={styles.errorBox} role="alert">
          <p>{error}</p>
          <button onClick={fetchNotes} style={styles.retryBtn}>Try again</button>
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <div style={styles.center}>
          <p style={styles.emptyTitle}>No voice notes yet</p>
          <p style={styles.emptyText}>When your family member records a message, it will appear here.</p>
        </div>
      )}

      <div style={styles.list}>
        {notes.map(note => <NoteCard key={note.id} note={note} />)}
      </div>
    </div>
  );
}

const styles = {
  page: { paddingTop:'var(--space-lg)' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--space-lg)' },
  title: { fontSize:'var(--font-size-xl)', fontWeight:700 },
  subtitle: { fontSize:'var(--font-size-sm)', color:'var(--color-text-secondary)', marginTop:4 },
  headerActions: { display:'flex', gap:'var(--space-sm)', alignItems:'center' },
  refreshBtn: { background:'var(--color-primary)', color:'#FFF', fontSize:'var(--font-size-sm)', fontWeight:600, padding:'10px 20px', borderRadius:'var(--radius-full)', border:'none' },
  logoutBtn: { background:'none', color:'var(--color-text-secondary)', fontSize:'var(--font-size-sm)', padding:'var(--space-xs)', textDecoration:'underline', border:'none' },
  center: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:'var(--space-sm)', padding:'var(--space-xl) 0' },
  loadingText: { fontSize:'var(--font-size-lg)', color:'var(--color-text-secondary)' },
  emptyTitle: { fontSize:'var(--font-size-lg)', fontWeight:600 },
  emptyText: { fontSize:'var(--font-size-sm)', color:'var(--color-text-secondary)', maxWidth:280 },
  errorBox: { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--radius-md)', padding:'var(--space-md)', textAlign:'center', marginBottom:'var(--space-md)', color:'var(--color-urgent)', fontSize:'var(--font-size-sm)' },
  retryBtn: { marginTop:'var(--space-sm)', background:'var(--color-urgent)', color:'#FFF', padding:'10px 24px', borderRadius:'var(--radius-full)', border:'none', fontWeight:600, fontSize:'var(--font-size-sm)' },
  list: { flex:1 },
};
