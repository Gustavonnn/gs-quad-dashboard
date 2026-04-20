import { create } from 'zustand';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface VoiceState {
  status: VoiceStatus;
  transcript: string;
  assistantResponse: string;
  errorMsg: string | null;

  setStatus: (status: VoiceStatus) => void;
  setTranscript: (text: string) => void;
  setAssistantResponse: (text: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  status: 'idle',
  transcript: '',
  assistantResponse: '',
  errorMsg: null,

  setStatus: (status) => set({ status }),
  setTranscript: (transcript) => set({ transcript }),
  setAssistantResponse: (assistantResponse) => set({ assistantResponse }),
  setError: (errorMsg) => set({ errorMsg }),
  reset: () =>
    set({
      status: 'idle',
      transcript: '',
      assistantResponse: '',
      errorMsg: null,
    }),
}));
