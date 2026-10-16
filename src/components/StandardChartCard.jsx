import { motion } from 'framer-motion'
import { MdRefresh } from 'react-icons/md'
import { CHART_SIZES } from '../utils/chartSizes'

export default function StandardChartCard({ title, type = 'default', isLoading = false, isEmpty = false, children, headerRight = null }) {
  const sizes = CHART_SIZES[type] || CHART_SIZES.default

  return (
    <div 
      className="flex flex-col bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] overflow-hidden p-3.5 transition-all duration-200 hover:border-white/[0.12]" 
      style={{ height: sizes.container }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
          {title}
        </span>
        {headerRight}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <MdRefresh size={20} className="text-cyan-400/60" />
          </motion.div>
        </div>
      ) : isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-[11px] text-slate-500">
          No data for selected period
        </div>
      ) : (
        <div className="flex-1" style={{ height: sizes.content }}>
          {children}
        </div>
      )}
    </div>
  )
}