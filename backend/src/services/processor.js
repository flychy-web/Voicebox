import db from '../db.js';
import { transcribe } from './transcription.js';
import { summarize } from './summarizer.js';

/**
 * Process a voice note through the AI pipeline:
 *   1. Transcribe audio with Whisper
 *   2. Summarize + categorize with Claude
 *   3. Update the database record
 *
 * Runs async — caller should not await in the request cycle.
 */
export async function processVoiceNote(noteId) {
  const note = db.prepare('SELECT * FROM voice_notes WHERE id = ?').get(noteId);
  if (!note) {
    console.error(`[Processor] Note ${noteId} not found`);
    return;
  }

  console.log(`[Processor] Starting pipeline for note ${noteId}`);

  try {
    // Step 1: Transcribe
    const { text: transcript, duration } = await transcribe(note.audio_path);

    db.prepare(`
      UPDATE voice_notes SET transcript = ?, duration_seconds = ? WHERE id = ?
    `).run(transcript, duration, noteId);

    console.log(`[Processor] Transcribed note ${noteId}: ${transcript.length} chars, ${duration}s`);

    // Step 2: Summarize + categorize
    const { summary, category, urgency } = await summarize(transcript);

    // Step 3: Mark as ready
    db.prepare(`
      UPDATE voice_notes
      SET summary = ?, category = ?, urgency = ?, status = 'ready'
      WHERE id = ?
    `).run(summary, category, urgency, noteId);

    console.log(`[Processor] Done with note ${noteId}: ${category} / ${urgency}`);

  } catch (err) {
    console.error(`[Processor] Failed for note ${noteId}:`, err.message);

    db.prepare(`
      UPDATE voice_notes SET status = 'failed' WHERE id = ?
    `).run(noteId);
  }
}
