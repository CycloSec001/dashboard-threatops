import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdKeyboardArrowDown, MdMenu,
  MdOutlinePerson, MdOutlineSettings, MdLogout, MdCheck,
} from 'react-icons/md'
import { logout } from '../api/client'

const timeFilters = ['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days']

const USER_MENU = [
  { label: 'Profile',     icon: MdOutlinePerson,   tab: 'account',   divider: false },
  { label: 'Settings',    icon: MdOutlineSettings,  tab: 'general',   divider: false },
  { label: 'Logout',      icon: MdLogout,            tab: null,        divider: true,  danger: true },
]

export default function Navbar({
  toggleSidebar,
  selectedTime,
  setSelectedTime,
  setActive,
  avatarSrc,
  backendStatus = { online: false },
  currentUser = null,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [timeFilterOpen, setTimeFilterOpen] = useState(false)

  const handleUserMenuClick = (item) => {
    if (item.tab) {
      setActive('settings', item.tab)
    } else if (item.label === 'Logout') {
      logout()
      if (setActive) setActive('overview')
    }
    setDropdownOpen(false)
  }

  return (
    <header className="app-navbar relative z-50 flex flex-shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-3 bg-[#070b11]/95 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <button
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle Sidebar"
        >
          <MdMenu className="text-[26px]" />
        </button>
        <span className="text-white font-semibold text-[16px] tracking-wide">Threatops</span>
      </div>

      {/* Right side */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Backend Status Badge */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-[11px] font-mono"
          title={backendStatus.online ? `Connected to CycloSec backend (${currentUser?.tenant_id || 'authorized tenant'})` : 'CycloSec backend unavailable'}
        >
          <span className={`w-2 h-2 rounded-full ${backendStatus.online ? 'bg-htb-green shadow-[0_0_8px_rgba(57,255,106,0.6)] animate-pulse' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`} />
          <span className="text-slate-300 font-medium">
            {backendStatus.online ? (currentUser?.tenant_id || 'Connected') : 'Offline'}
          </span>
        </div>

        {/* Time Filter Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => setTimeFilterOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-[8px] px-2.5 sm:px-3 py-1.5 hover:bg-white/[0.1] hover:border-white/[0.18] transition-colors duration-150"
          >
            <span className="hidden sm:inline text-[13px] font-medium text-slate-200">{selectedTime}</span>
            <motion.span animate={{ rotate: timeFilterOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <MdKeyboardArrowDown className="text-slate-400 text-[16px]" />
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {timeFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-36 glass-dropdown rounded-lg overflow-hidden z-50 py-1"
              >
                {timeFilters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSelectedTime(filter)
                      setTimeFilterOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-[12.5px] transition-colors ${
                      selectedTime === filter ? 'text-emerald-400 bg-white/[0.06] font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Chip */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-[20px] py-1.5 pl-1.5 pr-3 hover:bg-white/[0.08] hover:border-white/[0.14] transition-colors duration-150"
          >
            <div className="w-[30px] h-[30px] rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[13px] flex-shrink-0">
              {(currentUser?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-semibold text-slate-200 leading-tight">
                {currentUser?.email ? currentUser.email.split('@')[0] : 'Admin'}
              </span>
              <span className="text-[9.5px] text-slate-400 leading-tight">
                {currentUser?.role || 'tenant_admin'}
              </span>
            </div>
            <motion.span
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <MdKeyboardArrowDown className="text-slate-400 text-[18px]" />
            </motion.span>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 glass-modal rounded-xl overflow-hidden z-50 shadow-2xl"
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
                  <p className="text-[13px] font-semibold text-white truncate">
                    {currentUser?.email ? currentUser.email.split('@')[0] : 'CycloSec Operator'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {currentUser?.email || 'N/A'}
                  </p>
                  <span className="inline-block mt-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-htb-green/10 text-htb-green border border-htb-green/20">
                    {currentUser?.role || 'N/A'}
                  </span>
                </div>

                <div className="py-1.5">
                  {USER_MENU.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label}>
                        {item.divider && <div className="my-1 border-t border-white/[0.08]" />}
                        <button
                          onClick={() => handleUserMenuClick(item)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors
                            ${item.danger
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                          <Icon className="text-[16px]" />
                          {item.label}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
