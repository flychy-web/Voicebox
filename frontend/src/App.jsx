import { useAuth } from './hooks/useAuth.js';
import { Login } from './screens/Login.jsx';
import { SeniorRecorder } from './screens/SeniorRecorder.jsx';
import { FamilyFeed } from './screens/FamilyFeed.jsx';
import './styles/global.css';

/**
 * VoiceBox App Shell
 *
 * State-based routing — only 3 states:
 *   1. Not logged in → Login
 *   2. Senior → Recorder
 *   3. Family → Feed
 */
export default function App() {
  const { user, isLoggedIn, isSenior, loading, error, login, logout } = useAuth();

  if (!isLoggedIn) {
    return <Login onLogin={login} loading={loading} error={error} />;
  }

  if (isSenior) {
    return <SeniorRecorder user={user} onLogout={logout} />;
  }

  return <FamilyFeed user={user} onLogout={logout} />;
}
