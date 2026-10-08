import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || './data';
const AUDIO_DIR = path.join(DATA_DIR, 'audio');

fs.mkdirSync(AUDIO_DIR, { recursive: true });

export function saveAudio(noteId, buffer, mimetype) {
  const ext = mimetype === 'audio/webm' ? 'webm'
    : mimetype === 'audio/mp4' ? 'm4a'
    : mimetype === 'audio/ogg' ? 'ogg'
    : 'webm';

  const filename = `${noteId}.${ext}`;
  const filePath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Resolve a stored audio path, refusing anything outside the audio directory.
 */
export function getAudioPath(storedPath) {
  const root = path.resolve(AUDIO_DIR);
  const resolved = path.resolve(storedPath);
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error('Audio path is outside the audio directory');
  }
  return resolved;
}

export function audioExists(storedPath) {
  try {
    return fs.existsSync(getAudioPath(storedPath));
  } catch {
    return false;
  }
}

export function deleteAudio(storedPath) {
  const filePath = getAudioPath(storedPath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
