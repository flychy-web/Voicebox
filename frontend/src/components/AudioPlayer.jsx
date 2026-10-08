import { useState, useRef, useEffect } from 'react';
import { fetchAudioUrl } from '../utils/api.js';

export function AudioPlayer({ noteId }) {
  const [playing, setPlaying] = useState(false);
  const [src, setSrc] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);

  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    try {
      if (!src) {
        const url = await fetchAudioUrl(noteId);
        audioRef.current.src = url;
        setSrc(url);
      }
      setLoadError(false);
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setLoadError(true);
      setPlaying(false);
    }
  };

  return (
    <div>
      <audio ref={audioRef} onEnded={() => setPlaying(false)} preload="none" />
      {loadError && <p role="alert">Could not play this recording. Please try again.</p>}
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
