import { useEffect, useState } from 'react';
import { Mic, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { useVoiceStore } from '@/stores/voiceStore';
import { useMiniMaxVoice } from '@/hooks/useMiniMaxVoice';

export function VoiceCore() {
  const { status, assistantResponse, errorMsg } = useVoiceStore();
  const { startListening, stopListening } = useMiniMaxVoice();
  const [isHovered, setIsHovered] = useState(false);

  // Push to talk event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when typing on inputs
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      )
        return;

      if (e.code === 'Space' && status === 'idle') {
        e.preventDefault();
        startListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && status === 'listening') {
        e.preventDefault();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status, startListening, stopListening]);

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'var(--color-gs-muted)';
      case 'listening':
        return 'var(--color-gs-red)';
      case 'processing':
        return 'var(--color-gs-blue)';
      case 'speaking':
        return 'var(--color-gs-green)';
      case 'error':
        return 'var(--color-gs-red)';
      default:
        return 'var(--color-gs-muted)';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Mic size={20} />;
      case 'listening':
        return <Mic size={20} className="animate-pulse" />;
      case 'processing':
        return <Loader2 size={20} className="animate-spin" />;
      case 'speaking':
        return <Volume2 size={20} className="animate-pulse" />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <Mic size={20} />;
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dialog Bubble Window */}
      <div
        className={`transition-all duration-300 ease-out flex flex-col p-4 w-[280px]`}
        style={{
          background: 'var(--color-gs-panel)',
          border: '1px solid var(--color-gs-border)',
          borderRadius: '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          opacity: status !== 'idle' || isHovered ? 1 : 0,
          transform:
            status !== 'idle' || isHovered
              ? 'translateY(0) scale(1)'
              : 'translateY(10px) scale(0.95)',
          pointerEvents: status !== 'idle' || isHovered ? 'auto' : 'none',
        }}
      >
        <div
          className="font-mono text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2"
          style={{ color: getStatusColor() }}
        >
          F.R.I.D.A.Y
          {status === 'speaking' && (
            <div className="h-1 flex-1 bg-[var(--color-gs-green)]/20 animate-pulse rounded" />
          )}
        </div>

        {status === 'idle' && (
          <div className="text-[12px] text-[var(--color-gs-muted)] font-mono leading-relaxed">
            Segure a{' '}
            <kbd className="px-1 py-0.5 rounded border border-[var(--color-gs-border)] text-[9px] mx-1">
              ESPAÇO
            </kbd>{' '}
            para falar.
          </div>
        )}

        {status === 'listening' && (
          <div className="flex gap-1 items-end h-4 mt-2 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-2 bg-[var(--color-gs-red)] animate-bounce"
                style={{ height: `${20 + i * 15}%`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        )}

        {status === 'processing' && (
          <div className="text-[12px] text-[var(--color-gs-blue)] font-mono leading-relaxed animate-pulse">
            Analisando via MiniMax...
          </div>
        )}

        {status === 'speaking' && (
          <div className="text-[13px] text-[var(--color-gs-text)] font-sans leading-relaxed">
            {assistantResponse}
          </div>
        )}

        {status === 'error' && (
          <div className="text-[12px] text-[var(--color-gs-red)] font-mono leading-relaxed">
            {errorMsg}
          </div>
        )}
      </div>

      {/* The Core Button */}
      <button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={stopListening}
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative group outline-none"
        style={{
          background: 'var(--color-gs-deep)',
          border: `2px solid ${getStatusColor()}`,
          color: getStatusColor(),
          boxShadow: `0 0 ${status === 'idle' ? '10px' : '20px'} ${getStatusColor()}33`,
        }}
        aria-label="F.R.I.D.A.Y Voice Core"
      >
        {/* Core glow animation */}
        {(status === 'listening' || status === 'speaking' || status === 'processing') && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ border: `2px solid ${getStatusColor()}` }}
          />
        )}
        {getStatusIcon()}
      </button>
    </div>
  );
}
