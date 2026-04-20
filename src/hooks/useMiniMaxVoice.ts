import { useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useVoiceStore } from '@/stores/voiceStore';

// MOCK API - Replace with actual MiniMax Endpoint Call
const mockMiniMaxCall = async (
  _audioBlob: Blob,
  contextStr: string
): Promise<{ text: string; audioUrl: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text:
          'Olá! Sou F.R.I.D.A.Y. Vejo que você está acessando a área ' +
          contextStr +
          '. Como posso ajudar nos quadros Neo-Terminal?',
        audioUrl: '', // In a real scenario, this would be a URL or ArrayBuffer for playback
      });
    }, 1500);
  });
};

export function useMiniMaxVoice() {
  const { status, setStatus, setTranscript, setAssistantResponse, setError } = useVoiceStore();
  const location = useLocation();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    if (status === 'listening') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstart = () => {
        setStatus('listening');
        setTranscript('');
        setError(null);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        setStatus('processing');

        try {
          // Contextual path
          const routeContext = location.pathname;

          // API Call to MiniMax
          const response = await mockMiniMaxCall(audioBlob, routeContext);

          setAssistantResponse(response.text);
          setStatus('speaking');

          // Simulate speaking duration
          setTimeout(() => {
            setStatus('idle');
          }, 4000);
        } catch (err) {
          console.error('Failed API:', err);
          setError('Erro na comunicação com a IA.');
          setStatus('error');
          setTimeout(() => setStatus('idle'), 3000);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Mic error:', err);
      setError('Acesso ao microfone negado.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [status, location.pathname, setStatus, setTranscript, setError, setAssistantResponse]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  return {
    startListening,
    stopListening,
    toggleListening,
    status,
  };
}
