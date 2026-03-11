import { useState } from 'react';
import { RecordButton } from '../components/RecordButton.jsx';
import { useRecorder } from '../hooks/useRecorder.js';
import { uploadVoiceNote } from '../utils/api.js';

export function SeniorRecorder({ user, onLogout }) {
  const { isRecording, duration, error: recorderError, startRecording, stopRecording } = useRecorder();
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleTap = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (!blob) return;

      setStatus('sending');
      setErrorMsg(null);

      try {
        await uploadVoiceNote(blob);
        setStatus('sent');
        setTimeout(() => setStatus('idle'), 3000);
      } catch {
        setStatus('error');
        setErrorMsg('Could not send. Please try again.');
      }
    } else {
      setStatus('idle');
      setErrorMsg(null);
      await startRecording();
    }
  };

  return (
    <div className="page" style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>Hi, {user.name}</h1>
          <p style={styles.hint}>Record a message for your family</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn} aria-label="Log out">Log out</button>
      </div>

      {status === 'sending' ? (
        <div style={styles.statusArea}>
          <div style={styles.spinner} />
          <p style={styles.statusText}>Sending to family...</p>
        </div>
      ) : status === 'sent' ? (
        <div style={styles.statusArea} className="fade-in">
          <div style={styles.checkmark}>&#10003;</div>
          <p style={styles.statusText}>Sent!</p>
        </div>
      ) : (
        <RecordButton isRecording={isRecording} duration={duration} onTap={handleTap} />
      )}

      {(recorderError || errorMsg) && (
        <div style={styles.error} role="alert">{recorderError || errorMsg}</div>
      )}
    </div>
  );
}

const styles = {
  page: { paddingTop:'var(--space-lg)' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--space-lg)' },
  greeting: { fontSize:'var(--font-size-xl)', fontWeight:700 },
  hint: { fontSize:'var(--font-size-sm)', color:'var(--color-text-secondary)', marginTop:4 },
  logoutBtn: { background:'none', color:'var(--color-text-secondary)', fontSize:'var(--font-size-sm)', padding:'var(--space-xs) var(--space-sm)', textDecoration:'underline' },
  statusArea: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'var(--space-md)' },
  statusText: { fontSize:'var(--font-size-xl)', fontWeight:600, color:'var(--color-text)' },
  spinner: { width:64, height:64, border:'6px solid var(--color-border)', borderTop:'6px solid var(--color-primary)', borderRadius:'50%', animation:'spin 1s linear infinite' },
  checkmark: { width:100, height:100, borderRadius:'50%', background:'var(--color-success)', color:'#FFFFFF', fontSize:48, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' },
  error: { textAlign:'center', color:'var(--color-urgent)', fontSize:'var(--font-size-sm)', fontWeight:600, padding:'var(--space-md)' },
};
