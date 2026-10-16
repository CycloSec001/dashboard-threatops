import { motion } from 'framer-motion'
import { HiOutlineCube } from 'react-icons/hi2'

const labs = [
  {
    id: 'genesis',
    name: 'Core Firewall - EU',
    emoji: '🧱',
    iconBg: 'bg-purple-500/15 text-purple-400',
    cubeCount: 5,
  },
  {
    id: 'dedicated',
    name: 'AWS K8s Cluster',
    emoji: '☁️',
    iconBg: 'bg-gray-500/15 text-gray-400',
    cubeCount: 4,
  },
  {
    id: 'main',
    name: 'Internal VPN Gateway',
    emoji: '🔐',
    iconBg: 'bg-indigo-500/15 text-indigo-400',
    cubeCount: 6,
  },
]

export default function LabsTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className="rounded-[14px] glass-panel p-5"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-semibold text-htb-text">Active Sensors</h3>
        <a href="#" className="text-htb-green text-[12.5px] font-semibold hover:text-htb-greenlt transition-colors">
          View all
        </a>
      </div>

      {/* Labs list */}
      <ul className="flex flex-col gap-2">
        {labs.map(({ id, name, emoji, iconBg, cubeCount }) => (
          <motion.li
            key={id}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            className="flex items-center justify-between px-4 py-3 rounded-[10px] bg-white/[0.02] cursor-pointer transition-colors duration-150"
          >
            {/* Left: icon + name */}
            <div className="flex items-center gap-4">
              <span
                className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[15px] flex-shrink-0 ${iconBg}`}
              >
                {emoji}
              </span>
              <span className="text-[13px] font-medium text-htb-text">{name}</span>
            </div>

            {/* Right: cubes + count */}
            <div className="flex items-center gap-2">
              <HiOutlineCube className="text-htb-green text-[18px]" />
              <HiOutlineCube className="text-htb-green text-[18px]" />
              <span className="text-[11.5px] text-htb-muted bg-white/[0.08] px-2 py-0.5 rounded-full ml-1">
                +{cubeCount}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  )
}
