import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Package,
  Radar,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useLiveMetrics, useIAAlertas, useStockAlerts } from '@/hooks';
import { useAdsRadar } from '@/hooks/useAdsRadar';
import { OperationKPIBar } from '@/components/OperationKPIBar';
import { Sparkline } from '@/components/Sparkline';
import {
  DataPanel,
  EmptyState,
  MetricCard,
  ModuleHeader,
  PageShell,
  StatusBadge,
} from '@/components/dashboard';

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function compact(value: number) {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );
}

function severityTone(severity?: string): 'red' | 'yellow' | 'blue' | 'neutral' {
  if (severity === 'CRITICO') return 'red';
  if (severity === 'ALTO') return 'yellow';
  if (severity === 'MEDIO') return 'blue';
  return 'neutral';
}

export function VisaoGeral() {
  const { data: metricsData, isLoading: metricsLoading } = useLiveMetrics();
  const { data: alertasRaw, isLoading: alertasLoading } = useIAAlertas(80);
  const { data: stockAlertsRaw, isLoading: stockLoading } = useStockAlerts();
  const { summary: adsSummary, loading: adsLoading } = useAdsRadar();

  const metrics = metricsData ?? {
    totalVendas: 0,
    alertasAtivos: 0,
    totalProdutos: 0,
    sparkData: [] as number[],
  };
  const alertas = useMemo(() => alertasRaw ?? [], [alertasRaw]);
  const stockAlerts = useMemo(() => stockAlertsRaw ?? [], [stockAlertsRaw]);

  const criticalAlerts = useMemo(
    () => alertas.filter((alerta) => ['CRITICO', 'ALTO'].includes(alerta.severity ?? '')),
    [alertas]
  );

  const feedLines = useMemo(
    () => [
      { label: 'SUPABASE', text: `${compact(metrics.totalProdutos)} produtos carregados` },
      { label: 'RECEITA', text: `${currency(metrics.totalVendas)} no último corte de vendas` },
      { label: 'ALERTAS', text: `${alertas.length} sinais operacionais ativos` },
      { label: 'ADS', text: `${adsSummary.winners} winners, ${adsSummary.kills} para ação` },
      { label: 'ESTOQUE', text: `${stockAlerts.length} SKUs em ruptura monitorada` },
    ],
    [metrics.totalProdutos, metrics.totalVendas, alertas.length, adsSummary, stockAlerts.length]
  );

  return (
    <PageShell>
      <ModuleHeader
        eyebrow="Operação ativa"
        title="WAR_ROOM"
        accent="INTEL"
        description="Visão executiva do Mercado Livre para diagnóstico rápido, priorização de risco e ação comercial."
        icon={<ShieldCheck size={16} />}
        actions={
          <>
            <Link
              to="/search"
              className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-[var(--color-gs-border)] px-3 text-sm text-[var(--color-gs-text)] hover:bg-[var(--color-gs-hover-overlay)]"
            >
              <Search size={15} />
              Buscar
            </Link>
            <Link
              to="/hub"
              className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[var(--color-gs-blue)] px-3 text-sm font-bold text-white hover:opacity-90"
            >
              OP_HUB
              <ArrowRight size={15} />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receita do dia"
          value={currency(metrics.totalVendas)}
          detail="Última data disponível em live_vendas"
          icon={<TrendingUp size={18} />}
          tone="green"
          progress={Math.min((metrics.totalVendas / 50000) * 100, 100)}
          loading={metricsLoading}
        />
        <MetricCard
          label="Alertas ativos"
          value={alertas.length.toString().padStart(2, '0')}
          detail={`${criticalAlerts.length} críticos ou altos`}
          icon={<AlertTriangle size={18} />}
          tone={criticalAlerts.length > 0 ? 'red' : 'green'}
          progress={Math.min((alertas.length / 80) * 100, 100)}
          loading={alertasLoading}
        />
        <MetricCard
          label="Portfolio Ads"
          value={`${adsSummary.portfolioScore}/100`}
          detail={`${adsSummary.winners} winners | ${adsSummary.monitors} monitor | ${adsSummary.kills} kill`}
          icon={<Radar size={18} />}
          tone={adsSummary.portfolioScore >= 65 ? 'green' : 'yellow'}
          progress={adsSummary.portfolioScore}
          loading={adsLoading}
        />
        <MetricCard
          label="Ruptura"
          value={stockAlerts.length.toString().padStart(2, '0')}
          detail="SKUs sem disponibilidade detectada"
          icon={<Package size={18} />}
          tone={stockAlerts.length > 0 ? 'red' : 'green'}
          progress={Math.min((stockAlerts.length / 30) * 100, 100)}
          loading={stockLoading}
        />
      </div>

      <OperationKPIBar />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <DataPanel
          className="xl:col-span-8"
          title="Receita e pulso operacional"
          eyebrow="Live metrics"
          action={<StatusBadge tone="green">online</StatusBadge>}
          contentClassName="min-h-[300px]"
        >
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
            <div className="min-h-[220px]">
              <Sparkline data={metrics.sparkData} color="var(--color-gs-green)" />
            </div>
            <div className="grid gap-2">
              {feedLines.map((line) => (
                <div
                  key={line.label}
                  className="rounded-[6px] border border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] p-3"
                >
                  <div className="font-mono text-[9px] font-bold text-[var(--color-gs-blue)]">
                    {line.label}
                  </div>
                  <div className="mt-1 text-sm text-[var(--color-gs-text)]">{line.text}</div>
                </div>
              ))}
            </div>
          </div>
        </DataPanel>

        <DataPanel
          className="xl:col-span-4"
          title="Fila de atenção"
          eyebrow="Prioridade"
          action={
            <Link
              to="/monitor"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[var(--color-gs-blue)]"
            >
              Monitor <ArrowRight size={12} />
            </Link>
          }
          contentClassName="space-y-2"
        >
          {alertasLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-[6px] bg-[var(--color-gs-border)]"
                />
              ))}
            </div>
          ) : criticalAlerts.length === 0 ? (
            <EmptyState
              icon={<Activity size={22} />}
              title="Sem alerta crítico"
              description="A fila urgente está limpa neste momento."
            />
          ) : (
            criticalAlerts.slice(0, 7).map((alerta) => (
              <Link
                key={alerta.id}
                to="/monitor"
                className="block rounded-[6px] border border-[var(--color-gs-border)] p-3 hover:bg-[var(--color-gs-hover-overlay)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-xs font-bold text-[var(--color-gs-text)]">
                    {alerta.sku}
                  </span>
                  <StatusBadge tone={severityTone(alerta.severity)}>{alerta.severity}</StatusBadge>
                </div>
                <p className="mt-2 truncate text-xs text-[var(--color-gs-muted)]">
                  {alerta.tipo_alerta || alerta.descricao || 'Alerta operacional'}
                </p>
              </Link>
            ))
          )}
        </DataPanel>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DataPanel
          title="Ads Radar"
          eyebrow="Winners / monitor / kill"
          action={
            <Link
              to="/ads-radar"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[var(--color-gs-blue)]"
            >
              Abrir <ArrowRight size={12} />
            </Link>
          }
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'WINNERS', value: adsSummary.winners, tone: 'green' as const },
              { label: 'MONITOR', value: adsSummary.monitors, tone: 'yellow' as const },
              { label: 'KILL', value: adsSummary.kills, tone: 'red' as const },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[6px] border border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] p-4 text-center"
              >
                <StatusBadge tone={item.tone}>{item.label}</StatusBadge>
                <div className="mt-3 font-heading text-3xl font-black text-[var(--color-gs-text)]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </DataPanel>

        <DataPanel
          title="Ruptura de estoque"
          eyebrow="Ação rápida"
          action={
            <StatusBadge tone={stockAlerts.length > 0 ? 'red' : 'green'}>
              {stockAlerts.length}
            </StatusBadge>
          }
        >
          {stockLoading ? (
            <div className="h-24 animate-pulse rounded-[6px] bg-[var(--color-gs-border)]" />
          ) : stockAlerts.length === 0 ? (
            <EmptyState
              icon={<Package size={22} />}
              title="Estoque sem ruptura"
              description="Nenhum SKU zerado apareceu na amostra atual."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {stockAlerts.slice(0, 6).map((item) => (
                <Link
                  key={item.sku}
                  to={`/terminal?sku=${item.sku}`}
                  className="rounded-[6px] border border-[var(--color-gs-border)] p-3 hover:bg-[var(--color-gs-hover-overlay)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--color-gs-text)]">
                      {item.sku}
                    </span>
                    <StatusBadge tone="red">zero</StatusBadge>
                  </div>
                  <p className="mt-2 truncate text-xs text-[var(--color-gs-muted)]">
                    {item.titulo}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </DataPanel>
      </div>

      <DataPanel
        title="Mapa de módulos"
        eyebrow="Próximas ações"
        contentClassName="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            to: '/terminal',
            label: 'Terminal DB',
            icon: BarChart3,
            text: 'SKU, MLB, forecast e notas',
          },
          {
            to: '/conversion',
            label: 'Conversion Radar',
            icon: Activity,
            text: 'Taxa de conversão e diagnóstico',
          },
          {
            to: '/stock-ads',
            label: 'Stock Ads',
            icon: Package,
            text: 'Quadrantes estoque x investimento',
          },
          {
            to: '/hidden-potential',
            label: 'Potencial',
            icon: TrendingUp,
            text: 'Estoque parado e receita oculta',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-[6px] border border-[var(--color-gs-border)] bg-[var(--color-gs-bg)] p-4 hover:bg-[var(--color-gs-hover-overlay)]"
            >
              <Icon size={18} className="text-[var(--color-gs-blue)]" />
              <div className="mt-3 font-heading text-sm font-extrabold uppercase text-[var(--color-gs-text)]">
                {item.label}
              </div>
              <p className="mt-1 text-xs text-[var(--color-gs-muted)]">{item.text}</p>
            </Link>
          );
        })}
      </DataPanel>
    </PageShell>
  );
}
