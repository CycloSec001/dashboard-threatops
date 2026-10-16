// import { useState } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { MdMinimize, MdCropSquare, MdClose, MdSwapHoriz } from 'react-icons/md'
// import { RiDraggable } from 'react-icons/ri'
// import KpiExpandModal from './KpiExpandModal'
// import { CHART_SIZES } from '../utils/chartSizes'

// export default function KpiCard({
//   id, title, value, subtext, trend, color,
//   dragHandleProps = null,
//   onResize,
//   selectedTime = 'Last 24 Hours',
// }) {
//   const [isMinimized, setIsMinimized] = useState(false)
//   const [isMaximized, setIsMaximized] = useState(false)

//   const kpiData = { id, title, value, subtext, trend, color }

//   return (
//     <>
//       {/* ── Full-page expand modal ──────────────────────────────────────── */}
//       <AnimatePresence>
//         {isMaximized && (
//           <KpiExpandModal
//             kpi={kpiData}
//             timeRange={selectedTime}
//             onClose={() => setIsMaximized(false)}
//           />
//         )}
//       </AnimatePresence>

//       {/* ── Normal card ────────────────────────────────────────────────── */}
//       <motion.div
//         {...dragHandleProps}
//         whileHover={!isMinimized ? { y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.45)' } : {}}
//         className={`kpi-glass-card flex flex-col justify-center rounded-[12px] border border-white/[0.08] px-4 py-3 relative overflow-hidden transition-colors ${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
//         style={{ height: isMinimized ? 'auto' : CHART_SIZES.kpi.default.height }}
//       >
//         {/* Decorative top border glow */}
//         <div className="absolute top-0 left-0 w-full h-0.5 z-10" style={{ backgroundColor: color, opacity: 0.8 }} />

//         {/* Header */}
//         <div className="flex items-center justify-between mb-2 relative z-10 w-full min-w-0">
//           <span 
//             className="text-[12px] font-semibold text-slate-200 uppercase tracking-wider leading-[1.25]"
//             style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
//           >
//             {title}
//           </span>

//           <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
//             {onResize && (
//               <button
//                 onClick={onResize}
//                 className="hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
//                 title="Change Width"
//               >
//                 <MdSwapHoriz size={14} />
//               </button>
//             )}
//             <button
//               onClick={() => setIsMinimized(v => !v)}
//               className="hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
//               title={isMinimized ? 'Expand' : 'Minimize'}
//             >
//               <MdMinimize size={14} />
//             </button>
//             <button
//               onClick={() => setIsMaximized(true)}
//               className="hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
//               title="Expand full view"
//             >
//               <MdCropSquare size={14} />
//             </button>
//           </div>
//         </div>

//         <AnimatePresence>
//           {!isMinimized && (
//             <motion.div
//               initial={{ height: 0, opacity: 0 }}
//               animate={{ height: 'auto', opacity: 1 }}
//               exit={{ height: 0, opacity: 0 }}
//               transition={{ duration: 0.2 }}
//               className="overflow-hidden relative z-10"
//             >
//               <div className="flex items-end gap-3 mb-1">
//                 <span className="text-3xl font-bold text-white leading-none whitespace-nowrap">
//                   {value}
//                 </span>
//               </div>
//               <div className="flex items-center gap-2 mt-2 text-[12px]">
//                 <span className="font-semibold" style={{ color }}>
//                   {trend}
//                 </span>
//                 <span className="text-slate-400">{subtext}</span>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </>
//   )
// }



import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdMinimize, MdCropSquare, MdClose, MdSwapHoriz } from 'react-icons/md'
import { RiDraggable } from 'react-icons/ri'
import KpiExpandModal from './KpiExpandModal'
import { CHART_SIZES } from '../utils/chartSizes'

export default function KpiCard({
  id, title, value, subtext, trend, color,
  dragHandleProps = null,
  onResize,
  selectedTime = 'Last 24 Hours',
}) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const kpiData = { id, title, value, subtext, trend, color }

  return (
    <>
      {/* ── Full-page expand modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {isMaximized && (
          <KpiExpandModal
            kpi={kpiData}
            timeRange={selectedTime}
            onClose={() => setIsMaximized(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Normal card ────────────────────────────────────────────────── */}
      <motion.div
        {...dragHandleProps}
        whileHover={!isMinimized ? { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' } : {}}
        className={`bg-black/5 backdrop-blur-[1px] border border-white/[0.05] flex flex-col justify-between rounded-[10px] px-3 py-2 relative overflow-hidden transition-colors ${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ height: isMinimized ? 'auto' : '95px' }}
      >
        {/* Decorative top border glow */}
        <div className="absolute top-0 left-0 w-full h-0.5 z-10" style={{ backgroundColor: color, opacity: 0.8 }} />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10 w-full min-w-0">
          <span 
            className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider leading-tight truncate"
            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          >
            {title}
          </span>

          <div className="flex items-center gap-0.5 text-slate-400 flex-shrink-0">
            {onResize && (
              <button
                onClick={onResize}
                className="hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
                title="Change Width"
              >
                <MdSwapHoriz size={12} />
              </button>
            )}
            <button
              onClick={() => setIsMinimized(v => !v)}
              className="hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <MdMinimize size={12} />
            </button>
            <button
              onClick={() => setIsMaximized(true)}
              className="hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
              title="Expand full view"
            >
              <MdCropSquare size={12} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden relative z-10 flex flex-col justify-center flex-1"
            >
              <div className="flex items-baseline">
                {/* Main value font size reduced */}
                <span className="text-xl font-bold text-white leading-none whitespace-nowrap">
                  {value}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                {/* Trend ko bilkul change nahi kiya gaya hai */}
                <span className="font-semibold" style={{ color }}>
                  {trend}
                </span>
                <span className="text-slate-400 truncate">{subtext}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}