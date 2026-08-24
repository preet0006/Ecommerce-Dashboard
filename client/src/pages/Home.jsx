import React from 'react'
import KpiGrid from '../components/dashboard/KpiGrid'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import ChannelMarginBars from '../components/dashboard/ChannelMarginBars'
import WhatIfSimulator from '../components/dashboard/WhatIfSimulator'

const Home = () => {
  return (
 <div className="flex-1 flex flex-col min-w-0">
        
        <main className="flex-1 p-6 flex flex-col gap-6">
          <KpiGrid />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AlertsPanel />
            </div>
            <ChannelMarginBars />
          </div>

          <WhatIfSimulator />
        </main>
      </div>
  )
}

export default Home