import OpenAI from 'openai';
import fs from 'fs';

let _openai;
function getClient() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/**
 * Transcribe an audio file using OpenAI Whisper.
 * Designed for short voice notes (typically under 5 minutes).
 */
export async function transcribe(audioPath) {
  const stat = fs.statSync(audioPath);
  console.log(`[Whisper] Transcribing ${audioPath} (${(stat.size / 1024).toFixed(0)} KB)`);

  const response = await getClient().audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
  });

  console.log(`[Whisper] Done — ${response.segments?.length || 0} segments, ${Math.round(response.duration || 0)}s`);

  return {
    text: response.text,
    duration: Math.round(response.duration || 0),
  };
}
