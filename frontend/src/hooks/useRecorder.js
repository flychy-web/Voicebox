import { useState, useRef, useCallback } from 'react';

/**
 * MediaRecorder hook — records audio from the microphone.
 * Returns a Blob when recording stops.
 */
export function useRecorder() {
  const [state, setState] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    chunks.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onerror = () => {
        setError('Recording failed. Please try again.');
        setState('idle');
        clearInterval(timerRef.current);
      };

      mediaRecorder.current = recorder;
      recorder.start(1000);

      startTimeRef.current = Date.now();
      setDuration(0);
      setState('recording');

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access was denied. Please allow microphone access to record.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError('Could not start recording. Please try again.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state !== 'recording') {
        resolve(null);
        return;
      }

      clearInterval(timerRef.current);

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, {
          type: mediaRecorder.current.mimeType || 'audio/webm',
        });
        mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
        setState('idle');
        resolve(blob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  return {
    state,
    isRecording: state === 'recording',
    duration,
    error,
    startRecording,
    stopRecording,
    clearError: () => setError(null),
  };
}
