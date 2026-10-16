// import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
// import { MdArrowForwardIos, MdWarning, MdError, MdHourglassEmpty, MdOutlineTimer } from 'react-icons/md'
// import { FiArrowUp, FiArrowDown } from 'react-icons/fi'

// // ─────────────────────────────────────────────
// //  TrendIndicator — Renders tiny percentage trend
// // ─────────────────────────────────────────────
// export const TrendIndicator = ({ trend }) => {
//   if (!trend) return null;
//   const { value, label, direction, color } = trend;
//   const colorMap = {
//     red:    'text-rose-400 bg-rose-500/15 border-rose-500/25',
//     green:  'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
//     orange: 'text-amber-400 bg-amber-500/15 border-amber-500/25',
//     blue:   'text-cyan-400 bg-cyan-500/15 border-cyan-500/25',
//     purple: 'text-purple-400 bg-purple-500/15 border-purple-500/25',
//     gray:   'text-slate-400 bg-slate-500/15 border-slate-500/25'
//   };
//   const cClass = colorMap[color] || 'text-slate-400 bg-slate-500/15 border-slate-500/25';
//   const cleanVal = String(value).replace(/^[+-]\s*/, '');
//   const prefix = direction === 'up' ? '+' : direction === 'down' ? '-' : '';

//   return (
//     <div className="flex items-center gap-1.5 mt-1 flex-wrap min-w-0">
//       <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9.5px] font-semibold font-mono tracking-tight ${cClass}`}>
//         {direction === 'up' ? <FiArrowUp size={8.5} strokeWidth={3} /> : direction === 'down' ? <FiArrowDown size={8.5} strokeWidth={3} /> : null}
//         {prefix}{cleanVal}
//       </span>
//       {label && <span className="text-[9.5px] text-slate-500 font-normal truncate">{label}</span>}
//     </div>
//   )
// }

// // ─────────────────────────────────────────────
// //  Internal wrapper — handles the drill-down click and states
// // ─────────────────────────────────────────────
// const CardWrapper = ({ title, subtitle, icon: Icon, iconColor, dataState = 'ready', routeKey, setActive, children, className = '', footerLeft, footerRight }) => {
//   const clickable = routeKey && setActive && dataState === 'ready'
  
//   // Render States Overlay
//   const renderState = () => {
//     switch (dataState) {
//       case 'loading':
//         return (
//           <div className="absolute inset-0 bg-[#0a0f19]/80 backdrop-blur-[3px] flex flex-col items-center justify-center rounded-[12px] z-10">
//             <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
//             <span className="text-[10px] text-slate-400">Loading...</span>
//           </div>
//         )
//       case 'error':
//         return (
//           <div className="absolute inset-0 bg-[#0a0f19]/90 flex flex-col items-center justify-center rounded-[12px] z-10">
//             <MdError className="text-rose-500 mb-1" size={20} />
//             <span className="text-[11px] text-slate-300">Failed to load</span>
//           </div>
//         )
//       case 'empty':
//         return (
//           <div className="absolute inset-0 bg-[#0a0f19]/90 flex flex-col items-center justify-center rounded-[12px] z-10">
//             <MdHourglassEmpty className="text-slate-500 mb-1" size={20} />
//             <span className="text-[11px] text-slate-400">No data found</span>
//           </div>
//         )
//       default: return null;
//     }
//   }

//   return (
//     <div
//       onClick={() => clickable && setActive(routeKey)}
//       className={`kpi-glass-card rounded-[12px] p-3 flex flex-col h-[146px] justify-between group relative overflow-hidden
//         ${clickable ? 'cursor-pointer hover:border-cyan-500/40' : ''}
//         ${className}`}
//     >
//       {renderState()}
      
//       {/* Header: [ICON]  KPI TITLE with flexible wrapping and no overflow */}
//       <div className="flex items-start gap-2 relative z-10 w-full min-w-0">
//         {Icon && (
//           <div className="w-5 h-5 rounded-[5px] bg-white/[0.05] border border-white/[0.10] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
//             <Icon size={12} style={{ color: iconColor }} />
//           </div>
//         )}
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-1 w-full min-w-0">
//             <p 
//               className="text-[11px] font-medium text-slate-200 leading-[1.25] group-hover:text-white transition-colors"
//               style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
//               title={title}
//             >
//               {title}
//             </p>
//             {dataState === 'partial' && <MdWarning className="text-amber-400 flex-shrink-0" title="Partial Data" size={11}/>}
//             {dataState === 'stale' && <MdOutlineTimer className="text-cyan-400 flex-shrink-0" title="Stale Data" size={11}/>}
//           </div>
//           {subtitle && <p className="text-[9px] text-slate-400 leading-tight mt-0.5 truncate">{subtitle}</p>}
//         </div>

//         {clickable && (
//           <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 ml-auto flex-shrink-0 mt-0.5">
//             <MdArrowForwardIos className="text-cyan-400" size={10} />
//           </div>
//         )}
//       </div>
      
//       {/* Content Area */}
//       <div className="flex-1 flex flex-col justify-between relative z-10 min-w-0 w-full mt-2">
//         <div className={`h-full flex flex-col justify-between min-w-0 w-full ${dataState !== 'ready' && dataState !== 'partial' && dataState !== 'stale' ? 'opacity-0' : ''}`}>
//           {children}
//         </div>
//       </div>

//       {/* Footer if present */}
//       {(footerLeft || footerRight) && (
//         <div className="mt-1.5 pt-1.5 border-t border-white/[0.06] flex justify-between items-center text-[10px] text-slate-400 font-medium z-10 relative min-w-0">
//           <div className="truncate">{footerLeft}</div>
//           {footerRight && (
//             <div 
//               className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0" 
//               onClick={(e) => { e.stopPropagation(); if (routeKey && setActive) setActive(routeKey) }}
//             >
//               {footerRight}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// // ─────────────────────────────────────────────
// //  KpiBigNumber — for Counts
// // ─────────────────────────────────────────────
// export const KpiBigNumber = ({ title, subtitle, icon, iconColor, trend, dataState, value, label, routeKey, setActive, color = 'text-white', footerLeft, footerRight }) => {
//   return (
//     <CardWrapper title={title} subtitle={subtitle} icon={icon} iconColor={iconColor} dataState={dataState} routeKey={routeKey} setActive={setActive} footerLeft={footerLeft} footerRight={footerRight}>
//       <div className="flex flex-col justify-between h-full w-full min-w-0">
//         <div className="flex flex-col justify-center flex-1 my-auto">
//           <div className="flex items-baseline gap-1.5 min-w-0">
//             <span className={`text-[25px] font-bold tracking-tight ${color} leading-none font-sans whitespace-nowrap`}>
//               {typeof value === 'number' ? value.toLocaleString() : value}
//             </span>
//             {label && <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</span>}
//           </div>
//         </div>
//         <div className="mt-auto pt-1">
//           <TrendIndicator trend={trend} />
//         </div>
//       </div>
//     </CardWrapper>
//   )
// }

// // ─────────────────────────────────────────────
// //  KpiSparkline — for Durations / Trending counts
// // ─────────────────────────────────────────────
// export const KpiSparkline = ({ title, subtitle, icon, iconColor, trend, dataState, value, label, data, dataKey = 'value', routeKey, setActive, color = '#3b82f6' }) => {
//   return (
//     <CardWrapper title={title} subtitle={subtitle} icon={icon} iconColor={iconColor} dataState={dataState} routeKey={routeKey} setActive={setActive}>
//       <div className="flex flex-col justify-between h-full w-full min-w-0">
//         <div className="flex justify-between items-end w-full min-w-0 gap-1 mt-auto">
//           <div className="flex flex-col justify-end min-w-0 flex-shrink-0">
//             <span className="text-[20px] font-bold tracking-tight text-white leading-none font-sans whitespace-nowrap">{value}</span>
//             {label && <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{label}</span>}
//             <div className="mt-1">
//               <TrendIndicator trend={trend} />
//             </div>
//           </div>
//           <div className="flex-1 min-w-[36px] max-w-[70px] h-[36px] flex-shrink-0 mb-0.5">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={data || []} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
//                 <YAxis domain={['auto', 'auto']} hide />
//                 <Line
//                   type="monotone"
//                   dataKey={dataKey}
//                   stroke={color}
//                   strokeWidth={2}
//                   dot={false}
//                   isAnimationActive={false}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>
//     </CardWrapper>
//   )
// }

// // ─────────────────────────────────────────────
// //  KpiGauge — for Risk Scores / Posture Scores
// // ─────────────────────────────────────────────
// export const KpiGauge = ({ title, subtitle, icon, iconColor, dataState, value, label, routeKey, setActive, min = 0, max = 100, colorMode = 'risk', customColor, footerLeft, footerRight }) => {
//   const safeValue = Math.min(Math.max(value || 0, min), max)
//   const percentage = (safeValue - min) / (max - min)

//   let gaugeColor = '#10b981'
//   if (colorMode === 'risk') {
//     gaugeColor = '#10b981'
//     if (percentage > 0.4) gaugeColor = '#f59e0b'
//     if (percentage > 0.7) gaugeColor = '#ef4444'
//   } else {
//     gaugeColor = '#ef4444'
//     if (percentage >= 0.4) gaugeColor = '#f59e0b'
//     if (percentage >= 0.7) gaugeColor = '#10b981'
//   }
  
//   if (customColor) gaugeColor = customColor;

//   const radius = 36
//   const circumference = Math.PI * radius // ~113.1
//   const strokeDashoffset = circumference * (1 - percentage)

//   return (
//     <CardWrapper title={title} subtitle={subtitle} icon={icon} iconColor={iconColor} dataState={dataState} routeKey={routeKey} setActive={setActive} footerLeft={footerLeft} footerRight={footerRight}>
//       <div className="h-full w-full flex items-center justify-center relative mt-auto">
//         <svg className="w-[96px] h-[54px]" viewBox="0 0 96 54">
//           {/* Background track */}
//           <path
//             d="M 12 45 A 36 36 0 0 1 84 45"
//             fill="none"
//             stroke="rgba(255, 255, 255, 0.08)"
//             strokeWidth="5"
//             strokeLinecap="round"
//           />
//           {/* Value arc */}
//           <path
//             d="M 12 45 A 36 36 0 0 1 84 45"
//             fill="none"
//             stroke={gaugeColor}
//             strokeWidth="5"
//             strokeLinecap="round"
//             strokeDasharray={circumference}
//             strokeDashoffset={strokeDashoffset}
//             className="transition-all duration-700 ease-out"
//           />
//         </svg>
//         {/* Centred value label */}
//         <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5 pointer-events-none">
//           <span className="text-[21px] font-bold tracking-tight text-white leading-none font-sans">{value}</span>
//           {label && <span className="text-[8.5px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">{label}</span>}
//         </div>
//       </div>
//     </CardWrapper>
//   )
// }

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { MdArrowForwardIos, MdWarning, MdError, MdHourglassEmpty, MdOutlineTimer } from 'react-icons/md'
import { FiArrowUp, FiArrowDown } from 'react-icons/fi'

// ─────────────────────────────────────────────
//  TrendIndicator — UNTOUCHED (Aapke kehne par isko change nahi kiya)
// ─────────────────────────────────────────────
export const TrendIndicator = ({ trend }) => {
  if (!trend) return null;
  const { value, label, direction, color } = trend;
  const colorMap = {
    red:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    orange: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    gray:   'text-slate-400 bg-slate-500/10 border-slate-500/20'
  };
  const cClass = colorMap[color] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  const cleanVal = String(value).replace(/^[+-]\s*/, '');
  const prefix = direction === 'up' ? '+' : direction === 'down' ? '-' : '';

  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap min-w-0">
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9.5px] font-semibold font-mono tracking-tight ${cClass}`}>
        {direction === 'up' ? <FiArrowUp size={8.5} strokeWidth={3} /> : direction === 'down' ? <FiArrowDown size={8.5} strokeWidth={3} /> : null}
        {prefix}{cleanVal}
      </span>
      {label && <span className="text-[9.5px] text-slate-500 font-normal truncate">{label}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────
//  Internal wrapper
// ─────────────────────────────────────────────
const CardWrapper = ({ title, subtitle, icon: Icon, iconColor, dataState = 'ready', routeKey, setActive, children, className = '', footerLeft, footerRight }) => {
  const clickable = routeKey && setActive && dataState === 'ready'
  
  const renderState = () => {
    switch (dataState) {
      case 'loading':
        return (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-[10px] z-10">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-1" />
            <span className="text-[10px] text-slate-400">Loading...</span>
          </div>
        )
      case 'error':
        return (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-[10px] z-10">
            <MdError className="text-rose-500 mb-1" size={18} />
            <span className="text-[10px] text-slate-300">Failed to load</span>
          </div>
        )
      case 'empty':
        return (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-[10px] z-10">
            <MdHourglassEmpty className="text-slate-500 mb-1" size={18} />
            <span className="text-[10px] text-slate-400">No data found</span>
          </div>
        )
      default: return null;
    }
  }

  return (
    <div
      onClick={() => clickable && setActive(routeKey)}
      className={`bg-black/5 backdrop-blur-[1px] border border-white/[0.05] rounded-[10px] p-2.5 flex flex-col h-[100px] justify-between group relative overflow-hidden transition-all duration-200 hover:border-white/[0.12]
        ${clickable ? 'cursor-pointer hover:border-cyan-500/40' : ''}
        ${className}`}
    >
      {renderState()}
      
      {/* Header */}
      <div className="flex items-start gap-1.5 relative z-10 w-full min-w-0">
        {Icon && (
          <div className="w-4.5 h-4.5 rounded-[4px] bg-black/20 border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Icon size={11} style={{ color: iconColor }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 w-full min-w-0">
            <p 
              className="text-[10.5px] font-medium text-slate-200 leading-tight group-hover:text-white transition-colors truncate"
              title={title}
            >
              {title}
            </p>
            {dataState === 'partial' && <MdWarning className="text-amber-400 flex-shrink-0" title="Partial Data" size={10}/>}
            {dataState === 'stale' && <MdOutlineTimer className="text-cyan-400 flex-shrink-0" title="Stale Data" size={10}/>}
          </div>
          {subtitle && <p className="text-[8px] text-slate-400 leading-none mt-0.5 truncate">{subtitle}</p>}
        </div>

        {clickable && (
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 ml-auto flex-shrink-0 mt-0.5">
            <MdArrowForwardIos className="text-cyan-400" size={9} />
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-center relative z-10 min-w-0 w-full my-0.5">
        <div className={`w-full flex flex-col justify-center ${dataState !== 'ready' && dataState !== 'partial' && dataState !== 'stale' ? 'opacity-0' : ''}`}>
          {children}
        </div>
      </div>

      {/* Footer if present */}
      {(footerLeft || footerRight) && (
        <div className="pt-1 border-t border-white/[0.05] flex justify-between items-center text-[9px] text-slate-400 font-medium z-10 relative min-w-0">
          <div className="truncate">{footerLeft}</div>
          {footerRight && (
            <div 
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-0.5 cursor-pointer flex-shrink-0" 
              onClick={(e) => { e.stopPropagation(); if (routeKey && setActive) setActive(routeKey) }}
            >
              {footerRight}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  KpiBigNumber — Font size reduced for value
// ─────────────────────────────────────────────
export const KpiBigNumber = ({ title, subtitle, icon, iconColor, trend, dataState, value, label, routeKey, setActive, color = 'text-white', footerLeft, footerRight }) => {
  return (
    <CardWrapper title={title} subtitle={subtitle} icon={icon} iconColor={iconColor} dataState={dataState} routeKey={routeKey} setActive={setActive} footerLeft={footerLeft} footerRight={footerRight}>
      <div className="flex flex-col justify-center w-full min-w-0">
        <div className="flex items-baseline gap-1.5 min-w-0">
          {/* Font size reduced from [25px] to [19px] */}
          <span className={`text-[19px] font-bold tracking-tight ${color} leading-none font-sans whitespace-nowrap`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {label && <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</span>}
        </div>
        <div>
          <TrendIndicator trend={trend} />
        </div>
      </div>
    </CardWrapper>
  )
}

// ─────────────────────────────────────────────
//  KpiSparkline — Font size reduced for value
// ─────────────────────────────────────────────
export const KpiSparkline = ({ title, subtitle, icon, iconColor, trend, dataState, value, label, data, dataKey = 'value', routeKey, setActive, color = '#3b82f6' }) => {
  return (
    <CardWrapper title={title} subtitle={subtitle} icon={icon} iconColor={iconColor} dataState={dataState} routeKey={routeKey} setActive={setActive}>
      <div className="flex justify-between items-center w-full min-w-0 gap-1">
        <div className="flex flex-col justify-center min-w-0 flex-shrink-0">
          {/* Font size reduced from [20px] to [16px] */}
          <span className="text-[16px] font-bold tracking-tight text-white leading-none font-sans whitespace-nowrap">{value}</span>
          {label && <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{label}</span>}
          <div>
            <TrendIndicator trend={trend} />
          </div>
        </div>
        <div className="flex-1 min-w-[32px] max-w-[65px] h-[30px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <YAxis domain={['auto', 'auto']} hide />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </CardWrapper>
  )
}

// ─────────────────────────────────────────────
//  KpiGauge — Font size reduced for center value
// ─────────────────────────────────────────────
export const KpiGauge = ({ title, subtitle, icon, iconColor, dataState, value, label, routeKey, setActive, min = 0, max = 100, colorMode = 'risk', customColor, footerLeft, footerRight }) => {
  const safeValue = Math.min(Math.max(value || 0, min), max)
  const percentage = (safeValue - min) / (max - min)

  let gaugeColor = '#10b981'
  if (colorMode === 'risk') {
    gaugeColor = '#10b981'
    if (percentage > 0.4) gaugeColor = '#f59e0b'
    if (percentage > 0.7) gaugeColor = '#ef4444'
  } else {
    gaugeColor = '#ef4444'
    if (percentage >= 0.4) gaugeColor = '#f59e0b'
    if (percentage >= 0.7) gaugeColor = '#10b981'
  }
  
  if (customColor) gaugeColor = customColor;

  const radius = 30
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference * (1 - percentage)

  return (
    <CardWrapper title={title} subtitle={subtitle} icon={icon} iconColor={iconColor} dataState={dataState} routeKey={routeKey} setActive={setActive} footerLeft={footerLeft} footerRight={footerRight}>
      <div className="w-full flex items-center justify-center relative">
        <svg className="w-[76px] h-[40px]" viewBox="0 0 96 54">
          <path
            d="M 12 45 A 36 36 0 0 1 84 45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 12 45 A 36 36 0 0 1 84 45"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1 pointer-events-none">
          {/* Font size reduced from [21px] to [16px] */}
          <span className="text-[16px] font-bold tracking-tight text-white leading-none font-sans">{value}</span>
          {label && <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">{label}</span>}
        </div>
      </div>
    </CardWrapper>
  )
}