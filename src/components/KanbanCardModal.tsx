import { useState } from 'react';
import { type KanbanCard } from '@/hooks';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Zap, Brain, Edit3, Tag } from 'lucide-react';

interface KanbanCardModalProps {
  card: KanbanCard | null;
  open: boolean;
  onClose: () => void;
  onTrigger: (cardId: string) => void;
  onSaveBriefing: (cardId: string, briefingData: Record<string, unknown>) => void;
  onSaveManual: (cardId: string, manualData: Record<string, unknown>) => void;
}

export function KanbanCardModal({
  card,
  open,
  onClose,
  onTrigger,
  onSaveBriefing: _onSaveBriefing,
  onSaveManual: _onSaveManual,
}: KanbanCardModalProps) {
  const [activeTab, setActiveTab] = useState<'briefing' | 'manual'>('briefing');

  if (!card) return null;

  const briefing = card.briefing_data;
  const wf = briefing?.winning_formula;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o && onClose ? onClose() : null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <DialogTitle className="font-mono text-sm font-bold text-[var(--color-gs-green)]">
              {card.sku ?? 'NO_SKU'}
            </DialogTitle>
            <Badge variant={card.type === 'hybrid' ? 'secondary' : 'warning'}>
              {card.type === 'hybrid' ? (
                <span className="flex items-center gap-1">
                  <Brain size={10} /> HYBRID
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap size={10} /> MANUAL
                </span>
              )}
            </Badge>
          </div>
        </div>
        {card.categoria && (
          <div className="flex items-center gap-1 mb-3">
            <Tag size={10} className="text-[var(--color-gs-muted)]" />
            <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">
              {card.categoria}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--color-gs-border)] pb-0 -mt-2">
          {[
            { id: 'briefing', label: 'Briefing', icon: Brain },
            { id: 'manual', label: 'Dados Manuais', icon: Edit3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'briefing' | 'manual')}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-xs font-bold tracking-wider uppercase border-b-2 -mb-px transition-all ${
                activeTab === id
                  ? 'border-[var(--color-gs-green)] text-[var(--color-gs-green)]'
                  : 'border-transparent text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)]'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Briefing Tab */}
        {activeTab === 'briefing' && (
          <div className="space-y-4">
            {!briefing ? (
              <div className="text-center py-8">
                <Brain size={32} className="text-[var(--color-gs-muted)] mx-auto mb-3 opacity-30" />
                <p className="font-mono text-xs text-[var(--color-gs-muted)]">
                  Briefing ainda não gerado.
                </p>
                <Button onClick={() => onTrigger(card.id)} className="mt-4 gap-2" size="sm">
                  <Zap size={12} />
                  Acionar Análise
                </Button>
              </div>
            ) : (
              <>
                {/* Winning Formula */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[10px] font-bold tracking-widest text-[var(--color-gs-green)] uppercase">
                    Winning Formula
                  </h4>

                  <div className="bg-[var(--color-gs-bg)] border border-[var(--color-gs-border)] rounded-md p-4 space-y-3">
                    {wf?.sugestao_titulo && (
                      <div>
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                          Título Sugerido
                        </div>
                        <div className="font-mono text-xs text-[var(--color-gs-text)]">
                          {wf.sugestao_titulo}
                        </div>
                      </div>
                    )}

                    {wf?.descricao_template && (
                      <div>
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                          Descrição
                        </div>
                        <div className="font-mono text-xs text-[var(--color-gs-text)] leading-relaxed">
                          {wf.descricao_template}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                          Preço Atual
                        </div>
                        <div className="font-mono text-sm font-bold text-[var(--color-gs-text)]">
                          {wf?.preco_atual ? `R$ ${wf.preco_atual.toFixed(2)}` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                          Preço Recomendado
                        </div>
                        <div className="font-mono text-sm font-bold text-[var(--color-gs-green)]">
                          {wf?.preco_recomendado ? `R$ ${wf.preco_recomendado.toFixed(2)}` : '—'}
                        </div>
                      </div>
                    </div>

                    {wf?.elasticidade !== null && wf?.elasticidade !== undefined && (
                      <div>
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                          Elasticidade
                        </div>
                        <div className="font-mono text-xs font-bold text-[var(--color-gs-yellow)]">
                          ε = {wf.elasticidade.toFixed(2)}
                          <span className="text-[var(--color-gs-muted)] ml-2 font-normal">
                            ({wf.elasticidade_class ?? '—'})
                          </span>
                        </div>
                      </div>
                    )}

                    {wf?.tags_usadas && wf.tags_usadas.length > 0 && (
                      <div>
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                          Tags
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {wf.tags_usadas.map((tag: string) => (
                            <span
                              key={tag}
                              className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-[var(--color-gs-border)] text-[var(--color-gs-muted)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resultado Esperado */}
                {wf?.resultado_esperado && (
                  <div className="space-y-2">
                    <h4 className="font-mono text-[10px] font-bold tracking-widest text-[var(--color-gs-muted)] uppercase">
                      Resultado Esperado
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[var(--color-gs-bg)] border border-[var(--color-gs-border)] rounded-md p-3 text-center">
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest">
                          Meta
                        </div>
                        <div className="font-mono text-sm font-bold text-[var(--color-gs-green)] mt-1">
                          R$ {(wf.resultado_esperado.meta_receita ?? 0).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="bg-[var(--color-gs-bg)] border border-[var(--color-gs-border)] rounded-md p-3 text-center">
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest">
                          Unidades
                        </div>
                        <div className="font-mono text-sm font-bold text-[var(--color-gs-text)] mt-1">
                          {wf.resultado_esperado.meta_unidades ?? 0}
                        </div>
                      </div>
                      <div className="bg-[var(--color-gs-bg)] border border-[var(--color-gs-border)] rounded-md p-3 text-center">
                        <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest">
                          Prazo
                        </div>
                        <div className="font-mono text-sm font-bold text-[var(--color-gs-text)] mt-1">
                          {wf.resultado_esperado.prazo_avaliacao ?? '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {briefing?.metadata && (
                  <div className="flex items-center gap-4 pt-2 border-t border-[var(--color-gs-border)]">
                    <span className="font-mono text-[9px] text-[var(--color-gs-muted)]">
                      SKU: {briefing.metadata.sku}
                    </span>
                    {briefing.metadata.categoria && (
                      <span className="font-mono text-[9px] text-[var(--color-gs-muted)]">
                        Cat: {briefing.metadata.categoria}
                      </span>
                    )}
                    <span className="font-mono text-[9px] text-[var(--color-gs-muted)]">
                      v{briefing.metadata.pipeline_version}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            {!card.manual_data ? (
              <div className="text-center py-8">
                <Edit3 size={32} className="text-[var(--color-gs-muted)] mx-auto mb-3 opacity-30" />
                <p className="font-mono text-xs text-[var(--color-gs-muted)]">
                  Dados manuais não preenchidos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {card.manual_data?.titulo && (
                  <div>
                    <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                      Título
                    </div>
                    <div className="font-mono text-xs text-[var(--color-gs-text)]">
                      {card.manual_data.titulo}
                    </div>
                  </div>
                )}
                {card.manual_data?.descricao && (
                  <div>
                    <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                      Descrição
                    </div>
                    <div className="font-mono text-xs text-[var(--color-gs-text)] leading-relaxed">
                      {card.manual_data.descricao}
                    </div>
                  </div>
                )}
                {card.manual_data?.preco && (
                  <div>
                    <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                      Preço
                    </div>
                    <div className="font-mono text-sm font-bold text-[var(--color-gs-green)]">
                      R$ {card.manual_data.preco.toFixed(2)}
                    </div>
                  </div>
                )}
                {(card.manual_data?.tags?.length ?? 0) > 0 && (
                  <div>
                    <div className="font-mono text-[9px] text-[var(--color-gs-muted)] uppercase tracking-widest mb-1">
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {card.manual_data?.tags?.map((tag: string) => (
                        <span
                          key={tag}
                          className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-[var(--color-gs-border)] text-[var(--color-gs-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
