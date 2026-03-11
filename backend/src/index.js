import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

// Initialize database (runs migrations on import)
import './db.js';

import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import familyRoutes from './routes/family.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(morgan('short'));
app.use(express.json());

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'public')));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'voicebox', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/family', familyRoutes);

// SPA fallback — serve index.html for non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
}

app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\nVoiceBox API running on port ${PORT}`);
  console.log(`  Frontend: ${FRONTEND_URL}`);
  console.log(`  Health:   http://localhost:${PORT}/api/health\n`);
});

export default app;
