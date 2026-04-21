import { useState, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useCurvaABC, useIAAlertas, useMLInsights } from '@/hooks';
import { Card, Badge, Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';

type TabType = 'curva_abc' | 'ia_alertas' | 'ml_insights';

export function DataExplorer() {
  const [activeTab, setActiveTab] = useState<TabType>('curva_abc');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const { data: curvaData, isLoading: curvaLoading } = useCurvaABC(500);
  const { data: alertasData, isLoading: alertasLoading } = useIAAlertas(200);
  const { data: insightsData, isLoading: insightsLoading } = useMLInsights(200);

  const tabs: { id: TabType; label: string; count: number; loading: boolean }[] = [
    { id: 'curva_abc', label: 'Curva ABC', count: curvaData?.length ?? 0, loading: curvaLoading },
    {
      id: 'ia_alertas',
      label: 'IA Alertas',
      count: alertasData?.length ?? 0,
      loading: alertasLoading,
    },
    {
      id: 'ml_insights',
      label: 'ML Insights',
      count: insightsData?.length ?? 0,
      loading: insightsLoading,
    },
  ];

  // Columns
  const curvaColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'SKU',
        size: 140,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--color-gs-green)]">
            {(row.original as any).id}
          </span>
        ),
      },
      {
        accessorKey: 'titulo',
        header: 'Título',
        size: 300,
        cell: ({ row }) => (
          <span
            className="text-sm truncate max-w-[280px] block"
            title={(row.original as any).titulo as string}
          >
            {(row.original as any).titulo}
          </span>
        ),
      },
      {
        accessorKey: 'curva_abc',
        header: 'Curva',
        size: 80,
        cell: ({ row }: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const c = (row.original as any).curva_abc;
          return (
            <Badge variant={c === 'A' ? 'success' : c === 'B' ? 'warning' : 'secondary'}>{c as string}</Badge>
          );
        },
      },
      {
        accessorKey: 'receita_30d',
        header: 'Receita 30d',
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              (row.original as any).receita_30d as number
            )}
          </span>
        ),
      },
      {
        accessorKey: 'tendencia',
        header: 'Tendência',
        size: 110,
        cell: ({ row }: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = (row.original as any).tendencia as string;
          const colors: Record<string, string> = {
            crescendo: 'text-[var(--color-gs-green)]',
            caindo: 'text-[var(--color-gs-text)]',
            estavel: 'text-[var(--color-gs-muted)]',
            declínio: 'text-[var(--color-gs-yellow)]',
          };
          return <span className={`font-mono text-xs ${colors[t] ?? ''}`}>{t}</span>;
        },
      },
    ],
    []
  );

  const alertaColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        size: 140,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--color-gs-green)]">
            {(row.original as any).sku}
          </span>
        ),
      },
      {
        accessorKey: 'severity',
        header: 'Severidade',
        size: 100,
        cell: ({ row }) => {
          const s = (row.original as any).severity as string;
          return (
            <Badge
              variant={
                s === 'CRÍTICO'
                  ? 'danger'
                  : s === 'ALTO'
                    ? 'warning'
                    : s === 'MÉDIO'
                      ? 'default'
                      : 'secondary'
              }
            >
              {s}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'tipo_alerta',
        header: 'Tipo',
        size: 150,
        cell: ({ row }) => (
          <span className="text-xs">{(row.original as any).tipo_alerta}</span>
        ),
      },
      {
        accessorKey: 'descricao',
        header: 'Descrição',
        size: 300,
        cell: ({ row }) => (
          <span className="text-xs text-[var(--color-gs-muted)] truncate max-w-[280px] block">
            {(row.original as any).descricao}
          </span>
        ),
      },
      {
        accessorKey: 'data_registro',
        header: 'Data',
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">
            {new Date((row.original as any).data_registro).toLocaleDateString(
              'pt-BR'
            )}
          </span>
        ),
      },
    ],
    []
  );

  const insightColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        size: 140,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--color-gs-green)]">
            {(row.original as any).sku}
          </span>
        ),
      },
      {
        accessorKey: 'rupture_risk',
        header: 'Rupture Risk',
        size: 100,
        cell: ({ row }: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v = (row.original as any).rupture_risk as number;
          return (
            <span
              className={`font-mono text-xs font-bold ${
                v > 0.6
                  ? 'text-[var(--color-gs-text)] underline decoration-gs-muted'
                  : v > 0.3
                    ? 'text-[var(--color-gs-yellow)]'
                    : 'text-[var(--color-gs-green)]'
              }`}
            >
              {(v * 100).toFixed(0)}%
            </span>
          );
        },
      },
      {
        accessorKey: 'anomaly_score',
        header: 'Anomaly',
        size: 90,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-gs-muted">
            {((row.original as any).anomaly_score as number)?.toFixed(3)}
          </span>
        ),
      },
      {
        accessorKey: 'ml_cluster',
        header: 'Cluster',
        size: 90,
        cell: ({ row }) => (
          <Badge variant="secondary">{(row.original as any).ml_cluster}</Badge>
        ),
      },
      {
        accessorKey: 'elasticity',
        header: 'Elasticidade',
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            ε = {((row.original as any).elasticity as number)?.toFixed(2) ?? '—'}
          </span>
        ),
      },
    ],
    []
  );

  const tableData = useMemo(() => {
    if (activeTab === 'curva_abc') return curvaData ?? [];
    if (activeTab === 'ia_alertas') return alertasData ?? [];
    return insightsData ?? [];
  }, [activeTab, curvaData, alertasData, insightsData]);

  const columns = useMemo(() => {
    if (activeTab === 'curva_abc') return curvaColumns;
    if (activeTab === 'ia_alertas') return alertaColumns;
    return insightColumns;
  }, [activeTab, curvaColumns, alertaColumns, insightColumns]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { rows } = table.getRowModel();

  const parentRef = useRef<HTMLDivElement>(null);

  const isLoading = tabs.find((t) => t.id === activeTab)?.loading;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-gs-text">
          DATA <span className="text-gs-green">EXPLORER</span>
        </h2>
        <p className="font-mono text-xs text-gs-muted tracking-widest uppercase">
          Banco visual — consulta direta ao Supabase
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-gs-border)] pb-0 overflow-x-auto hide-scrollbar w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-[var(--color-gs-green)] text-[var(--color-gs-green)]'
                : 'border-transparent text-[var(--color-gs-muted)] hover:text-[var(--color-gs-text)]'
            }`}
          >
            {tab.label}
            {tab.loading ? (
              <span className="text-[10px] text-gs-muted">—</span>
            ) : (
              <span className="text-[10px] text-[var(--color-gs-muted)]">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">
          {table.getFilteredRowModel().rows.length} registros
          {table.getColumn('curva_abc') && ' · clique no header para ordenar'}
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0 rounded-[2px] shadow-[1px_1px_0_var(--color-gs-border)] border-[var(--color-gs-border)]">
        <div
          ref={parentRef}
          className="overflow-auto hide-scrollbar"
          style={{ height: '60vh', minHeight: 400 }}
        >
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--color-gs-panel)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-4 py-3 font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--color-gs-muted)] border-b border-[var(--color-gs-border)] cursor-pointer hover:text-[var(--color-gs-green)] transition-colors"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-gs-border)]/50">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <span className="font-mono text-sm text-[var(--color-gs-muted)]">
                      Nenhum registro encontrado.
                    </span>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-gs-border)]/50 hover:bg-[var(--color-gs-border)]/20 transition-colors cursor-pointer"
                    onClick={() => {}}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-gs-border)] bg-[var(--color-gs-bg)]">
          <span className="font-mono text-[10px] text-[var(--color-gs-muted)]">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
