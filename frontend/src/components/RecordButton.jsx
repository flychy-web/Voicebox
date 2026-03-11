export function RecordButton({ isRecording, duration, onTap }) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div style={styles.wrapper}>
      <button
        onClick={onTap}
        style={{...styles.button, ...(isRecording ? styles.recording : {})}}
        aria-label={isRecording ? `Stop recording. Duration: ${timeStr}` : 'Start recording'}
      >
        {isRecording ? (
          <div style={styles.stopIcon} />
        ) : (
          <div style={styles.micIcon}>
            <div style={styles.micHead} />
            <div style={styles.micStand} />
            <div style={styles.micBase} />
          </div>
        )}
      </button>

      <p style={styles.label} aria-live="polite">
        {isRecording ? timeStr : 'Tap to record'}
      </p>

      {isRecording && <p style={styles.hint}>Tap again to stop</p>}
    </div>
  );
}

const styles = {
  wrapper: { display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--space-md)', flex:1, justifyContent:'center' },
  button: { width:180, height:180, borderRadius:'50%', background:'var(--color-record)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 24px rgba(220,38,38,0.3)', cursor:'pointer' },
  recording: { background:'var(--color-record-active)', animation:'pulse 1.5s ease-in-out infinite', boxShadow:'0 4px 32px rgba(220,38,38,0.5)' },
  stopIcon: { width:48, height:48, borderRadius:8, background:'#FFFFFF' },
  micIcon: { display:'flex', flexDirection:'column', alignItems:'center' },
  micHead: { width:36, height:52, borderRadius:18, background:'#FFFFFF' },
  micStand: { width:4, height:14, background:'#FFFFFF', marginTop:2 },
  micBase: { width:32, height:4, borderRadius:2, background:'#FFFFFF', marginTop:2 },
  label: { fontSize:'var(--font-size-xl)', fontWeight:600, color:'var(--color-text)' },
  hint: { fontSize:'var(--font-size-sm)', color:'var(--color-text-secondary)' },
};
