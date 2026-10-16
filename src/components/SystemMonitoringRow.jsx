import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MdMemory, 
  MdOutlineStorage, 
  MdOutlineRouter,
  MdDataUsage
} from 'react-icons/md'

function MiniMetricCard({ title, icon: Icon, percentage, color, valueStr }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="kpi-glass-card border border-white/[0.08] rounded-[12px] p-4 flex flex-col justify-between gap-3 relative overflow-hidden"
    >
      <div className="flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon size={16} />
          </div>
          <span className="text-[12px] font-medium text-slate-200">{title}</span>
        </div>
        <span className="text-[14px] font-bold text-white whitespace-nowrap">{percentage}%</span>
      </div>
      
      <div className="z-10 relative flex justify-between items-end">
        <span className="text-[11px] text-slate-400">{valueStr}</span>
      </div>

      {/* Progress Bar Background */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.08] z-10">
        <motion.div 
          className="h-full" 
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

export default function SystemMonitoringRow() {
  // Mock live data for the system
  const [metrics, setMetrics] = useState({
    cpu: 42,
    memory: 68,
    disk: 35,
    network: 15
  })

  // Simulate real-time updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() * 6 - 3))),
        disk: prev.disk, // Disk doesn't change as fast
        network: Math.max(2, Math.min(80, prev.network + (Math.random() * 20 - 10)))
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const cards = useMemo(() => [
    { 
      id: 'cpu', 
      title: 'CPU Usage', 
      icon: MdMemory, 
      percentage: Math.round(metrics.cpu), 
      color: metrics.cpu > 80 ? '#FF4D4F' : '#00D9FF',
      valueStr: '3.2 GHz / 16 Cores'
    },
    { 
      id: 'mem', 
      title: 'Memory Usage', 
      icon: MdDataUsage, 
      percentage: Math.round(metrics.memory), 
      color: metrics.memory > 85 ? '#FF4D4F' : '#a855f7',
      valueStr: `${((metrics.memory / 100) * 64).toFixed(1)} GB / 64 GB`
    },
    { 
      id: 'disk', 
      title: 'Disk Usage', 
      icon: MdOutlineStorage, 
      percentage: Math.round(metrics.disk), 
      color: metrics.disk > 90 ? '#FF4D4F' : '#FFC107',
      valueStr: '350 GB / 1 TB'
    },
    { 
      id: 'net', 
      title: 'Network Traffic', 
      icon: MdOutlineRouter, 
      percentage: Math.round(metrics.network), 
      color: '#39FF6A',
      valueStr: `${(metrics.network * 2.5).toFixed(1)} Mbps In / ${(metrics.network * 1.2).toFixed(1)} Mbps Out`
    }
  ], [metrics])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      {cards.map(card => (
        <MiniMetricCard key={card.id} {...card} />
      ))}
    </div>
  )
}
