import { PinPad } from '../components/PinPad.jsx';

export function Login({ onLogin, loading, error }) {
  return (
    <div className="page" style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>VoiceBox</h1>
        <p style={styles.subtitle}>Enter your family code</p>
      </div>
      <div style={styles.padWrapper}>
        <PinPad onSubmit={onLogin} loading={loading} error={error} />
      </div>
      <p style={styles.footer}>
        Don't have a code? Ask your family member to set one up.
      </p>
    </div>
  );
}

const styles = {
  page: { justifyContent:'center', alignItems:'center', gap:'var(--space-lg)' },
  header: { textAlign:'center' },
  title: { fontSize:'var(--font-size-2xl)', fontWeight:700, color:'var(--color-text)', marginBottom:'var(--space-xs)' },
  subtitle: { fontSize:'var(--font-size-lg)', color:'var(--color-text-secondary)' },
  padWrapper: { display:'flex', justifyContent:'center' },
  footer: { fontSize:'var(--font-size-sm)', color:'var(--color-text-secondary)', textAlign:'center' },
};
