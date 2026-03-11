import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer.jsx';
import { getAudioUrl } from '../utils/api.js';

export function NoteCard({ note }) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = getTimeAgo(note.created_at);
  const urgencyClass = note.urgency !== 'normal' ? `urgency-${note.urgency}` : '';
  const categoryClass = `pill pill-${note.category}`;

  return (
    <div className={`card ${urgencyClass} fade-in`} style={styles.card} role="article" aria-label={`Voice note from ${note.userName}`}>
      {note.urgency === 'urgent' && <div style={styles.urgentBanner} role="alert">URGENT</div>}
      {note.urgency === 'important' && <div style={styles.importantBanner}>Important</div>}

      <div style={styles.header}>
        <div>
          <span style={styles.name}>{note.userName}</span>
          <span style={styles.time}>{timeAgo}</span>
        </div>
        <span className={categoryClass}>{formatCategory(note.category)}</span>
      </div>

      {note.summary && <p style={styles.summary}>{note.summary}</p>}
      {note.summary && <p style={styles.aiLabel}>AI-generated summary</p>}

      {note.status === 'processing' && <p style={styles.processing}>Processing voice note...</p>}
      {note.status === 'failed' && <p style={styles.failed}>Processing failed</p>}

      {note.status === 'ready' && (
        <button onClick={() => setExpanded(!expanded)} style={styles.expandButton} aria-expanded={expanded}>
          {expanded ? 'Show less' : 'Show full transcript'}
        </button>
      )}

      {expanded && (
        <div style={styles.expanded}>
          {note.transcript && (
            <>
              <p style={styles.transcriptLabel}>Original transcript:</p>
              <p style={styles.transcript}>{note.transcript}</p>
            </>
          )}
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <AudioPlayer src={getAudioUrl(note.id)} />
          </div>
        </div>
      )}
    </div>
  );
}

function formatCategory(cat) {
  const map = { health:'Health', daily_life:'Daily Life', family:'Family', request:'Request', memory:'Memory', general:'General' };
  return map[cat] || cat;
}

function getTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles = {
  card: { marginBottom:'var(--space-md)' },
  urgentBanner: { background:'var(--color-urgent)', color:'#FFF', padding:'6px 14px', borderRadius:'var(--radius-sm)', fontSize:'var(--font-size-sm)', fontWeight:700, marginBottom:'var(--space-sm)', display:'inline-block', letterSpacing:'0.05em' },
  importantBanner: { background:'var(--color-important)', color:'#FFF', padding:'6px 14px', borderRadius:'var(--radius-sm)', fontSize:'var(--font-size-sm)', fontWeight:700, marginBottom:'var(--space-sm)', display:'inline-block' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'var(--space-sm)', marginBottom:'var(--space-sm)' },
  name: { fontSize:'var(--font-size-base)', fontWeight:700, display:'block' },
  time: { fontSize:'var(--font-size-sm)', color:'var(--color-text-secondary)' },
  summary: { fontSize:'var(--font-size-base)', lineHeight:1.5, marginBottom:'var(--space-xs)' },
  aiLabel: { fontSize:14, color:'var(--color-text-secondary)', fontStyle:'italic', marginBottom:'var(--space-sm)' },
  processing: { fontSize:'var(--font-size-sm)', color:'var(--color-text-secondary)', fontStyle:'italic' },
  failed: { fontSize:'var(--font-size-sm)', color:'var(--color-urgent)', fontWeight:600 },
  expandButton: { background:'none', color:'var(--color-primary)', fontSize:'var(--font-size-sm)', fontWeight:600, padding:'var(--space-xs) 0', textDecoration:'underline', minHeight:'var(--touch-min)', display:'flex', alignItems:'center' },
  expanded: { marginTop:'var(--space-sm)', paddingTop:'var(--space-sm)', borderTop:'1px solid var(--color-border-light)' },
  transcriptLabel: { fontSize:'var(--font-size-sm)', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'var(--space-xs)' },
  transcript: { fontSize:'var(--font-size-sm)', lineHeight:1.6, background:'var(--color-bg)', padding:'var(--space-sm)', borderRadius:'var(--radius-sm)', marginBottom:'var(--space-md)' },
};
