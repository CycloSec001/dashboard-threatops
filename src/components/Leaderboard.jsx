import { motion } from 'framer-motion'

const top3 = [
  { rank: 2, name: 'api-gateway', pts: 82 },
  { rank: 1, name: 'core-db-01',  pts: 95 },
  { rank: 3, name: 'web-front-a', pts: 76 },
]

function PodiumItem({ rank, name, pts }) {
  const isFirst = rank === 1
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      style={{ transform: isFirst ? 'translateY(-16px)' : 'translateY(0)' }}
    >
      <div
        className={`rounded-full flex items-center justify-center font-bold transition-all
          ${isFirst
            ? 'w-14 h-14 text-[18px] bg-white/12 border-2 border-white/25 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
            : 'w-12 h-12 text-[15px] bg-white/6 border border-white/12'
          } text-htb-text`}
      >
        {rank}
      </div>
      <span className="text-[12.5px] font-semibold text-htb-text">{name}</span>
      <span className="text-[11px] text-htb-muted">Risk: {pts}</span>
    </motion.div>
  )
}

export default function Leaderboard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="flex flex-col rounded-[14px] glass-panel p-5"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-semibold text-htb-text">Top At-Risk Assets</h3>
        <a href="#" className="text-htb-green text-[12.5px] font-semibold hover:text-htb-greenlt transition-colors">
          View
        </a>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-8 mb-6 pt-2">
        {top3.map(p => <PodiumItem key={p.rank} {...p} />)}
      </div>

      {/* Overall Risk */}
      <div className="flex justify-between items-center bg-white/[0.03] rounded-[8px] px-4 py-2.5">
        <span className="text-[12.5px] text-htb-muted">Overall Risk Level</span>
        <span className="text-[13px] font-bold text-htb-text text-yellow-500">MODERATE</span>
      </div>
    </motion.section>
  )
}
