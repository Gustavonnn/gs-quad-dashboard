import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Mic, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { useVoiceStore } from '@/stores/voiceStore';
import { supabase } from '@/lib/supabase';

const API_KEY = import.meta.env.VITE_MINIMAX_API_KEY;
const RESPONSE_LINGER_MS = 8000;
const ERROR_LINGER_MS = 5000;

const ROUTE_LABELS: Record<string, string> = {
  '/': 'War Room (visão geral)',
  '/war-room': 'War Room',
  '/ads-radar': 'Ads Radar',
  '/estoque': 'Estoque',
  '/curva-abc': 'Curva ABC',
  '/kanban': 'Kanban de Growth',
  '/catalogo': 'Catálogo de Anúncios',
  '/alertas': 'Alertas de IA',
};

const describeRoute = (path: string): string => {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  const match = Object.keys(ROUTE_LABELS).find((p) => p !== '/' && path.startsWith(p));
  return match ? ROUTE_LABELS[match] : path;
};

const getScreenContext = (): string => {
  if (typeof document === 'undefined') return '';
  const main = document.querySelector('main');
  if (!main) return '';
  return (main as HTMLElement).innerText.replace(/\s+/g, ' ').trim().substring(0, 1500);
};

const fetchDbContext = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('gs_anuncios')
      .select('sku, titulo, status, leads, custo')
      .limit(8);
    if (error || !data || data.length === 0) return 'Sem anúncios ativos.';
    return JSON.stringify(data);
  } catch {
    return 'Indisponível.';
  }
};

const buildSystemPrompt = (route: string, screen: string, db: string) => `Você é F.R.I.D.A.Y, uma Inteligência Artificial altamente sofisticada e tática do sistema GS-QUAD. Aja como a IA do Homem de Ferro: elegante, extremamente inteligente, precisa e analítica. Sempre forneça respostas curtas (1-3 frases), diretas, com uma aura de superioridade tecnológica, como uma parceira estratégica. Use sarcasmo sutil se os dados apresentarem problemas óbvios.

Contexto Imediato:
- Rota atual: ${route}
- Tela visualizada: ${screen || 'Sem conteúdo visível relevante.'}
- Dados Ativos em Banco (gs_anuncios): ${db}

Missão: conecte os pontos acima ao comando de voz do usuário e retorne a fala bruta (text-to-speech) que você verbalizará agora. Não use markdown, listas, nem prefixos como "F.R.I.D.A.Y:". Apenas fale.`;

const queryMiniMax = async (text: string, route: string, screen: string, db: string): Promise<string> => {
  if (!API_KEY) throw new Error('Chave MiniMax ausente no .env.');

  const res = await fetch('/api/minimax/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      max_tokens: 180,
      system: buildSystemPrompt(route, screen, db),
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!res.ok) throw new Error(`MiniMax HTTP ${res.status}`);
  const json = await res.json();
  const block = json.content?.find((b: { type: string }) => b.type === 'text');
  return block?.text?.trim() || 'Não consegui processar essa consulta.';
};

const pickVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  if (!voices.length) return null;
  const ptVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('pt'));
  const pool = ptVoices.length ? ptVoices : voices;
  const priority = [
    /francisca/i,
    /thalita/i,
    /maria.*neural/i,
    /microsoft.*neural/i,
    /google.*portug/i,
    /luciana/i,
    /heloisa/i,
    /maria/i,
  ];
  for (const re of priority) {
    const hit = pool.find((v) => re.test(v.name));
    if (hit) return hit;
  }
  return pool.find((v) => v.lang === 'pt-BR') || pool[0] || null;
};

export function FridayOrb() {
  const location = useLocation();
  const routeRef = useRef(location.pathname);
  routeRef.current = location.pathname;

  const store = useVoiceStore();
  const { status, assistantResponse, errorMsg } = store;
  const storeRef = useRef(store);
  storeRef.current = store;

  const [isHovered, setIsHovered] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const idleTimerRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      storeRef.current.setStatus('idle');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(voicesRef.current);
    if (voice) utter.voice = voice;
    utter.lang = voice?.lang || 'pt-BR';
    utter.pitch = 1.15;
    utter.rate = 1.12;
    utter.onstart = () => storeRef.current.setStatus('speaking');
    utter.onend = () => storeRef.current.setStatus('idle');
    utter.onerror = () => storeRef.current.setStatus('idle');
    window.speechSynthesis.speak(utter);
  }, []);

  const handleTranscript = useCallback(async (text: string) => {
    const s = storeRef.current;
    s.setTranscript(text);
    s.setStatus('processing');
    try {
      const [screen, db] = await Promise.all([
        Promise.resolve(getScreenContext()),
        fetchDbContext(),
      ]);
      const answer = await queryMiniMax(text, describeRoute(routeRef.current), screen, db);
      s.setAssistantResponse(answer);
      speak(answer);
    } catch (err: any) {
      s.setError(err?.message || 'Falha na comunicação com o núcleo.');
      s.setStatus('error');
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        storeRef.current.setStatus('idle');
        storeRef.current.setError(null);
      }, ERROR_LINGER_MS);
    }
  }, [speak]);

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => storeRef.current.setStatus('listening');
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript?.trim();
      if (text) handleTranscript(text);
      else storeRef.current.setStatus('idle');
    };
    rec.onerror = (e: any) => {
      isRecordingRef.current = false;
      if (e.error === 'aborted' || e.error === 'no-speech') {
        storeRef.current.setStatus('idle');
        return;
      }
      storeRef.current.setError(`Microfone: ${e.error}`);
      storeRef.current.setStatus('error');
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        storeRef.current.setStatus('idle');
        storeRef.current.setError(null);
      }, ERROR_LINGER_MS);
    };
    rec.onend = () => {
      isRecordingRef.current = false;
    };
    recognitionRef.current = rec;
    return rec;
  }, [handleTranscript]);

  const startRecording = useCallback(() => {
    if (isRecordingRef.current) return;
    const current = storeRef.current.status;
    if (current !== 'idle' && current !== 'error') return;
    const rec = ensureRecognition();
    if (!rec) {
      storeRef.current.setError('Reconhecimento de voz não suportado.');
      storeRef.current.setStatus('error');
      return;
    }
    try {
      isRecordingRef.current = true;
      rec.start();
    } catch {
      isRecordingRef.current = false;
    }
  }, [ensureRecognition]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecordingRef.current) {
      try { recognitionRef.current.stop(); } catch { /* noop */ }
    }
  }, []);

  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!el || !(el as HTMLElement).tagName) return false;
      const target = el as HTMLElement;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (target.isContentEditable) return true;
      return false;
    };

    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isEditable(e.target)) return;
      if (e.code !== 'Space') return;
      const s = storeRef.current.status;
      if (s !== 'idle' && s !== 'error') return;
      e.preventDefault();
      startRecording();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') stopRecording();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* noop */ }
      }
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [startRecording, stopRecording]);

  useEffect(() => {
    if (status !== 'idle' || !assistantResponse) return;
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      storeRef.current.setAssistantResponse('');
    }, RESPONSE_LINGER_MS);
  }, [status, assistantResponse]);

  const handleOrbClick = () => {
    if (status === 'listening') {
      stopRecording();
    } else if (status === 'idle' || status === 'error') {
      startRecording();
    } else if (status === 'speaking') {
      window.speechSynthesis?.cancel();
      storeRef.current.setStatus('idle');
    }
  };

  const isVisible = status !== 'idle' || isHovered || !!assistantResponse;
  const statusColor = {
    idle: 'var(--color-gs-muted)',
    listening: 'var(--color-gs-red)',
    processing: 'var(--color-gs-blue)',
    speaking: 'var(--color-gs-green)',
    error: 'var(--color-gs-red)',
  }[status];

  const icon = (() => {
    if (status === 'processing') return <Loader2 className="animate-spin" />;
    if (status === 'speaking') return <Volume2 className="animate-pulse" />;
    if (status === 'error') return <AlertCircle />;
    return <Mic />;
  })();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="transition-all duration-300 p-4 w-[300px] bg-[var(--color-gs-panel)] border border-[var(--color-gs-border)] rounded shadow-2xl backdrop-blur-md"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <div
          className="font-mono text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-2"
          style={{ color: statusColor }}
        >
          F.R.I.D.A.Y
          {status === 'speaking' && <div className="h-0.5 flex-1 bg-[var(--color-gs-green)]/30 animate-pulse" />}
        </div>

        {status === 'idle' && !assistantResponse && (
          <div className="text-[11px] text-[var(--color-gs-muted)] font-mono">
            Segure <kbd className="px-1 border rounded text-[9px]">ESPAÇO</kbd> ou clique no orbe.
          </div>
        )}
        {status === 'listening' && (
          <div className="flex gap-1 h-3 mt-1 mb-2 items-end">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1.5 bg-[var(--color-gs-red)] animate-bounce"
                style={{ height: `${30 + (i % 3) * 20}%`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}
        {status === 'processing' && (
          <div className="text-[12px] text-[var(--color-gs-blue)] font-mono animate-pulse italic">
            Consultando matriz...
          </div>
        )}
        {(status === 'speaking' || (status === 'idle' && assistantResponse)) && (
          <div className="text-[13px] text-[var(--color-gs-text)] leading-relaxed italic">
            "{assistantResponse}"
          </div>
        )}
        {status === 'error' && (
          <div className="text-[11px] text-[var(--color-gs-red)] font-mono">
            {errorMsg || 'Ocorreu um erro no núcleo.'}
          </div>
        )}
      </div>

      <button
        onClick={handleOrbClick}
        aria-label="Ativar F.R.I.D.A.Y"
        className="w-16 h-16 rounded-full flex items-center justify-center transition-all relative border-2 cursor-pointer hover:scale-105"
        style={{
          background: 'var(--color-gs-panel)',
          borderColor: 'var(--color-gs-green)',
          color: 'var(--color-gs-green)',
          boxShadow: `0 0 20px var(--color-gs-green)`,
          zIndex: 9999999,
          position: 'fixed',
          bottom: '24px',
          right: '24px'
        }}
      >
        {['listening', 'processing', 'speaking'].includes(status) && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20 border-2"
            style={{ borderColor: statusColor }}
          />
        )}
        {icon}
      </button>
    </div>
  );
}

console.log('FridayOrb loaded');
