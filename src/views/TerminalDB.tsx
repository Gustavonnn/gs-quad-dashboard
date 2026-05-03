import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTerminalData } from '@/hooks';
import type { TerminalSkuItem } from '../types/terminal';
import {
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  ReferenceDot,
  ReferenceArea,
} from 'recharts';
import { Box, Package, Activity, TrendingUp, TrendingDown, Search, AlertTriangle, Zap, BarChart3, Eye, BookMarked } from 'lucide-react';
import { SKUNotesPanel } from '@/components/SKUNotesPanel';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const ABC_COLORS: Record<string, string> = {
  A: 'text-gs-green border-gs-green/30 bg-gs-green/5',
  B: 'text-gs-blue border-gs-blue/30 bg-gs-blue/5',
  C: 'text-gs-text border-gs-border/50 bg-gs-panel',
};

interface TerminalDBProps {
  preSelectedSkuId?: string | null;
}

export function TerminalDB({ preSelectedSkuId }: TerminalDBProps) {
  const [searchParams] = useSearchParams();
  const urlSku = searchParams.get('sku');
  const urlMlb = searchParams.get('mlb');

  const { data, isLoading: loading, error } = useTerminalData();
  const [selectedSku, setSelectedSku] = useState<TerminalSkuItem | null>(null);
  const [selectedMlbId, setSelectedMlbId] = useState<string | null>(null);
  const [search, setSearch] = useState(urlSku || '');
  const [filterClass, setFilterClass] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [showComparative, setShowComparative] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  const filteredData = useMemo(() => {
    return (data ?? []).filter((item) => {
      const matchSearch =
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.title.toLowerCase().includes(search.toLowerCase());
      const matchClass = filterClass === 'ALL' || item.abc_class === filterClass;
      return matchSearch && matchClass;
    });
  }, [data, search, filterClass]);

  // Set initial selected item when data loads or URL params change
  useEffect(() => {
    if (!data || data.length === 0) return;

    const targetSkuId = urlSku || preSelectedSkuId;

    if (targetSkuId) {
      const target = data.find((item) => item.sku === targetSkuId);
      if (target) {
        Promise.resolve().then(() => {
          setSelectedSku(target);
          if (urlMlb) {
            setSelectedMlbId(urlMlb);
          } else {
            setSelectedMlbId(null);
          }
          setSearch(target.sku);
        });
        return;
      }
    }

    // Default selection if no deep link
    if (!selectedSku && filteredData.length > 0) {
      Promise.resolve().then(() => {
        setSelectedSku(filteredData[0]);
        setSelectedMlbId(null);
      });
    }
  }, [data, urlSku, urlMlb, preSelectedSkuId, filteredData, selectedSku]);

  // Handle SKU switch from manual list click
  const handleSkuSelect = (item: TerminalSkuItem) => {
    setSelectedSku(item);
    setSelectedMlbId(null);
  };

  const chartInfo = useMemo(() => {
    if (!selectedSku) return { data: [], label: 'NENHUM DADO' };

    if (selectedMlbId) {
      const mlb = selectedSku.mlbs.find((m) => m.mlb_id === selectedMlbId);
      if (mlb) return { data: mlb.chartData, label: `FILTRO: ${mlb.mlb_id}` };
    }

    return { data: selectedSku.chartData, label: 'VELOCIDADE AGREGADA SKU' };
  }, [selectedSku, selectedMlbId]);

  // Stockout markers: convert ISO dates ("2026-05-01") → chart format ("01/05")
  const stockoutMarkers = useMemo(() => {
    if (!selectedSku?.stockoutDates?.length) return [];
    return selectedSku.stockoutDates.map(isoDate => {
      const [, month, day] = isoDate.split('-');
      return `${day}/${month}`;
    });
  }, [selectedSku]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-gs-green animate-spin" />
          <p className="font-mono text-xs text-gs-green animate-pulse uppercase tracking-widest">
            Acessando Supabase_Node...
          </p>
        </div>
      </div>
    );
  }

  // Debug: show data count
  console.log(
    '[TerminalDB View] data:',
    data?.length ?? 0,
    'filtered:',
    filteredData.length,
    'error:',
    error
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative z-10 h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)] overflow-hidden lg:overflow-visible">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col">
          <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text flex items-center gap-3">
            <span className="text-gs-green">&gt;_</span> VISUAL_DB TERMINAL
            <span className="text-[10px] font-mono text-gs-muted/40 border border-gs-muted/20 px-1.5 py-0.5 rounded-sm">
              V1.08
            </span>
          </h2>
          <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">
            CONSTRUÇÃO N-TREE: SKU ➔ MLBS ➔ MÉTRICAS TÁTICAS
          </p>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-3 gap-2 lg:flex lg:gap-6 border border-gs-border bg-gs-panel py-2 px-3 lg:px-6 rounded-[2px] shadow-[1px_1px_0_var(--color-gs-border)]">
          <div className="flex flex-col items-center lg:items-end">
            <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase text-center lg:text-right">
              TTL Revenue 30d
            </span>
            <span className="text-xs lg:text-sm font-bold text-gs-green font-mono text-center lg:text-right">
              {formatCurrency((data ?? []).reduce((a, b) => a + b.total_revenue_30d, 0))}
            </span>
          </div>
          <div className="hidden lg:block w-[1px] bg-gs-border"></div>
          <div className="flex flex-col items-center lg:items-end">
            <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase text-center lg:text-right">
              Sales Yesterday
            </span>
            <span className="text-xs lg:text-sm font-bold text-gs-green font-mono text-center lg:text-right">
              {(data ?? []).reduce((a, b) => a + b.sales_yesterday, 0)}{' '}
              <span className="text-[9px] opacity-50 font-normal">un</span>
            </span>
          </div>
          <div className="hidden lg:block w-[1px] bg-gs-border"></div>
          <div className="flex flex-col items-center lg:items-end">
            <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase text-center lg:text-right">
              Global Stock
            </span>
            <span className="text-xs lg:text-sm font-bold text-gs-text font-mono text-center lg:text-right">
              {(data ?? []).reduce((a, b) => a + b.global_stock, 0)}{' '}
              <span className="text-[9px] opacity-50 font-normal">un</span>
            </span>
          </div>
        </div>
      </div>

      {/* Debug/Error Info */}
      {error && (
        <div className="bg-gray-500/10 border border-gray-500/30 p-3 rounded-sm">
          <p className="text-gray-500 font-mono text-xs">
            ⚠ Erro: {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}
      {(!data || data.length === 0) && !loading && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-sm">
          <p className="text-yellow-400 font-mono text-xs">
            ⚠ Nenhum dado encontrado. Verifique o console (F12).
          </p>
          <p className="text-gs-muted font-mono text-[10px] mt-1">
            data: {data?.length ?? 0} | filtered: {filteredData.length}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden hide-scrollbar">
        {/* LEFT PANE: SKU BROWSER (The "Database Index") */}
        <div className="w-full lg:w-[340px] xl:w-[400px] flex flex-col bg-gs-panel border border-gs-border rounded-[2px] shadow-[1px_1px_0_var(--color-gs-border)] shrink-0 h-[280px] lg:h-auto z-10">
          <div className="p-4 pt-5 border-b border-gs-border flex flex-col gap-6 shrink-0 bg-gs-bg/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="BUSCAR MATRIZ (SKU)..."
                className="w-full bg-gs-bg/40 border border-gs-border/50 text-gs-text font-mono text-xs pl-10 pr-4 py-2.5 rounded-sm placeholder-gs-muted/50 focus:outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green transition-all"
              />
            </div>
            <div className="flex p-1 mt-1 bg-gs-bg border border-gs-border/40 rounded-[2px]">
              {(['ALL', 'A', 'B', 'C'] as const).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFilterClass(cls)}
                  className={`flex-1 text-[10px] font-mono tracking-widest uppercase py-1.5 transition-all rounded-[1px] ${
                    filterClass === cls
                      ? 'bg-[var(--color-gs-surface)] text-gs-green font-bold shadow-sm border border-gs-border/20'
                      : 'text-gs-muted hover:text-gs-text'
                  }`}
                >
                  {cls === 'ALL' ? 'TUDO' : `RANK ${cls}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-2 gap-1">
            {filteredData.map((item) => (
              <button
                key={item.sku}
                onClick={() => handleSkuSelect(item)}
                className={`flex flex-col p-4 text-left border rounded-md transition-all duration-200 group relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-gs-blue/50 ${
                  selectedSku?.sku === item.sku
                    ? 'border-gs-green/60 bg-gs-green/5 shadow-[1px_1px_0_var(--color-gs-green)]'
                    : 'border-transparent hover:border-gs-border hover:bg-gs-bg/30'
                }`}
              >
                {selectedSku?.sku === item.sku && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gs-green rounded-r-full shadow-[0_0_12px_var(--color-gs-green)] z-10" />
                )}
                <div className="flex items-center justify-between w-full mb-1.5 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono font-bold text-xs ${selectedSku?.sku === item.sku ? 'text-gs-green' : 'text-gs-text group-hover:text-gs-blue'}`}
                    >
                      {item.sku}
                    </span>
                    {item.is_master === false && (
                      <span
                        className="text-[8px] font-mono tracking-widest px-1 border rounded-sm border-gs-yellow/30 text-gs-yellow bg-gs-yellow/10"
                        title="SKU secundário (compartilha MLB)"
                      >
                        ML
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-display font-black tracking-widest px-1.5 border rounded-sm ${ABC_COLORS[item.abc_class]}`}
                  >
                    {item.abc_class}
                  </span>
                </div>
                <div className="flex justify-between w-full items-center pl-1">
                  <span className="text-[10px] text-gs-muted font-mono truncate max-w-[200px]">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gs-blue">
                    {formatCurrency(item.total_revenue_30d)}
                  </span>
                </div>
              </button>
            ))}
            {filteredData.length === 0 && (
              <div className="flex-1 flex flex-col flex-center items-center justify-center p-8 text-center text-gs-muted font-mono text-xs opacity-50 uppercase">
                <Box className="w-8 h-8 mb-2" />
                DADOS NÃO ENCONTRADOS
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: DETAIL VIEW (The Mapped children and charts) */}
        {selectedSku ? (
          <div className="flex-1 flex flex-col bg-gs-panel border border-gs-border rounded-[2px] shadow-[1px_1px_0_var(--color-gs-border)] lg:overflow-hidden min-h-[600px] lg:min-h-0 relative shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gs-green/5 blur-3xl -z-10 rounded-full pointer-events-none" />

            {/* Header Detail */}
            <div className="p-4 sm:p-6 border-b border-gs-border flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-0 bg-gradient-to-b from-gs-bg/20 to-transparent">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`px-2 py-0.5 border ${ABC_COLORS[selectedSku.abc_class]} font-display font-black text-sm rounded-sm`}
                  >
                    CURVA {selectedSku.abc_class}
                  </div>
                  <h3 className="font-mono text-xl font-bold text-gs-text">{selectedSku.sku}</h3>
                  {selectedSku.is_master === true && (
                    <span className="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase rounded-sm border border-gs-green/30 text-gs-green bg-gs-green/10">
                      MASTER
                    </span>
                  )}
                  {selectedSku.is_master === false && (
                    <span className="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase rounded-sm border border-gs-yellow/30 text-gs-yellow bg-gs-yellow/10">
                      SECONDARY
                    </span>
                  )}
                  {selectedSku.trend === 'UP' && <TrendingUp className="w-4 h-4 text-gs-green" />}
                  {selectedSku.trend === 'DOWN' && (
                    <TrendingUp className="w-4 h-4 text-gs-red transform rotate-180" />
                  )}
                  {/* Annotations button */}
                  <button
                    onClick={() => setNotesPanelOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-gs-surface"
                    style={{ border: '1px solid var(--color-gs-border)', color: 'var(--color-gs-green)' }}
                  >
                    <BookMarked className="w-3.5 h-3.5" />
                    ANOTAÇÕES
                    {(selectedSku.notes?.length ?? 0) > 0 && (
                      <span
                        className="rounded-full flex items-center justify-center font-mono"
                        style={{
                          width: 16, height: 16, fontSize: 9,
                          background: 'var(--color-gs-red)',
                          color: '#fff',
                        }}
                      >
                        {selectedSku.notes!.length}
                      </span>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gs-muted font-mono">{selectedSku.title}</p>
                {selectedSku.sku_master && selectedSku.sku_master !== selectedSku.sku && (
                  <p className="text-[10px] text-gs-muted font-mono mt-1">
                    MLB Mestre: <span className="text-gs-yellow">{selectedSku.sku_master}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 lg:gap-4 flex-wrap lg:flex-nowrap mt-4 lg:mt-0">
                <div className="flex-1 lg:flex-none flex flex-col bg-gs-bg/30 border border-gs-border/50 rounded-sm px-4 py-2 min-w-[120px]">
                  <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Receita 30d
                  </span>
                  <span className="text-lg font-bold text-gs-green font-mono leading-none">
                    {formatCurrency(selectedSku.total_revenue_30d)}
                  </span>
                  {selectedSku.rev_delta_7d_pct !== undefined && (
                    <span className={`text-[9px] font-mono mt-1 flex items-center gap-0.5 ${
                      selectedSku.rev_delta_7d_pct >= 0 ? 'text-gs-green' : 'text-red-400'
                    }`}>
                      {selectedSku.rev_delta_7d_pct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {selectedSku.rev_delta_7d_pct >= 0 ? '+' : ''}{selectedSku.rev_delta_7d_pct}% vs 7d ant.
                    </span>
                  )}
                </div>
                <div className="flex-1 lg:flex-none flex flex-col bg-gs-bg/30 border border-gs-border/50 rounded-sm px-4 py-2 min-w-[120px]">
                  <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                    <Package className="w-3 h-3" /> Estoque Global
                  </span>
                  <span className="text-lg font-bold text-gs-text font-mono leading-none">
                    {selectedSku.global_stock}{' '}
                    <span className="text-[10px] text-gs-muted font-normal ml-1">un.</span>
                  </span>
                  {selectedSku.rupture_risk !== undefined && selectedSku.rupture_risk > 0.5 && (
                    <span className="text-[9px] font-mono mt-1 text-red-400 flex items-center gap-0.5 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Risco Ruptura: {Math.round(selectedSku.rupture_risk * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex w-full lg:w-auto gap-1.5 lg:ml-auto lg:border-l lg:border-gs-border/50 lg:pl-4 items-center justify-between lg:justify-end">
                  <div className="flex flex-col items-center px-3 py-1 bg-[var(--color-gs-hover-overlay)] border border-[var(--color-gs-border)] rounded-sm">
                    <span className="text-[8px] text-gs-muted font-mono uppercase">7D</span>
                    <span className="text-sm font-bold font-mono text-gs-text">
                      {selectedSku.sales_7d}
                    </span>
                    {selectedSku.sales_delta_7d_pct !== undefined && (
                      <span className={`text-[7px] font-mono ${selectedSku.sales_delta_7d_pct >= 0 ? 'text-gs-green' : 'text-red-400'}`}>
                        {selectedSku.sales_delta_7d_pct >= 0 ? '+' : ''}{selectedSku.sales_delta_7d_pct}%
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center px-3 py-1 bg-[var(--color-gs-hover-overlay)] border border-[var(--color-gs-border)] rounded-sm">
                    <span className="text-[8px] text-gs-muted font-mono uppercase">15D</span>
                    <span className="text-sm font-bold font-mono text-gs-text">
                      {selectedSku.sales_15d}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-1 bg-white/5 border border-white/5 rounded-sm">
                    <span className="text-[8px] text-gs-muted font-mono uppercase">30D</span>
                    <span className="text-sm font-bold font-mono text-gs-green">
                      {selectedSku.sales_30d}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-3 py-1 bg-gs-green/10 border border-gs-green/20 rounded-sm ring-1 ring-gs-green/30 pulse-border">
                    <span className="text-[8px] text-gs-green font-mono uppercase">Ontem</span>
                    <span className="text-sm font-bold font-mono text-gs-green">
                      {selectedSku.sales_yesterday}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split layout inside detail: Chart top, MLBs bottom */}
            <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
              {/* Terminal Graph */}
              <div className="flex flex-col border border-gs-border/50 rounded-sm bg-gs-bg/10 p-4" style={{ minHeight: '280px' }}>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <span className="text-[10px] text-gs-muted font-mono tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gs-blue rounded-full animate-pulse"></div>
                    {chartInfo.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Comparative Toggle */}
                    <button
                      onClick={() => setShowComparative(!showComparative)}
                      className={`text-[9px] font-mono px-2 py-1 rounded-sm border transition-all flex items-center gap-1 ${
                        showComparative
                          ? 'border-gs-blue/60 text-gs-blue bg-gs-blue/10 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                          : 'border-gs-border/50 text-gs-muted hover:text-gs-text hover:border-gs-border'
                      }`}
                    >
                      <BarChart3 className="w-3 h-3" /> COMPARATIVO
                    </button>
                    {/* Forecast Toggle */}
                    <button
                      onClick={() => setShowForecast(!showForecast)}
                      className={`text-[9px] font-mono px-2 py-1 rounded-sm border transition-all flex items-center gap-1 ${
                        showForecast
                          ? 'border-gs-green/60 text-gs-green bg-gs-green/10 shadow-[0_0_8px_rgba(74,222,128,0.2)]'
                          : 'border-gs-border/50 text-gs-muted hover:text-gs-text hover:border-gs-border'
                      }`}
                    >
                      <Eye className="w-3 h-3" /> FORECAST
                    </button>
                    {selectedMlbId ? (
                      <button
                        onClick={() => setSelectedMlbId(null)}
                        className="text-[9px] font-mono text-gs-green border border-gs-green/30 px-2 py-1 rounded-sm hover:bg-gs-green/10 transition-colors"
                      >
                        &gt;_ VER_AGREGADO
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-gs-text">
                        {selectedSku.total_sales_units} UN/30D
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full" style={{ minHeight: '200px' }}>
                  <ResponsiveContainer
                    width="99%"
                    height="100%"
                    key={`chart-${selectedSku.sku}-${selectedMlbId}-${showComparative}-${showForecast}`}
                  >
                    <ComposedChart
                      data={showForecast ? chartInfo.data : chartInfo.data.filter(d => !d.forecast_sales)}
                      margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-gs-green)" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="var(--color-gs-green)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-gs-chart-grid)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="var(--color-gs-chart-label)"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={25}
                        fontFamily="monospace"
                      />
                      <YAxis
                        stroke="var(--color-gs-chart-label)"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        fontFamily="monospace"
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-gs-panel)',
                          border: '1px solid var(--color-gs-border)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                        itemStyle={{ padding: '2px 0' }}
                        cursor={{
                          stroke: 'var(--color-gs-green)',
                          strokeWidth: 1,
                          strokeDasharray: '3 3',
                        }}
                      />
                      {/* Main sales area */}
                      <Area
                        type="monotone"
                        dataKey="sales"
                        name="Unidades"
                        stroke="var(--color-gs-green)"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        strokeWidth={3}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        animationDuration={1000}
                      />
                      {/* Comparative: Previous period overlay */}
                      {showComparative && (
                        <Line
                          type="monotone"
                          dataKey="prev_sales"
                          name="Período Anterior"
                          stroke="#64748b"
                          strokeWidth={1.5}
                          strokeDasharray="6 3"
                          dot={false}
                          animationDuration={800}
                        />
                      )}
                      {/* Forecast: Future prediction line */}
                      {showForecast && (
                        <Area
                          type="monotone"
                          dataKey="forecast_sales"
                          name="Previsão"
                          stroke="#38bdf8"
                          fill="url(#colorForecast)"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
                          animationDuration={800}
                        />
                      )}
                      {/* Stockout markers: red dots on days with zero stock */}
                      {stockoutMarkers.map(date => (
                        <ReferenceDot
                          key={date}
                          x={date}
                          y={0}
                          r={6}
                          fill="var(--color-gs-red)"
                          stroke="var(--color-gs-red)"
                          strokeWidth={2}
                          ifOverflow="extendDomain"
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Causa e Efeito Panel */}
              {selectedSku.causa_efeito && (
                <div className={`border rounded-sm p-4 ${
                  selectedSku.causa_efeito.severidade === 'CRITICO'
                    ? 'border-red-500/40 bg-red-500/5'
                    : selectedSku.causa_efeito.severidade === 'ALTO'
                    ? 'border-orange-500/40 bg-orange-500/5'
                    : 'border-gs-border/50 bg-gs-bg/10'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-gs-muted font-mono tracking-widest uppercase flex items-center gap-2">
                      <Zap className={`w-3.5 h-3.5 ${
                        selectedSku.causa_efeito.severidade === 'CRITICO' ? 'text-red-400 animate-pulse' : 'text-orange-400'
                      }`} />
                      DIAGNÓSTICO — CAUSA {'&'} EFEITO
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm border ${
                      selectedSku.causa_efeito.severidade === 'CRITICO'
                        ? 'border-red-500/40 text-red-400 bg-red-500/10'
                        : selectedSku.causa_efeito.severidade === 'ALTO'
                        ? 'border-orange-500/40 text-orange-400 bg-orange-500/10'
                        : 'border-gs-blue/40 text-gs-blue bg-gs-blue/10'
                    }`}>
                      {selectedSku.causa_efeito.severidade}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-gs-muted font-mono uppercase">Causa Primária</span>
                      <span className="text-xs font-mono font-bold text-gs-text">{selectedSku.causa_efeito.causa_primaria}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-gs-muted font-mono uppercase">Delta Vendas</span>
                      <span className={`text-xs font-mono font-bold ${selectedSku.causa_efeito.delta_vendas_pct >= 0 ? 'text-gs-green' : 'text-red-400'}`}>
                        {selectedSku.causa_efeito.delta_vendas_pct >= 0 ? '+' : ''}{selectedSku.causa_efeito.delta_vendas_pct}%
                        <span className="text-[9px] text-gs-muted font-normal ml-1">
                          ({selectedSku.causa_efeito.vendas_prev_7d} → {selectedSku.causa_efeito.vendas_curr_7d})
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-gs-muted font-mono uppercase">Evidência</span>
                      <span className="text-[10px] font-mono text-gs-muted">{selectedSku.causa_efeito.evidencia}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <span className="text-[8px] text-gs-muted font-mono uppercase">Recomendação GS-Claw</span>
                    <p className="text-[10px] font-mono text-gs-blue mt-1">{selectedSku.causa_efeito.recomendacao}</p>
                  </div>
                </div>
              )}

              {/* MLBs Data Grid */}
              <div className="flex flex-col">
                <span className="text-[10px] text-gs-green font-mono tracking-widest uppercase mb-3 border-b border-gs-border/40 pb-2">
                  // MLBs_MAPPED_TO_SKU ({selectedSku.mlbs.length})
                </span>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-8">
                  {selectedSku.mlbs.map((mlb) => (
                    <div
                      key={mlb.mlb_id}
                      onClick={() => {
                        console.log('[TerminalDB] Clicked MLB:', mlb.mlb_id);
                        setSelectedMlbId(selectedMlbId === mlb.mlb_id ? null : mlb.mlb_id);
                      }}
                      className={`group border transition-all duration-300 rounded-sm p-4 flex flex-col gap-3 cursor-pointer relative overflow-hidden ${
                        selectedMlbId === mlb.mlb_id
                          ? 'border-gs-green bg-gs-green/5 shadow-[1px_1px_0_var(--color-gs-green)]'
                          : 'border-gs-border/40 bg-[var(--color-gs-surface)] hover:border-gs-border/80'
                      }`}
                    >
                      {selectedMlbId === mlb.mlb_id && (
                        <div className="absolute top-0 right-0 p-1">
                          <Activity size={12} className="text-gs-green animate-pulse" />
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://www.mercadolivre.com.br/anuncios/lista?filters=OMNI_ACTIVE|OMNI_INACTIVE|CHANNEL_NO_PROXIMITY_AND_NO_MP_MERCHANTS&page=1&search=${mlb.mlb_id.replace(/\D/g, '')}&sort=DEFAULT`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono font-bold text-sm text-gs-blue hover:text-gs-cyan hover:underline transition-colors cursor-pointer flex items-center gap-1 z-20"
                            >
                              {mlb.mlb_id}
                              <Activity size={10} className="opacity-40" />
                            </a>
                            <a
                              href={`https://app.marketfacil.com.br/analise-anuncio?url=https://produto.mercadolivre.com.br/${mlb.mlb_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-1.5 py-0.5 text-[8px] font-mono tracking-widest uppercase rounded-sm border border-gs-blue/30 text-gs-blue bg-gs-blue/10 hover:bg-gs-blue/20 hover:border-gs-blue/50 transition-colors z-20"
                              title="Analisar anúncio no Marketfacil"
                            >
                              MARKETFACIL
                            </a>
                          </div>
                          <span className="text-[10px] text-gs-muted uppercase font-mono max-w-[200px] truncate mt-0.5">
                            {mlb.title}
                          </span>
                        </div>
                        <div
                          className={`px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase rounded-sm border ${
                            mlb.status === 'active'
                              ? 'border-gs-green/30 text-gs-green bg-gs-green/10'
                              : mlb.status === 'paused'
                                ? 'border-gs-yellow/30 text-gs-yellow bg-gs-yellow/10'
                                : 'border-gs-red/30 text-gs-red bg-gs-red/10'
                          }`}
                        >
                          {mlb.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gs-muted uppercase font-mono">
                            Preço
                          </span>
                          <span className="text-xs font-mono font-bold text-gs-text">
                            {formatCurrency(mlb.price)}
                          </span>
                        </div>
                        <div className="flex flex-col border-l border-white/5 pl-2">
                          <span className="text-[8px] text-gs-muted uppercase font-mono">
                            Ontem
                          </span>
                          <span className="text-xs font-mono font-bold text-gs-green flex items-center gap-1">
                            {mlb.sales_yesterday} <span className="text-[8px] opacity-50">UN</span>
                          </span>
                        </div>
                        <div className="flex flex-col border-l border-white/5 pl-2">
                          <span className="text-[8px] text-gs-muted uppercase font-mono">
                            Estoque
                          </span>
                          <span className="text-xs font-mono font-bold text-gs-text flex items-center gap-1">
                            {mlb.stock} <span className="text-[8px] opacity-50">UN</span>
                          </span>
                        </div>
                      </div>

                      {/* Sales Metrics Grid */}
                      <div className="flex flex-col pt-2 border-t border-white/5">
                        <span className="text-[8px] text-gs-muted uppercase font-mono mb-2 tracking-wider">
                          MÉTRICAS DE SAÍDA (7D | 15D | 30D)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {/* 7D Column */}
                          <div
                            className={`flex flex-col items-center p-1.5 rounded-sm bg-gs-bg/40 border border-white/5 ${
                              mlb.sales_7d / 7 > (mlb.sales_30d / 30) * 1.2
                                ? 'ring-1 ring-gs-green/30'
                                : ''
                            }`}
                          >
                            <span className="text-[8px] text-gs-muted font-mono mb-1">7D</span>
                            <span
                              className={`text-xs font-mono font-bold ${mlb.sales_7d / 7 > (mlb.sales_30d / 30) * 1.2 ? 'text-gs-green drop-shadow-[0_0_5px_rgba(52,131,250,0.4)]' : 'text-gs-text'}`}
                            >
                              {mlb.sales_7d}
                            </span>
                          </div>
                          {/* 15D Column */}
                          <div className="flex flex-col items-center p-1.5 rounded-sm bg-gs-bg/40 border border-white/5">
                            <span className="text-[8px] text-gs-muted font-mono mb-1">15D</span>
                            <span className="text-xs font-mono font-bold text-gs-text">
                              {mlb.sales_15d}
                            </span>
                          </div>
                          {/* 30D Column */}
                          <div className="flex flex-col items-center p-1.5 rounded-sm bg-gs-bg/40 border border-white/5">
                            <span className="text-[8px] text-gs-muted font-mono mb-1">30D</span>
                            <span className="text-xs font-mono font-bold text-gs-green">
                              {mlb.sales_30d}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedSku.mlbs.length === 0 && (
                    <div className="col-span-2 py-8 flex flex-col items-center justify-center border border-dashed border-gs-border/50 rounded-sm">
                      <AlertTriangle className="w-6 h-6 text-gs-yellow mb-2 opacity-50" />
                      <span className="font-mono text-xs text-gs-muted uppercase tracking-widest">
                        Nenhum MLB ativo atrelado a este SKU mestre.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 border border-gs-border border-dashed rounded-sm bg-black/10 flex items-center justify-center">
            <span className="text-gs-muted font-mono text-xs uppercase tracking-widest animate-pulse [&::before]:content-['>_'] [&::before]:mr-2">
              Aguardando seleção na matriz...
            </span>
          </div>
        )}
      </div>

      {/* SKU Notes Panel */}
      {selectedSku && (
        <SKUNotesPanel
          sku={selectedSku.sku}
          notes={selectedSku.notes ?? []}
          open={notesPanelOpen}
          onClose={() => setNotesPanelOpen(false)}
        />
      )}
    </div>
  );
}
