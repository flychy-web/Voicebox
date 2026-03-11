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

export function getAudioPath(relativePath) {
  return path.resolve(relativePath);
}

export function audioExists(filePath) {
  return fs.existsSync(filePath);
}

export function deleteAudio(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
