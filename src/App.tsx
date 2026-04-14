// GS-QUAD Dashboard v3.0.1 - AdFactory Manual Trigger Patch
import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { VisaoGeral } from './views/VisaoGeral'
import { TerminalDB } from './views/TerminalDB'
import { Monitor } from './views/Monitor'
import { GrowthPlan } from './views/GrowthPlan'
import { MLIntel } from './views/MLIntel'
import { PriceTimeline } from './views/PriceTimeline'
import { AdFactory } from './views/AdFactory'
import { useIAAlertas, useStockAlerts } from './hooks/useSupabaseData'

type ViewId = 'visao' | 'curva' | 'monitor' | 'growth' | 'ml_intel' | 'price_history' | 'adfactory'

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('visao')
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null)
  const { data: alertas } = useIAAlertas()
  const { data: stockAlerts } = useStockAlerts()

  const handleSelectSku = (sku: string) => {
    setSelectedSkuId(sku)
    setActiveView('curva')
  }

  const totalAlerts = (alertas?.length || 0) + (stockAlerts?.length || 0)

  return (
    <Layout activeView={activeView} onNavigate={setActiveView} alertCount={totalAlerts}>
      {activeView === 'visao' && <VisaoGeral />}
      {activeView === 'curva' && <TerminalDB preSelectedSkuId={selectedSkuId} />}
      {activeView === 'monitor' && <Monitor onSelectSku={handleSelectSku} />}
      {activeView === 'growth' && <GrowthPlan />}

      {activeView === 'ml_intel' && <MLIntel onSelectSku={handleSelectSku} />}
      {activeView === 'price_history' && <PriceTimeline />}
      {activeView === 'adfactory' && <AdFactory />}
    </Layout>
  )
}