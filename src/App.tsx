import { useState } from 'react'
import { Layout } from './components/Layout'
import { VisaoGeral } from './views/VisaoGeral'
import { TerminalDB } from './views/TerminalDB'
import { Monitor } from './views/Monitor'
import { GrowthPlan } from './views/GrowthPlan'
import { Chat } from './views/Chat'
import { MLIntel } from './views/MLIntel'
import { PriceTimeline } from './views/PriceTimeline'
import { useIAAlertas } from './hooks/useSupabaseData'

type ViewId = 'visao' | 'curva' | 'monitor' | 'growth' | 'chat' | 'ml_intel' | 'price_history'

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('visao')
  const { data: alertas } = useIAAlertas()

  return (
    <Layout activeView={activeView} onNavigate={setActiveView} alertCount={alertas.length}>
      {activeView === 'visao' && <VisaoGeral />}
      {activeView === 'curva' && <TerminalDB />}
      {activeView === 'monitor' && <Monitor />}
      {activeView === 'growth' && <GrowthPlan />}
      {activeView === 'chat' && <Chat />}
      {activeView === 'ml_intel' && <MLIntel />}
      {activeView === 'price_history' && <PriceTimeline />}
    </Layout>
  )
}