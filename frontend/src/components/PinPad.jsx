import { useState } from 'react';

export function PinPad({ onSubmit, loading, error }) {
  const [pin, setPin] = useState('');

  const handleDigit = (digit) => {
    if (pin.length < 8) setPin(prev => prev + digit);
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const handleSubmit = () => {
    if (pin.length >= 4) onSubmit(pin);
  };

  return (
    <div style={styles.container}>
      <div style={styles.display} aria-live="polite" aria-label={`Code: ${pin.length} digits entered`}>
        {pin ? (
          <span style={styles.dots}>
            {pin.split('').map((_, i) => <span key={i} style={styles.dot} />)}
          </span>
        ) : (
          <span style={styles.placeholder}>Enter your code</span>
        )}
      </div>

      {error && <div style={styles.error} role="alert">{error}</div>}

      <div style={styles.grid}>
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <button key={d} onClick={() => handleDigit(String(d))} style={styles.key} aria-label={String(d)}>
            {d}
          </button>
        ))}
        <button onClick={handleDelete} style={{...styles.key,...styles.keySecondary}} aria-label="Delete" disabled={!pin.length}>
          Del
        </button>
        <button onClick={() => handleDigit('0')} style={styles.key} aria-label="0">0</button>
        <button onClick={handleSubmit} style={{...styles.key,...styles.keyPrimary, opacity: pin.length < 4 ? 0.4 : 1}} disabled={pin.length < 4 || loading} aria-label="Enter">
          {loading ? '...' : 'Go'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--space-md)', width:'100%', maxWidth:320 },
  display: { width:'100%', height:64, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-surface)', border:'2px solid var(--color-border)', borderRadius:'var(--radius-md)' },
  dots: { display:'flex', gap:12 },
  dot: { width:18, height:18, borderRadius:'50%', background:'var(--color-text)' },
  placeholder: { color:'var(--color-text-secondary)', fontSize:'var(--font-size-base)' },
  error: { color:'var(--color-urgent)', fontSize:'var(--font-size-sm)', fontWeight:600, textAlign:'center', padding:'var(--space-xs) var(--space-sm)' },
  grid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, width:'100%' },
  key: { height:72, fontSize:'var(--font-size-xl)', fontWeight:600, background:'var(--color-surface)', border:'1px solid var(--color-border-light)', borderRadius:'var(--radius-md)', color:'var(--color-text)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' },
  keySecondary: { fontSize:'var(--font-size-base)', background:'var(--color-bg)', color:'var(--color-text-secondary)' },
  keyPrimary: { background:'var(--color-primary)', color:'#FFFFFF', border:'none', fontSize:'var(--font-size-lg)' },
};
