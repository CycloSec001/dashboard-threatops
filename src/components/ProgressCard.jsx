import { motion } from 'framer-motion'
import { MdAttachMoney } from 'react-icons/md'
import { HiOutlineCheckBadge } from 'react-icons/hi2'

const stats = [
  { id: 'points',      icon: MdAttachMoney,       label: '1,432 Threats Blocked' },
  { id: 'completions', icon: HiOutlineCheckBadge,  label: '12 Active Alerts' },
]

export default function ProgressCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="flex flex-col rounded-[14px] glass-panel p-5"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-semibold text-htb-text">System Status</h3>
        <a href="#" className="text-htb-green text-[12.5px] font-semibold hover:text-htb-greenlt transition-colors">
          View
        </a>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {stats.map(({ id, icon: Icon, label }) => (
          <motion.div
            key={id}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center justify-center gap-3 bg-white/[0.03] rounded-[10px] py-6"
          >
            <Icon className="text-[32px] text-htb-muted" />
            <span className="text-[12.5px] font-medium text-htb-text">{label}</span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
