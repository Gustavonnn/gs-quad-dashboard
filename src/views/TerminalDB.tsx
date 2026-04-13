import { useState, useMemo, useEffect } from 'react';
import { useTerminalData } from '../hooks/useTerminalData';
import type { TerminalSkuItem, MlbItem } from '../types/terminal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Box, Package, Activity, TrendingUp, Search, AlertTriangle } from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const ABC_COLORS = {
  A: 'text-gs-green border-gs-green/30 bg-gs-green/5',
  B: 'text-gs-blue border-gs-blue/30 bg-gs-blue/5',
  C: 'text-gs-text border-gs-border/50 bg-gs-panel',
};

export function TerminalDB() {
  const { data, loading, error } = useTerminalData();
  const [selectedSku, setSelectedSku] = useState<TerminalSkuItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.sku.toLowerCase().includes(search.toLowerCase()) || item.title.toLowerCase().includes(search.toLowerCase());
      const matchClass = filterClass === 'ALL' || item.abc_class === filterClass;
      return matchSearch && matchClass;
    });
  }, [data, search, filterClass]);

  // Set initial selected item when data loads
  useEffect(() => {
    if (!selectedSku && filteredData.length > 0) {
      setSelectedSku(filteredData[0]);
    }
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-gs-green animate-spin" />
          <p className="font-mono text-xs text-gs-green animate-pulse uppercase tracking-widest">Acessando Supabase_Node...</p>
        </div>
      </div>
    );
  }

  // Debug: show data count
  console.log('[TerminalDB View] data:', data.length, 'filtered:', filteredData.length, 'error:', error);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-fade-in relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text flex items-center gap-3">
            <span className="text-gs-green">&gt;_</span> VISUAL_DB TERMINAL
          </h2>
          <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">CONSTRUÇÃO N-TREE: SKU ➔ MLBS ➔ MÉTRICAS TÁTICAS</p>
        </div>

        {/* Global KPIs */}
        <div className="flex gap-6 border border-gs-border bg-gs-panel py-2 px-6 rounded-sm shadow-xl">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase">TTL Revenue 30d</span>
            <span className="text-sm font-bold text-gs-green font-mono">
              {formatCurrency(data.reduce((a, b) => a + b.total_revenue_30d, 0))}
            </span>
          </div>
          <div className="w-[1px] bg-gs-border"></div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase">TTL SKUs Rankeados</span>
            <span className="text-sm font-bold text-gs-text font-mono">{data.length}</span>
          </div>
        </div>
      </div>

      {/* Debug/Error Info */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-sm">
          <p className="text-red-400 font-mono text-xs">⚠ Erro: {error}</p>
        </div>
      )}
      {data.length === 0 && !loading && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-sm">
          <p className="text-yellow-400 font-mono text-xs">⚠ Nenhum dado encontrado. Verifique o console (F12).</p>
          <p className="text-gs-muted font-mono text-[10px] mt-1">data: {data.length} | filtered: {filteredData.length}</p>
        </div>
      )}

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* LEFT PANE: SKU BROWSER (The "Database Index") */}
        <div className="w-[400px] flex flex-col bg-gs-panel border border-gs-border rounded-sm shadow-2xl shrink-0">
          <div className="p-4 border-b border-gs-border flex flex-col gap-3 shrink-0 bg-black/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="BUSCAR MATRIZ (SKU)..."
                className="w-full bg-black/40 border border-gs-border/50 text-gs-text font-mono text-xs pl-10 pr-4 py-2.5 rounded-sm placeholder-gs-muted/50 focus:outline-none focus:border-gs-green focus:ring-1 focus:ring-gs-green transition-all"
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'A', 'B', 'C'] as const).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setFilterClass(cls)}
                  className={`flex-1 text-[10px] font-mono tracking-widest uppercase py-1.5 border rounded-sm transition-all ${
                    filterClass === cls
                      ? 'bg-gs-text text-gs-bg border-gs-text'
                      : 'border-gs-border/50 text-gs-muted hover:text-gs-text hover:border-gs-muted'
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
                onClick={() => setSelectedSku(item)}
                className={`flex flex-col p-3 text-left border rounded-sm transition-all duration-200 group relative overflow-hidden ${
                  selectedSku?.sku === item.sku
                    ? 'border-gs-green/60 bg-gs-green/5 shadow-[0_0_15px_rgba(0,255,102,0.05)]'
                    : 'border-transparent hover:border-gs-border hover:bg-black/20'
                }`}
              >
                {selectedSku?.sku === item.sku && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gs-green shadow-[0_0_8px_#00ff66]" />
                )}
                <div className="flex items-start justify-between w-full mb-1.5 pl-1">
                  <span className={`font-mono font-bold text-xs ${selectedSku?.sku === item.sku ? 'text-gs-green' : 'text-gs-text group-hover:text-white'}`}>
                    {item.sku}
                  </span>
                  <span className={`text-[10px] font-display font-black tracking-widest px-1.5 border rounded-sm ${ABC_COLORS[item.abc_class]}`}>
                    {item.abc_class}
                  </span>
                </div>
                <div className="flex justify-between w-full items-center pl-1">
                  <span className="text-[10px] text-gs-muted font-mono truncate max-w-[200px]">{item.title}</span>
                  <span className="text-[10px] font-mono font-bold text-gs-blue">{formatCurrency(item.total_revenue_30d)}</span>
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
          <div className="flex-1 flex flex-col bg-gs-panel border border-gs-border rounded-sm shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gs-green/5 blur-3xl -z-10 rounded-full pointer-events-none" />
            
            {/* Header Detail */}
            <div className="p-6 border-b border-gs-border flex justify-between items-start bg-gradient-to-b from-black/40 to-transparent">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className={`px-2 py-0.5 border ${ABC_COLORS[selectedSku.abc_class]} font-display font-black text-sm rounded-sm`}>
                     CURVA {selectedSku.abc_class}
                   </div>
                   <h3 className="font-mono text-xl font-bold text-gs-text">{selectedSku.sku}</h3>
                   {selectedSku.trend === 'UP' && <TrendingUp className="w-4 h-4 text-gs-green" />}
                   {selectedSku.trend === 'DOWN' && <TrendingUp className="w-4 h-4 text-gs-red transform rotate-180" />}
                </div>
                <p className="text-sm text-gs-muted font-mono">{selectedSku.title}</p>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col bg-black/30 border border-gs-border/50 rounded-sm px-4 py-2 min-w-[120px]">
                  <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Receita 30d
                  </span>
                  <span className="text-lg font-bold text-gs-green font-mono leading-none">{formatCurrency(selectedSku.total_revenue_30d)}</span>
                </div>
                <div className="flex flex-col bg-black/30 border border-gs-border/50 rounded-sm px-4 py-2 min-w-[120px]">
                  <span className="text-[9px] text-gs-muted font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                    <Package className="w-3 h-3" /> Estoque Global
                  </span>
                  <span className="text-lg font-bold text-gs-text font-mono leading-none">{selectedSku.global_stock} <span className="text-[10px] text-gs-muted font-normal ml-1">un.</span></span>
                </div>
              </div>
            </div>

            {/* Split layout inside detail: Chart top, MLBs bottom */}
            <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
              
              {/* Terminal Graph */}
              <div className="h-[240px] flex flex-col border border-gs-border/50 rounded-sm bg-black/20 p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-gs-muted font-mono tracking-widest uppercase flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gs-blue rounded-full animate-pulse"></div>
                    VELOCIDADE DE SAÍDA (30D)
                  </span>
                  <span className="text-[10px] font-mono text-gs-text">UNIDADES/DIA: {selectedSku.total_sales_units}</span>
                </div>
                <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                  <ResponsiveContainer width="99%" height="100%" key={`chart-render-${selectedSku.sku}`}>
                    <AreaChart 
                      data={selectedSku.chartData} 
                      margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff66" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00ff66" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        minTickGap={25}
                        fontFamily="monospace"
                      />
                      <YAxis 
                        stroke="#444" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        fontFamily="monospace"
                        allowDecimals={false}
                      />
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#0f0f11', border: '1px solid #333', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
                         itemStyle={{ padding: '2px 0' }}
                         cursor={{ stroke: '#00ff66', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        name="Unidades"
                        stroke="#00ff66" 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        strokeWidth={2}
                        animationDuration={1000}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Faturamento"
                        stroke="#0066FF" 
                        fill="transparent"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        hide={true} // Mantemos os dados para o tooltip mas limpamos o visual principal
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MLBs Data Grid */}
              <div className="flex flex-col">
                <span className="text-[10px] text-gs-green font-mono tracking-widest uppercase mb-3 border-b border-gs-border/40 pb-2">
                  // MLBs_MAPPED_TO_SKU ({selectedSku.mlbs.length})
                </span>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-8">
                  {selectedSku.mlbs.map((mlb) => (
                    <div key={mlb.mlb_id} className="group border border-gs-border/40 bg-black/30 hover:border-gs-border transition-colors rounded-sm p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                           <a 
                             href={`https://www.mercadolivre.com.br/anuncios/lista?filters=OMNI_ACTIVE|OMNI_INACTIVE|CHANNEL_NO_PROXIMITY_AND_NO_MP_MERCHANTS&page=1&search=${mlb.mlb_id.replace(/\D/g, '')}&sort=DEFAULT`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="font-mono font-bold text-sm text-gs-blue hover:text-[#4da6ff] hover:underline transition-colors cursor-pointer flex items-center gap-1"
                           >
                             {mlb.mlb_id}
                             <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                             </svg>
                           </a>
                           <span className="text-[10px] text-gs-muted uppercase font-mono max-w-[200px] truncate">{mlb.title}</span>
                        </div>
                        <div className={`px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase rounded-sm border ${
                          mlb.status === 'active' ? 'border-gs-green/30 text-gs-green bg-gs-green/10' : 
                          mlb.status === 'paused' ? 'border-gs-yellow/30 text-gs-yellow bg-gs-yellow/10' :
                          'border-gs-red/30 text-gs-red bg-gs-red/10'
                        }`}>
                          {mlb.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gs-muted uppercase font-mono">Preço</span>
                          <span className="text-xs font-mono font-bold text-gs-text">{formatCurrency(mlb.price)}</span>
                        </div>
                        <div className="flex flex-col border-l border-white/5 pl-2">
                          <span className="text-[8px] text-gs-muted uppercase font-mono">Estoque</span>
                          <span className="text-xs font-mono font-bold text-gs-text flex items-center gap-1">
                            {mlb.stock} <span className="text-[8px] opacity-50">UN</span>
                          </span>
                        </div>
                      </div>

                      {/* Sales Metrics Grid */}
                      <div className="flex flex-col pt-2 border-t border-white/5">
                        <span className="text-[8px] text-gs-muted uppercase font-mono mb-2 tracking-wider">MÉTRICAS DE SAÍDA (7D | 15D | 30D)</span>
                        <div className="grid grid-cols-3 gap-1">
                          {/* 7D Column */}
                          <div className={`flex flex-col items-center p-1.5 rounded-sm bg-gs-bg/40 border border-white/5 ${
                            (mlb.sales_7d / 7) > (mlb.sales_30d / 30 * 1.2) ? 'ring-1 ring-gs-green/30' : ''
                          }`}>
                            <span className="text-[8px] text-gs-muted font-mono mb-1">7D</span>
                            <span className={`text-xs font-mono font-bold ${(mlb.sales_7d / 7) > (mlb.sales_30d / 30 * 1.2) ? 'text-[#00ff66] drop-shadow-[0_0_5px_rgba(0,255,102,0.4)]' : 'text-gs-text'}`}>
                              {mlb.sales_7d}
                            </span>
                          </div>
                          {/* 15D Column */}
                          <div className="flex flex-col items-center p-1.5 rounded-sm bg-gs-bg/40 border border-white/5">
                            <span className="text-[8px] text-gs-muted font-mono mb-1">15D</span>
                            <span className="text-xs font-mono font-bold text-gs-text">{mlb.sales_15d}</span>
                          </div>
                          {/* 30D Column */}
                          <div className="flex flex-col items-center p-1.5 rounded-sm bg-gs-bg/40 border border-white/5">
                            <span className="text-[8px] text-gs-muted font-mono mb-1">30D</span>
                            <span className="text-xs font-mono font-bold text-gs-green">{mlb.sales_30d}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedSku.mlbs.length === 0 && (
                    <div className="col-span-2 py-8 flex flex-col items-center justify-center border border-dashed border-gs-border/50 rounded-sm">
                      <AlertTriangle className="w-6 h-6 text-gs-yellow mb-2 opacity-50" />
                      <span className="font-mono text-xs text-gs-muted uppercase tracking-widest">Nenhum MLB ativo atrelado a este SKU mestre.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 border border-gs-border border-dashed rounded-sm bg-black/10 flex items-center justify-center">
            <span className="text-gs-muted font-mono text-xs uppercase tracking-widest animate-pulse [&::before]:content-['>_'] [&::before]:mr-2">Aguardando seleção na matriz...</span>
          </div>
        )}
      </div>
    </div>
  );
}
