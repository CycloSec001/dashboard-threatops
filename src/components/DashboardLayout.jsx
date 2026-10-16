import React from 'react';
import SystemMonitoring from './SystemMonitoring';
import KpiCard from './KpiCard';
import { ChartCard } from './Charts';

export default function DashboardLayout({ 
  monitoringConfig, 
  kpis = [], 
  charts = [], 
  tableComponent = null,
  selectedTime = 'Last 24 Hours' 
}) {
  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide bg-grid"
      style={{
        backgroundColor: '#070B11',
      }}
    >
      <div className="flex flex-col gap-5 px-4 md:px-6 lg:px-8 pb-8 pt-4">
        
        {/* 1. System Monitoring */}
        <SystemMonitoring config={monitoringConfig} />

        {/* 2. KPI Cards */}
        {(() => {
          const kpiList = Array.isArray(kpis) ? kpis : Object.values(kpis || {})
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-2">
              {kpiList.map((kpi) => (
                <div key={kpi.id || kpi.key || Math.random()}>
                  <KpiCard {...kpi} selectedTime={selectedTime} />
                </div>
              ))}
            </div>
          )
        })()}

        {/* 3. Charts (2x2 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
          {charts.map((chart, index) => (
            <ChartCard key={index} title={chart.title}>
              {chart.content}
            </ChartCard>
          ))}
        </div>

        {/* 4. Table */}
        {tableComponent && (
          <div className="mt-2">
            {tableComponent}
          </div>
        )}

      </div>
    </div>
  );
}
