import { useState, useRef } from 'react';

export function AudioPlayer({ src }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div>
      <audio ref={audioRef} src={src} onEnded={() => setPlaying(false)} preload="none" />
      <button
        onClick={toggle}
        style={{...styles.button, ...(playing ? styles.playing : {})}}
        aria-label={playing ? 'Stop playing' : 'Play recording'}
      >
        {playing ? <div style={styles.stopIcon} /> : <div style={styles.playIcon} />}
        <span style={styles.label}>{playing ? 'Stop' : 'Play'}</span>
      </button>
    </div>
  );
}

const styles = {
  button: { display:'flex', alignItems:'center', gap:10, padding:'12px 24px', background:'var(--color-primary)', color:'#FFFFFF', borderRadius:'var(--radius-full)', border:'none', fontSize:'var(--font-size-sm)', fontWeight:600, minHeight:'var(--touch-min)' },
  playing: { background:'var(--color-text-secondary)' },
  playIcon: { width:0, height:0, borderLeft:'14px solid #FFFFFF', borderTop:'9px solid transparent', borderBottom:'9px solid transparent' },
  stopIcon: { width:16, height:16, borderRadius:2, background:'#FFFFFF' },
  label: { fontSize:'var(--font-size-sm)' },
};
