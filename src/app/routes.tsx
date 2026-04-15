import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const VisaoGeral = lazy(() => import('@/views/VisaoGeral').then(m => ({ default: m.VisaoGeral })))
const TerminalDB = lazy(() => import('@/views/TerminalDB').then(m => ({ default: m.TerminalDB })))
const Monitor = lazy(() => import('@/views/Monitor').then(m => ({ default: m.Monitor })))
const GrowthPlan = lazy(() => import('@/views/GrowthPlan').then(m => ({ default: m.GrowthPlan })))
const MLIntel = lazy(() => import('@/views/MLIntel').then(m => ({ default: m.MLIntel })))
const PriceTimeline = lazy(() => import('@/views/PriceTimeline').then(m => ({ default: m.PriceTimeline })))
const DataExplorer = lazy(() => import('@/views/DataExplorer').then(m => ({ default: m.DataExplorer })))
const ActivityFeed = lazy(() => import('@/views/ActivityFeed').then(m => ({ default: m.ActivityFeed })))
const SyncControl = lazy(() => import('@/views/SyncControl').then(m => ({ default: m.SyncControl })))
const GlobalSearch = lazy(() => import('@/views/GlobalSearch').then(m => ({ default: m.GlobalSearch })))
const Settings = lazy(() => import('@/views/Settings').then(m => ({ default: m.Settings })))
const AdFactory = lazy(() => import('@/views/AdFactory').then(m => ({ default: m.AdFactory })))
const AdsRadar = lazy(() => import('@/views/AdsRadar').then(m => ({ default: m.AdsRadar })))

export interface RouteMeta {
  title: string
  subtitle: string
  path: string
}

export const routesMeta: RouteMeta[] = [
  {
    title: 'WAR_ROOM',
    subtitle: 'DADOS EXCEL ↔ SUPABASE ↔ DASHBOARD',
    path: '/',
  },
  {
    title: 'TERMINAL_DB',
    subtitle: 'CATÁLOGO COMPLETO • SISTEMA DE BANCO DE DADOS',
    path: '/terminal',
  },
  {
    title: 'MONITOR',
    subtitle: 'ALERTAS OPERACIONAIS • SINAIS DE RUPTURA',
    path: '/monitor',
  },
  {
    title: 'GROWTH_PLAN',
    subtitle: 'ESTRATÉGIAS VALIDADAS • PLAYBOOK INTELIGENTE',
    path: '/growth',
  },
  {
    title: 'NEURAL_INTEL',
    subtitle: 'MACHINE LEARNING • PREVISÕES E CLUSTERS',
    path: '/ml',
  },
  {
    title: 'PRICE_REACTION',
    subtitle: 'TIMELINE DE PREÇOS • ABSORÇÃO DE MERCADO',
    path: '/price',
  },
  {
    title: 'DATA_EXPLORER',
    subtitle: 'BANCO VISUAL • CONSULTA DIRETA AO SUPABASE',
    path: '/explorer',
  },
  {
    title: 'ACTIVITY_FEED',
    subtitle: 'TIMELINE DE EVENTOS • SISTEMA & OPERAÇÕES',
    path: '/activity',
  },
  {
    title: 'SYNC_CONTROL',
    subtitle: 'PIPELINE DUCKDB ↔ SUPABASE',
    path: '/sync',
  },
  {
    title: 'GLOBAL_SEARCH',
    subtitle: 'BUSCA INTEGRADA • TODAS AS TABELAS',
    path: '/search',
  },
  {
    title: 'AD_FACTORY',
    subtitle: 'KANBAN • CRIAÇÃO DE ANÚNCIOS',
    path: '/adfactory',
  },
  {
    title: 'ADS_RADAR',
    subtitle: 'INTELIGÊNCIA TÁTICA • WINNERS / MONITOR / KILL',
    path: '/ads-radar',
  },
  {
    title: 'SETTINGS',
    subtitle: 'PREFERÊNCIAS DO DASHBOARD',
    path: '/settings',
  },
]

export const routes: RouteObject[] = [
  { path: '/', element: <VisaoGeral /> },
  { path: '/terminal', element: <TerminalDB /> },
  { path: '/monitor', element: <Monitor /> },
  { path: '/growth', element: <GrowthPlan /> },
  { path: '/ml', element: <MLIntel /> },
  { path: '/price', element: <PriceTimeline /> },
  { path: '/explorer', element: <DataExplorer /> },
  { path: '/activity', element: <ActivityFeed /> },
  { path: '/sync', element: <SyncControl /> },
  { path: '/search', element: <GlobalSearch /> },
  { path: '/adfactory', element: <AdFactory /> },
  { path: '/ads-radar', element: <AdsRadar /> },
  { path: '/settings', element: <Settings /> },
]

export const getRouteMeta = (path: string): RouteMeta | undefined =>
  routesMeta.find((meta) => meta.path === path)
