import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Search, BarChart3, AlertTriangle, TrendingUp, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/Skeleton';
import { toast } from 'sonner';

type ResultType = 'curva_abc' | 'ia_alertas' | 'ml_insights' | 'ia_growth_plans';

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  extra?: string;
  path: string;
}

const TYPE_CONFIG: Record<
  ResultType,
  { icon: typeof BarChart3; color: string; badge: 'success' | 'warning' | 'secondary' | 'default' }
> = {
  curva_abc: { icon: BarChart3, color: 'text-[var(--color-gs-green)]', badge: 'success' },
  ia_alertas: { icon: AlertTriangle, color: 'text-[var(--color-gs-text)]', badge: 'default' },
  ml_insights: { icon: Brain, color: 'text-[var(--color-gs-blue)]', badge: 'secondary' },
  ia_growth_plans: { icon: TrendingUp, color: 'text-[var(--color-gs-yellow)]', badge: 'warning' },
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const [curvaRes, alertasRes, insightsRes, growthRes] = await Promise.allSettled([
        supabase
          .from('curva_abc')
          .select('id, titulo, curva_abc')
          .or(`id.ilike.%${q}%,titulo.ilike.%${q}%`)
          .limit(5),
        supabase
          .from('ia_alertas')
          .select('id, sku, tipo_alerta, severity')
          .ilike('sku', `%${q}%`)
          .limit(5),
        supabase
          .from('ml_insights')
          .select('sku, titulo, rupture_risk')
          .ilike('sku', `%${q}%`)
          .limit(5),
        supabase
          .from('ia_growth_plans')
          .select('id, sku, status_intervencao')
          .ilike('sku', `%${q}%`)
          .limit(5),
      ]);

      const all: SearchResult[] = [];

      if (curvaRes.status === 'fulfilled') {
        curvaRes.value.data?.forEach((item: unknown) => {
          const d = item as Record<string, unknown>;
          all.push({
            type: 'curva_abc',
            id: String(d.id || ''),
            title: String(d.titulo || d.id || ''),
            subtitle: `Curva ${d.curva_abc || ''} · SKU ${d.id || ''}`,
            path: `/terminal?sku=${d.id || ''}`,
          });
        });
      }

      if (alertasRes.status === 'fulfilled') {
        alertasRes.value.data?.forEach((item: unknown) => {
          const d = item as Record<string, unknown>;
          all.push({
            type: 'ia_alertas',
            id: String(d.id || ''),
            title: `${d.tipo_alerta || ''} — ${d.sku || ''}`,
            subtitle: `[${d.severity || ''}] ${d.sku || ''}`,
            path: `/monitor`,
          });
        });
      }

      if (insightsRes.status === 'fulfilled') {
        insightsRes.value.data?.forEach((item: unknown) => {
          const d = item as Record<string, unknown>;
          all.push({
            type: 'ml_insights',
            id: String(d.sku || ''),
            title: String(d.titulo || d.sku || ''),
            subtitle: `Rupture risk: ${((Number(d.rupture_risk) || 0) * 100).toFixed(0)}%`,
            path: `/ml`,
          });
        });
      }

      if (growthRes.status === 'fulfilled') {
        growthRes.value.data?.forEach((item: unknown) => {
          const d = item as Record<string, unknown>;
          all.push({
            type: 'ia_growth_plans',
            id: String(d.id || ''),
            title: `Growth Plan — ${d.sku || ''}`,
            subtitle: `Status: ${d.status_intervencao || ''}`,
            path: `/growth`,
          });
        });
      }

      setResults(all);
    } catch {
      toast.error('Erro na busca');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    handleSearch(val);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 text-center">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          GLOBAL <span className="text-gs-green">SEARCH</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">
          Busca integrada — todas as tabelas Supabase
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-gs-muted)]" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder="Buscar por SKU, título, tipo de alerta..."
          className="pl-12 h-12 text-sm"
          autoFocus
        />
      </div>

      {/* Results */}
      {isSearching && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <Card className="p-8 text-center">
          <span className="font-mono text-sm text-[var(--color-gs-muted)]">
            Nenhum resultado para "{query}"
          </span>
        </Card>
      )}

      {!isSearching && results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => {
            const config = TYPE_CONFIG[result.type];
            const Icon = config.icon;

            return (
              <Card
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="p-4 flex items-center gap-4 cursor-pointer hover:border-[var(--color-gs-muted)]/30 transition-colors group"
              >
                <div className={`p-2 rounded-md bg-[var(--color-gs-border)]/50 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs font-bold text-[var(--color-gs-text)] truncate">
                    {result.title}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--color-gs-muted)] truncate">
                    {result.subtitle}
                  </div>
                </div>
                <Badge variant={config.badge} className="shrink-0">
                  {result.type.replace('_', ' ')}
                </Badge>
              </Card>
            );
          })}
        </div>
      )}

      {!hasSearched && (
        <Card className="p-8 text-center">
          <Search className="h-8 w-8 text-[var(--color-gs-muted)] mx-auto mb-3 opacity-30" />
          <p className="font-mono text-sm text-[var(--color-gs-muted)]">
            Digite pelo menos 2 caracteres para buscar
          </p>
        </Card>
      )}
    </div>
  );
}
