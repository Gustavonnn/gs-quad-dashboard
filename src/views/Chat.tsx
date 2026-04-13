import { useState, useEffect, useRef } from 'react'
import { useMensagens, sendMessage } from '../hooks/useSupabaseData'

export function Chat() {
  const { data, loading, refetch } = useMensagens()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data])

  useEffect(() => {
    const interval = setInterval(() => refetch(), 3000)
    return () => clearInterval(interval)
  }, [refetch])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    await sendMessage(text)
    setSending(false)
    refetch()
  }

  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-120px)] animate-fade-in">
      <div className="flex flex-col gap-1 mb-2 shrink-0">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          MÓDULO DE INTELIGÊNCIA: <span className="text-gs-green">CLAUDE AI</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">INTERFACE NEURAL — CLAUDE 3.5 SONNET</p>
      </div>

      <div className="flex-1 flex flex-col bg-gs-bg border border-gs-border rounded-sm shadow-xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* AI Welcome */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-gs-green rounded-sm flex items-center justify-center text-xs font-bold text-black shrink-0 font-display shadow-[0_0_15px_rgba(0,255,102,0.2)]">
              AI
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gs-green font-mono font-bold tracking-widest uppercase">SQUAD_AI</span>
                <span className="w-1 h-1 rounded-full bg-gs-green animate-pulse"></span>
              </div>
              <div className="text-sm text-gs-text/90 leading-relaxed font-inter bg-gs-panel border border-gs-border/50 p-4 rounded-r-md rounded-bl-md inline-block">
                Conexão estabelecida. Terminal neural ativo. Como posso auxiliar a equipe operacional?
              </div>
            </div>
          </div>

          {data.map((msg) => {
            const isUser = msg.role === 'user'
            const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-xs font-bold shrink-0 font-display ${
                  isUser 
                    ? 'bg-gs-text text-gs-bg shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'bg-gs-green text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                }`}>
                  {isUser ? 'OP' : 'AI'}
                </div>
                <div className={`flex-1 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gs-muted font-mono tracking-widest uppercase">
                      {isUser ? 'OPERADOR' : 'SQUAD_AI'} · {time}
                    </span>
                  </div>
                  <div className={`text-sm leading-relaxed font-inter p-4 inline-block ${
                    isUser 
                      ? 'text-gs-bg bg-gs-text rounded-l-md rounded-br-md font-medium' 
                      : 'text-gs-text/90 bg-gs-panel border border-gs-border/50 rounded-r-md rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-gs-panel border-t border-gs-border flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua requisição ou comando tático..."
            className="flex-1 bg-gs-bg border border-gs-border text-gs-text text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green/50 placeholder-gs-muted/50 font-mono transition-all"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-6 py-3 bg-gs-green text-black text-xs font-bold font-mono tracking-widest uppercase rounded-sm hover:bg-gs-green/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(0,255,102,0.15)]"
          >
            {sending ? '...' : 'ENVIAR'}
          </button>
        </div>
      </div>
    </div>
  )
}