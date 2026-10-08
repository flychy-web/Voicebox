import { Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { saveAudio, audioExists, getAudioPath, deleteAudio } from '../services/storage.js';
import { processVoiceNote } from '../services/processor.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

/**
 * POST /api/notes — upload a voice note
 */
router.post('/', requireAuth, upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const noteId = uuid();
  const audioPath = saveAudio(noteId, req.file.buffer, req.file.mimetype);

  db.prepare(`
    INSERT INTO voice_notes (id, user_id, family_id, audio_path, status)
    VALUES (?, ?, ?, ?, 'processing')
  `).run(noteId, req.user.id, req.user.familyId, audioPath);

  // Fire and forget — processing happens async
  processVoiceNote(noteId).catch(err => {
    console.error(`[Notes] Background processing failed for ${noteId}:`, err.message);
  });

  res.status(201).json({
    id: noteId,
    status: 'processing',
    message: 'Voice note received! Processing...',
  });
});

/**
 * GET /api/notes — list notes for the user's family
 */
router.get('/', requireAuth, (req, res) => {
  const { status } = req.query;

  let query = 'SELECT * FROM voice_notes WHERE family_id = ?';
  const params = [req.user.familyId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const notes = db.prepare(query).all(...params);

  const users = new Map();
  for (const note of notes) {
    if (!users.has(note.user_id)) {
      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(note.user_id);
      users.set(note.user_id, user?.name || 'Unknown');
    }
    note.userName = users.get(note.user_id);
  }

  res.json({ notes });
});

/**
 * GET /api/notes/:id — single note
 */
router.get('/:id', requireAuth, (req, res) => {
  const note = db.prepare(
    'SELECT * FROM voice_notes WHERE id = ? AND family_id = ?'
  ).get(req.params.id, req.user.familyId);

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(note.user_id);
  note.userName = user?.name || 'Unknown';

  res.json({ note });
});

/**
 * GET /api/notes/:id/audio — stream audio
 */
router.get('/:id/audio', requireAuth, (req, res) => {
  const note = db.prepare(
    'SELECT audio_path FROM voice_notes WHERE id = ? AND family_id = ?'
  ).get(req.params.id, req.user.familyId);

  if (!note || !audioExists(note.audio_path)) {
    return res.status(404).json({ error: 'Audio not found' });
  }

  res.sendFile(getAudioPath(note.audio_path));
});

/**
 * DELETE /api/notes/:id
 */
router.delete('/:id', requireAuth, (req, res) => {
  const note = db.prepare(
    'SELECT * FROM voice_notes WHERE id = ? AND family_id = ?'
  ).get(req.params.id, req.user.familyId);

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  db.prepare('DELETE FROM voice_notes WHERE id = ?').run(req.params.id);

  try {
    deleteAudio(note.audio_path);
  } catch (err) {
    console.error(`[Notes] Could not delete audio for note ${note.id}:`, err.message);
  }

  res.json({ success: true });
});

export default router;
