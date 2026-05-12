import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ClipboardList,
  Command,
  Minus,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Sparkline } from '@/components/Sparkline';
import { MLBNotesDrawer } from '@/components/MLBNotesDrawer';
import {
  DataPanel,
  EmptyState,
  MetricCard,
  ModuleHeader,
  PageShell,
  StatusBadge,
} from '@/components/dashboard';

type SalesFilter = 'ALL' | 'UP' | 'DOWN' | 'STABLE';

interface HubProduct {
  mlb: string;
  sku: string;
  titulo: string;
  receita7d: number;
  variacaoD1: number;
  variacaoD7: number;
  sparkData: number[];
}

interface HubAlert {
  id: string;
  sku: string;
  tipo_alerta?: string | null;
  severidade?: string | null;
  descricao?: string | null;
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function shortCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizeSeverity(value?: string | null) {
  return String(value || 'BAIXO')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
}

function VariationBadge({ value }: { value: number }) {
  const tone = value > 5 ? 'green' : value < -5 ? 'red' : 'neutral';
  const Icon = value > 5 ? TrendingUp : value < -5 ? TrendingDown : Minus;

  return (
    <StatusBadge tone={tone}>
      <Icon size={10} className="mr-1" />
      {value >= 0 ? '+' : ''}
      {value.toFixed(1)}%
    </StatusBadge>
  );
}

function ProductRow({
  product,
  onOpen,
  onNote,
}: {
  product: HubProduct;
  onOpen: () => void;
  onNote: () => void;
}) {
  const trendColor =
    product.variacaoD7 > 5
      ? 'var(--color-gs-green)'
      : product.variacaoD7 < -5
        ? 'var(--color-gs-red)'
        : 'var(--color-gs-blue)';

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--color-gs-border)] p-3 last:border-0 hover:bg-[var(--color-gs-hover-overlay)]">
      <button className="min-w-0 text-left" onClick={onOpen}>
        <div className="truncate font-mono text-xs font-bold text-[var(--color-gs-text)]">
          {product.titulo || product.sku}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">{product.sku}</span>
          <VariationBadge value={product.variacaoD1} />
          <VariationBadge value={product.variacaoD7} />
          <span className="font-mono text-[10px] font-bold text-[var(--color-gs-blue)]">
            {shortCurrency(product.receita7d)}
          </span>
        </div>
      </button>
      <div className="flex items-center gap-2">
        <div className="hidden h-9 w-24 sm:block">
          <Sparkline
            data={product.sparkData}
            color={trendColor}
            gradientId={`hub-${product.mlb}`}
            showGrid={false}
          />
        </div>
        <button
          aria-label={`Anotar ${product.sku}`}
          onClick={onNote}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--color-gs-border)] text-[var(--color-gs-muted)] hover:text-[var(--color-gs-blue)]"
        >
          <ClipboardList size={14} />
        </button>
      </div>
    </div>
  );
}

export function OperationHub() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SalesFilter>('ALL');
  const [drawerMlb, setDrawerMlb] = useState<{ mlb: string; sku: string } | null>(null);

  const { data: alertasRaw, isLoading: alertasLoading } = useQuery({
    queryKey: ['ia-alertas-hub'],
    queryFn: async (): Promise<HubAlert[]> => {
      const { data, error } = await supabase
        .from('ia_alertas_operacionais')
        .select('id, sku, tipo_alerta, severidade, descricao')
        .not('status', 'in', '(RESOLVIDO,IGNORADO,CONCLUIDO,CONCLUÍDO)')
        .order('data_registro', { ascending: false })
        .limit(80);

      if (error) throw error;
      return (data ?? []) as HubAlert[];
    },
    staleTime: 60_000,
  });

  const { data: hubProducts, isLoading } = useQuery({
    queryKey: ['operation-hub-products'],
    queryFn: async (): Promise<HubProduct[]> => {
      const { data: produtos, error: produtosError } = await supabase
        .from('live_produtos')
        .select('item_id, sku, titulo')
        .limit(300);

      if (produtosError) throw produtosError;
      if (!produtos || produtos.length === 0) return [];

      const skus = produtos.map((p) => String(p.sku || '')).filter(Boolean);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: vendas, error: vendasError } = await supabase
        .from('live_vendas')
        .select('sku, receita_total, data_venda')
        .in('sku', skus)
        .gte('data_venda', fourteenDaysAgo.toISOString())
        .order('data_venda', { ascending: true });

      if (vendasError) throw vendasError;

      const now = Date.now();
      const msPerDay = 86400000;
      const skuToItem = new Map<string, (typeof produtos)[number]>();
      const byMlb = new Map<
        string,
        {
          prod: (typeof produtos)[number];
          today: number;
          yesterday: number;
          week: number;
          prevWeek: number;
          dailyData: Map<number, number>;
        }
      >();

      for (const product of produtos) {
        const sku = String(product.sku || '');
        const mlb = String(product.item_id || sku);
        skuToItem.set(sku, product);
        byMlb.set(mlb, {
          prod: product,
          today: 0,
          yesterday: 0,
          week: 0,
          prevWeek: 0,
          dailyData: new Map(),
        });
      }

      for (const venda of vendas ?? []) {
        const prod = skuToItem.get(String(venda.sku || ''));
        if (!prod) continue;
        const mlb = String(prod.item_id || prod.sku);
        const entry = byMlb.get(mlb);
        if (!entry) continue;

        const age = now - new Date(String(venda.data_venda)).getTime();
        const dayIndex = Math.floor(age / msPerDay);
        const receita = Number(venda.receita_total) || 0;

        if (dayIndex === 0) entry.today += receita;
        if (dayIndex === 1) entry.yesterday += receita;
        if (dayIndex < 7) {
          entry.week += receita;
          entry.dailyData.set(6 - dayIndex, (entry.dailyData.get(6 - dayIndex) ?? 0) + receita);
        }
        if (dayIndex >= 7 && dayIndex < 14) entry.prevWeek += receita;
      }

      return Array.from(byMlb.entries())
        .map(([mlb, entry]) => ({
          mlb,
          sku: String(entry.prod.sku || ''),
          titulo: String(entry.prod.titulo || ''),
          receita7d: entry.week,
          variacaoD1:
            entry.yesterday > 0 ? ((entry.today - entry.yesterday) / entry.yesterday) * 100 : 0,
          variacaoD7:
            entry.prevWeek > 0 ? ((entry.week - entry.prevWeek) / entry.prevWeek) * 100 : 0,
          sparkData: Array.from({ length: 7 }, (_, index) => entry.dailyData.get(index) ?? 0),
        }))
        .sort((a, b) => b.receita7d - a.receita7d);
    },
    staleTime: 60_000,
  });

  const products = useMemo(() => hubProducts ?? [], [hubProducts]);
  const alertas = useMemo(() => alertasRaw ?? [], [alertasRaw]);

  const filtered = useMemo(() => {
    if (filter === 'UP') return products.filter((product) => product.variacaoD7 > 5);
    if (filter === 'DOWN') return products.filter((product) => product.variacaoD7 < -5);
    if (filter === 'STABLE') {
      return products.filter((product) => product.variacaoD7 >= -5 && product.variacaoD7 <= 5);
    }
    return products;
  }, [products, filter]);

  const criticalAlerts = useMemo(
    () =>
      alertas.filter((alerta) => {
        const sev = normalizeSeverity(alerta.severidade);
        return sev === 'CRITICO' || sev === 'ALTO';
      }),
    [alertas]
  );

  const opportunityAlerts = useMemo(
    () => alertas.filter((alerta) => normalizeSeverity(alerta.severidade) === 'BAIXO'),
    [alertas]
  );

  const totalRevenue = products.reduce((sum, product) => sum + product.receita7d, 0);
  const growing = products.filter((product) => product.variacaoD7 > 5).length;
  const falling = products.filter((product) => product.variacaoD7 < -5).length;
  const top5 = products.slice(0, 5);
  const bottom5 = [...products].sort((a, b) => a.receita7d - b.receita7d).slice(0, 5);

  return (
    <PageShell>
      <ModuleHeader
        eyebrow="Central de comando"
        title="OP_HUB"
        accent="LIVE"
        description="Termômetro de vendas, alerta operacional e ranking de ação por SKU."
        icon={<Command size={16} />}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receita 7 dias"
          value={currency(totalRevenue)}
          detail={`${products.length} MLBs analisados`}
          icon={<TrendingUp size={18} />}
          tone="green"
          progress={Math.min((totalRevenue / 250000) * 100, 100)}
          loading={isLoading}
        />
        <MetricCard
          label="Em alta"
          value={growing}
          detail="Variação D-7 acima de 5%"
          icon={<Zap size={18} />}
          tone="green"
          progress={products.length ? (growing / products.length) * 100 : 0}
          loading={isLoading}
        />
        <MetricCard
          label="Em queda"
          value={falling}
          detail="Variação D-7 abaixo de -5%"
          icon={<TrendingDown size={18} />}
          tone={falling > 0 ? 'red' : 'neutral'}
          progress={products.length ? (falling / products.length) * 100 : 0}
          loading={isLoading}
        />
        <MetricCard
          label="Alertas críticos"
          value={criticalAlerts.length}
          detail={`${opportunityAlerts.length} oportunidades leves`}
          icon={<AlertTriangle size={18} />}
          tone={criticalAlerts.length > 0 ? 'red' : 'green'}
          progress={Math.min((criticalAlerts.length / 30) * 100, 100)}
          loading={alertasLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <DataPanel
          className="xl:col-span-6"
          title="Termômetro de vendas"
          eyebrow="MLB performance"
          contentClassName="p-0"
          action={
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: 'ALL', label: 'Todos' },
                { key: 'UP', label: 'Alta' },
                { key: 'DOWN', label: 'Queda' },
                { key: 'STABLE', label: 'Estável' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as SalesFilter)}
                  className="h-7 rounded-[5px] px-2 font-mono text-[9px] font-bold uppercase"
                  style={{
                    background: filter === item.key ? 'var(--color-gs-blue)' : 'var(--color-gs-bg)',
                    color: filter === item.key ? '#fff' : 'var(--color-gs-muted)',
                    border: '1px solid var(--color-gs-border)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="max-h-[620px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-[6px] bg-[var(--color-gs-border)]"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<PackageCheck size={22} />}
                  title="Sem dados no filtro"
                  description="Troque o modo do termômetro para ver outros SKUs."
                />
              </div>
            ) : (
              filtered.map((product) => (
                <ProductRow
                  key={product.mlb}
                  product={product}
                  onOpen={() => navigate(`/terminal?sku=${product.sku}&mlb=${product.mlb}`)}
                  onNote={() => setDrawerMlb({ mlb: product.mlb, sku: product.sku })}
                />
              ))
            )}
          </div>
        </DataPanel>

        <DataPanel
          className="xl:col-span-3"
          title="Alertas e oportunidades"
          eyebrow="Fila operacional"
          contentClassName="space-y-3"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <StatusBadge tone="red">piorando</StatusBadge>
              <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">
                {criticalAlerts.length}
              </span>
            </div>
            <div className="space-y-2">
              {criticalAlerts.length === 0 ? (
                <EmptyState title="Fila crítica limpa" />
              ) : (
                criticalAlerts.slice(0, 7).map((alerta) => (
                  <button
                    key={alerta.id}
                    onClick={() => navigate('/monitor')}
                    className="block w-full rounded-[6px] border border-[var(--color-gs-border)] p-3 text-left hover:bg-[var(--color-gs-hover-overlay)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-bold text-[var(--color-gs-text)]">
                        {alerta.sku}
                      </span>
                      <StatusBadge
                        tone={normalizeSeverity(alerta.severidade) === 'CRITICO' ? 'red' : 'yellow'}
                      >
                        {normalizeSeverity(alerta.severidade)}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 truncate text-xs text-[var(--color-gs-muted)]">
                      {alerta.tipo_alerta || alerta.descricao}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-[var(--color-gs-border)] pt-3">
            <div className="mb-2 flex items-center justify-between">
              <StatusBadge tone="green">oportunidade</StatusBadge>
              <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">
                {opportunityAlerts.length}
              </span>
            </div>
            <div className="space-y-2">
              {opportunityAlerts.slice(0, 4).map((alerta) => (
                <button
                  key={alerta.id}
                  onClick={() => navigate(`/terminal?sku=${alerta.sku}`)}
                  className="block w-full rounded-[6px] border border-[var(--color-gs-border)] p-3 text-left hover:bg-[var(--color-gs-hover-overlay)]"
                >
                  <div className="font-mono text-xs font-bold text-[var(--color-gs-text)]">
                    {alerta.sku}
                  </div>
                  <p className="mt-2 truncate text-xs text-[var(--color-gs-muted)]">
                    {alerta.tipo_alerta || alerta.descricao}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </DataPanel>

        <DataPanel
          className="xl:col-span-3"
          title="Ranking 7 dias"
          eyebrow="Top e bottom"
          contentClassName="space-y-4"
        >
          <div>
            <StatusBadge tone="green">top 5</StatusBadge>
            <div className="mt-2 space-y-2">
              {top5.map((product, index) => (
                <button
                  key={product.mlb}
                  onClick={() => navigate(`/terminal?sku=${product.sku}&mlb=${product.mlb}`)}
                  className="grid w-full grid-cols-[28px_1fr_auto] items-center gap-2 rounded-[6px] border border-[var(--color-gs-border)] p-2 text-left hover:bg-[var(--color-gs-hover-overlay)]"
                >
                  <span className="font-heading text-lg font-black text-[var(--color-gs-green)]">
                    {index + 1}
                  </span>
                  <span className="truncate font-mono text-[11px] font-bold text-[var(--color-gs-text)]">
                    {product.sku}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-gs-green)]">
                    {shortCurrency(product.receita7d)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-gs-border)] pt-4">
            <StatusBadge tone="red">bottom 5</StatusBadge>
            <div className="mt-2 space-y-2">
              {bottom5.map((product, index) => (
                <button
                  key={product.mlb}
                  onClick={() => navigate(`/terminal?sku=${product.sku}&mlb=${product.mlb}`)}
                  className="grid w-full grid-cols-[28px_1fr_auto] items-center gap-2 rounded-[6px] border border-[var(--color-gs-border)] p-2 text-left hover:bg-[var(--color-gs-hover-overlay)]"
                >
                  <span className="font-heading text-lg font-black text-[var(--color-gs-red)]">
                    {index + 1}
                  </span>
                  <span className="truncate font-mono text-[11px] font-bold text-[var(--color-gs-text)]">
                    {product.sku}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-gs-red)]">
                    {shortCurrency(product.receita7d)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </DataPanel>
      </div>

      {drawerMlb && (
        <MLBNotesDrawer
          mlb={drawerMlb.mlb}
          sku={drawerMlb.sku}
          open={!!drawerMlb}
          onClose={() => setDrawerMlb(null)}
        />
      )}
    </PageShell>
  );
}
