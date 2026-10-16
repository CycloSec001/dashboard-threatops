import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdOutlinePerson,
  MdOutlineSecurity,
  MdOutlineNotifications,
  MdOutlineVpnKey,
  MdOutlineSettings,
  MdCheck,
  MdClose,
  MdContentCopy,
  MdVisibility,
  MdVisibilityOff,
  MdRefresh,
  MdAdd,
  MdDelete,
  MdChevronRight,
  MdLightMode,
  MdDarkMode,
  MdShield,
  MdKeyboardArrowDown,
  MdBusinessCenter,
  MdGroup,
  MdExtension,
  MdAutorenew,
  MdDataUsage,
  MdListAlt,
  MdEdit,
} from 'react-icons/md'

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'organization',  label: 'Organization',      icon: MdBusinessCenter,       desc: 'Company details & retention' },
  { id: 'users',         label: 'Users & Roles',     icon: MdGroup,                desc: 'Manage team access' },
  { id: 'security',      label: 'Security',          icon: MdOutlineSecurity,      desc: 'Auth, SSO, IP allowlist' },
  { id: 'integrations',  label: 'Integrations',      icon: MdExtension,            desc: 'SIEM, EDR, and tools' },
  { id: 'automation',    label: 'Automation Safety', icon: MdAutorenew,            desc: 'Playbooks & rollbacks' },
  { id: 'notifications', label: 'Notifications',     icon: MdOutlineNotifications, desc: 'Alerts & emails' },
  { id: 'data',          label: 'Data Freshness',    icon: MdDataUsage,            desc: 'Sync health & sources' },
  { id: 'audit',         label: 'Audit Logs',        icon: MdListAlt,              desc: 'System activity history' },
  { id: 'general',       label: 'Preferences',       icon: MdOutlineSettings,      desc: 'Language & theme' },
  { id: 'account',       label: 'My Profile',        icon: MdOutlinePerson,        desc: 'Profile & avatar' },
]

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)',  flag: '🇺🇸' },
  { value: 'en-GB', label: 'English (UK)',  flag: '🇬🇧' },
  { value: 'te',    label: 'Telugu',        flag: '🇮🇳' },
  { value: 'hi',    label: 'Hindi',         flag: '🇮🇳' },
]

const TIMEZONES = [
  { value: 'Asia/Kolkata',     label: '(UTC+05:30) Asia/Kolkata',      offset: '+05:30' },
  { value: 'America/New_York', label: '(UTC-05:00) America/New_York',  offset: '-05:00' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) America/Los_Angeles', offset: '-08:00' },
  { value: 'Europe/London',    label: '(UTC+00:00) Europe/London',     offset: '+00:00' },
  { value: 'Europe/Berlin',    label: '(UTC+01:00) Europe/Berlin',     offset: '+01:00' },
  { value: 'Asia/Tokyo',       label: '(UTC+09:00) Asia/Tokyo',        offset: '+09:00' },
  { value: 'UTC',              label: '(UTC+00:00) UTC',               offset: '+00:00' },
]

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const bg   = type === 'success' ? 'bg-[#0f2018] border-green-500/40' : 'bg-[#200f0f] border-red-500/40'
  const text = type === 'success' ? 'text-green-400' : 'text-red-400'
  const Icon = type === 'success' ? MdCheck : MdClose

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl ${bg}`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        <Icon className={`text-[14px] ${text}`} />
      </div>
      <span className={`text-[13px] font-medium ${text}`}>{message}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 ml-2 transition-colors">
        <MdClose className="text-[14px]" />
      </button>
    </motion.div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, description, children, footer, footerText = "Please save your changes to apply them." }) {
  return (
    <section className="glass-panel rounded-2xl shadow-xl overflow-hidden mb-6">
      {(title || description) && (
        <div className="px-6 py-5 border-b border-white/[0.06] bg-white/[0.02]">
          {title && <h3 className="text-[16px] font-semibold text-white">{title}</h3>}
          {description && <p className="text-[13.5px] text-[#9ca3af] mt-1 leading-relaxed">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-black/30 border-t border-white/[0.06] flex items-center justify-between">
          <div>
             {footerText && <p className="text-[13px] text-[#9ca3af]">{footerText}</p>}
          </div>
          <div>{footer}</div>
        </div>
      )}
    </section>
  )
}

// ─── Field Label ─────────────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2 block">
      {children}
      {required && <span className="text-green-400 ml-1">*</span>}
    </label>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────
function Input({ type = 'text', value, onChange, placeholder, disabled, className = '', rightSlot, ...rest }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full h-[46px] glass-input px-4 text-[13.5px] text-white placeholder-slate-500 rounded-xl transition-all duration-200 outline-none pr-${rightSlot ? '10' : '4'}
          ${focused ? 'border-green-500/60 shadow-[0_0_0_3px_rgba(34,197,94,0.1)]' : 'border-white/[0.08] hover:border-white/[0.15]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        {...rest}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  )
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full h-[46px] bg-[#0c1118] border rounded-xl px-4 text-[13.5px] text-white flex items-center justify-between transition-all duration-200 outline-none
          ${open ? 'border-green-500/60 shadow-[0_0_0_3px_rgba(34,197,94,0.1)]' : 'border-[#1e2530] hover:border-[#2a3444]'}
        `}
      >
        <span className={selected ? 'text-white' : 'text-[#4a5568]'}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.flag && <span>{selected.flag}</span>}
              {selected.label}
            </span>
          ) : placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <MdKeyboardArrowDown className="text-[#7c8a96] text-[18px]" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full glass-modal rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-white/[0.06]">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full glass-input rounded-lg px-3 py-2 text-[13px] text-white placeholder-slate-500 outline-none focus:border-green-500/60"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1 scrollbar-hide">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-[12.5px] text-[#7c8a96]">No results found</p>
              ) : filtered.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left transition-colors
                    ${value === opt.value ? 'bg-green-500/10 text-green-400' : 'text-[#b0bec5] hover:bg-white/[0.04] hover:text-white'}
                  `}
                >
                  {opt.flag && <span className="text-base">{opt.flag}</span>}
                  <span className="flex-1">{opt.label}</span>
                  {value === opt.value && <MdCheck className="text-green-400 text-[14px]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Theme Segmented Toggle ──────────────────────────────────────────────────
function ThemeToggle({ value, onChange }) {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const timerRef = useRef(null)

  const handleLightClick = () => {
    setShowComingSoon(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShowComingSoon(false), 2200)
  }

  const options = [
    { id: 'dark',  label: 'Dark',  icon: MdDarkMode,  available: true },
    { id: 'light', label: 'Light', icon: MdLightMode, available: false },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex bg-[#0c1118] border border-[#1e2530] rounded-xl p-1 gap-1 relative">
        {options.map(opt => {
          const Icon = opt.icon
          const isActive = value === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => {
                if (opt.available) {
                  onChange(opt.id)
                } else {
                  handleLightClick()
                }
              }}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                ${isActive ? 'bg-green-500/15 text-green-400 shadow-sm' : ''}
                ${!opt.available ? 'text-[#7c8a96]/50 hover:text-[#7c8a96] cursor-pointer' : isActive ? '' : 'text-[#7c8a96] hover:text-white'}
              `}
            >
              <Icon className="text-[16px]" />
              {opt.label}
              {!opt.available && (
                <span className="text-[9px] bg-[#1e2530] text-[#7c8a96] px-1.5 py-0.5 rounded-full font-semibold ml-0.5">
                  Soon
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a2030] border border-[#2a3444] rounded-lg w-fit"
          >
            <MdLightMode className="text-yellow-400 text-[14px]" />
            <span className="text-[12px] text-[#b0bec5]">Light mode is coming soon — stay tuned!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Toggle Switch ───────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, id }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50
        ${checked ? 'bg-green-500' : 'bg-[#2a3444]'}
      `}
    >
      <motion.span
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="inline-block w-[18px] h-[18px] rounded-full bg-white shadow-sm"
      />
    </button>
  )
}

// ─── Notification Row ────────────────────────────────────────────────────────
function NotificationRow({ label, description, checked, onChange, id }) {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="pr-8">
        <label htmlFor={id} className="text-[14px] font-medium text-white cursor-pointer">{label}</label>
        {description && <p className="text-[13px] text-[#7c8a96] mt-1 leading-relaxed">{description}</p>}
      </div>
      <ToggleSwitch id={id} checked={checked} onChange={onChange} />
    </div>
  )
}

// ─── Save Button ─────────────────────────────────────────────────────────────
function SaveButton({ isDirty, isSaving, onSave }) {
  return (
    <motion.button
      onClick={onSave}
      disabled={!isDirty || isSaving}
      whileHover={isDirty && !isSaving ? { scale: 1.02 } : {}}
      whileTap={isDirty && !isSaving ? { scale: 0.98 } : {}}
      className={`flex items-center justify-center min-w-[130px] px-4 py-[9px] rounded-xl text-[13.5px] font-semibold transition-all duration-200
        ${isDirty && !isSaving
          ? 'bg-green-500 text-[#0B0F14] hover:bg-green-400 shadow-[0_0_14px_rgba(34,197,94,0.2)] cursor-pointer'
          : 'bg-[#1a2030] text-[#4a5568] cursor-not-allowed'
        }
      `}
    >
      {isSaving ? (
        <>
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="inline-block mr-2">
            <MdRefresh className="text-[16px]" />
          </motion.span>
          Saving…
        </>
      ) : (
        'Save Changes'
      )}
    </motion.button>
  )
}

// ─── TABS IMPLEMENTATION ─────────────────────────────────────────────────────

// 1. Organization Tab
function OrganizationTab({ onDirty }) {
  const [form, setForm] = useState({
    name: 'ThreatOps Corp', id: 'ORG-9834-X2', industry: 'Cybersecurity', 
    timezone: 'UTC', timeRange: 'Last 24 Hours', retention: '90 Days'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty]   = useState(false)

  const update = (key) => (e) => { 
    const val = e.target ? e.target.value : e;
    setForm(p => ({ ...p, [key]: val })); 
    setIsDirty(true); onDirty(true); 
  }

  const handleSave = async () => {
    setIsSaving(true); await new Promise(r => setTimeout(r, 800)); setIsSaving(false)
    setIsDirty(false); onDirty(false); onDirty('toast:Organization settings saved.')
  }

  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="Organization Details" description="Core information identifying your tenant." footer={<SaveButton isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <FieldLabel required>Organization Name</FieldLabel>
            <Input value={form.name} onChange={update('name')} />
          </div>
          <div>
            <FieldLabel>Organization ID (Read-only)</FieldLabel>
            <Input value={form.id} disabled />
          </div>
          <div>
            <FieldLabel>Industry</FieldLabel>
            <CustomSelect value={form.industry} onChange={update('industry')} options={[
              { value: 'Cybersecurity', label: 'Cybersecurity' }, { value: 'Finance', label: 'Finance' }, { value: 'Healthcare', label: 'Healthcare' }
            ]} />
          </div>
        </div>
      </SectionCard>
      
      <SectionCard title="Data & Preferences" description="Default global settings for analytics and data storage.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <FieldLabel>Default Time Range</FieldLabel>
            <CustomSelect value={form.timeRange} onChange={update('timeRange')} options={[
              { value: 'Last 1 Hour', label: 'Last 1 Hour' }, { value: 'Last 24 Hours', label: 'Last 24 Hours' }, { value: 'Last 7 Days', label: 'Last 7 Days' }
            ]} />
          </div>
          <div>
            <FieldLabel>Data Retention Period</FieldLabel>
            <CustomSelect value={form.retention} onChange={update('retention')} options={[
              { value: '30 Days', label: '30 Days' }, { value: '90 Days', label: '90 Days' }, { value: '1 Year', label: '1 Year' }
            ]} />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// 2. Users & Roles Tab
function UsersRolesTab() {
  const users = [
    { name: 'Poojitha Reddy', email: 'poojitha24@gmail.com', role: 'Admin', dept: 'Security Engineering', status: 'Active', lastLogin: '2 mins ago', mfa: true },
    { name: 'Alex Carter', email: 'alex.c@threatops.com', role: 'Security Analyst', dept: 'SOC', status: 'Active', lastLogin: '1 hour ago', mfa: true },
    { name: 'Sarah Jin', email: 's.jin@threatops.com', role: 'Investigator', dept: 'Incident Response', status: 'Inactive', lastLogin: '12 days ago', mfa: false },
    { name: 'Marcus Bell', email: 'mbell@threatops.com', role: 'Viewer', dept: 'Management', status: 'Active', lastLogin: '4 hours ago', mfa: true },
  ]

  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="User Management" description="Provision users and assign roles based on least privilege principles.">
        <div className="mb-4 flex justify-end">
          <button className="flex items-center gap-2 bg-green-500 text-[#0B0F14] px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-green-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <MdAdd className="text-[16px]" /> Invite User
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#1e2530]">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-[#111823] text-[#7c8a96] uppercase font-semibold text-[11px] border-b border-[#1e2530]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-center">MFA</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2530]">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-[12px] text-[#7c8a96]">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-white"><span className="bg-[#1e2530] px-2 py-1 rounded-md text-[11px] font-mono">{u.role}</span></td>
                  <td className="px-4 py-3 text-[#7c8a96]">{u.dept}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${u.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#7c8a96]">{u.lastLogin}</td>
                  <td className="px-4 py-3 text-center">
                    {u.mfa ? <MdCheck className="text-green-400 inline-block text-[16px]" /> : <MdClose className="text-red-400 inline-block text-[16px]" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-[#7c8a96] hover:text-white transition-colors p-1"><MdEdit className="text-[16px]" /></button>
                    <button className="text-[#7c8a96] hover:text-red-400 transition-colors p-1 ml-1"><MdDelete className="text-[16px]" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

// 3. Security Tab
function SecurityTab({ onDirty }) {
  const [sec, setSec] = useState({ mfa: true, sso: true, passwordPolicy: 'Strict', sessionTimeout: '30 mins', loginSecurity: true })
  const [isDirty, setIsDirty] = useState(false); const [isSaving, setIsSaving] = useState(false)
  const toggle = (k) => { setSec(p => ({...p, [k]: !p[k]})); setIsDirty(true); onDirty(true) }
  const update = (k) => (v) => { setSec(p => ({...p, [k]: v})); setIsDirty(true); onDirty(true) }

  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="Authentication Policies" description="Enforce global login security standards." footer={<SaveButton isDirty={isDirty} isSaving={isSaving} onSave={async () => { setIsSaving(true); await new Promise(r=>setTimeout(r,800)); setIsSaving(false); setIsDirty(false); onDirty(false); onDirty('toast:Security settings updated.') }} />}>
        <div className="-mx-6 -my-6 border-b border-[#1e2530]/60 mb-6 pb-2">
          <div className="px-6 border-b border-[#1e2530]/60 hover:bg-[#111823]/30">
            <NotificationRow id="mfa" label="Require MFA for all users" description="Enforce Multi-Factor Authentication universally." checked={sec.mfa} onChange={() => toggle('mfa')} />
          </div>
          <div className="px-6 hover:bg-[#111823]/30">
            <NotificationRow id="sso" label="Enable SSO (SAML 2.0)" description="Allow users to authenticate via your identity provider." checked={sec.sso} onChange={() => toggle('sso')} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <FieldLabel>Session Timeout</FieldLabel>
            <CustomSelect value={sec.sessionTimeout} onChange={update('sessionTimeout')} options={[{label: '15 mins', value: '15 mins'}, {label: '30 mins', value: '30 mins'}, {label: '1 hour', value: '1 hour'}]} />
          </div>
          <div>
            <FieldLabel>Password Policy</FieldLabel>
            <CustomSelect value={sec.passwordPolicy} onChange={update('passwordPolicy')} options={[{label: 'Standard (8 chars)', value: 'Standard'}, {label: 'Strict (12 chars + symbols)', value: 'Strict'}]} />
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Network & API Access" description="Control from where the platform can be accessed.">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[14px] text-white font-medium">IP Allowlist</p>
              <p className="text-[12.5px] text-[#7c8a96]">Restrict logins to specific corporate IP ranges.</p>
            </div>
            <button className="text-[13px] text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/10">Configure IPs</button>
          </div>
          <hr className="border-[#1e2530]" />
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[14px] text-white font-medium">API Keys</p>
              <p className="text-[12.5px] text-[#7c8a96]">Manage programmatic access tokens.</p>
            </div>
            <button className="text-[13px] text-white border border-[#2a3444] px-3 py-1.5 rounded-lg hover:bg-white/5">Manage Keys</button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// 4. Integrations Tab
function IntegrationsTab() {
  const ints = [
    { name: 'Splunk SIEM', status: 'Connected', lastSync: '10 sec ago', health: 'Healthy' },
    { name: 'CrowdStrike EDR', status: 'Connected', lastSync: '1 min ago', health: 'Healthy' },
    { name: 'AWS CloudTrail', status: 'Connected', lastSync: '5 mins ago', health: 'Warning' },
    { name: 'Jira Service Desk', status: 'Disconnected', lastSync: 'Never', health: 'Error' },
  ]
  const hColors = { Healthy: 'text-green-400 bg-green-500/10', Warning: 'text-yellow-400 bg-yellow-500/10', Error: 'text-red-400 bg-red-500/10' }

  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="Connected Integrations" description="Manage data sources, threat feeds, and response destinations.">
        <div className="mb-4 flex gap-2">
           {['SIEM', 'EDR/XDR', 'Cloud', 'Threat Intel', 'Ticketing', 'Webhooks'].map(cat => (
             <span key={cat} className="px-3 py-1 bg-[#1a2030] text-[#7c8a96] text-[12px] rounded-full border border-[#2a3444] cursor-pointer hover:text-white hover:border-white/20 transition-colors">{cat}</span>
           ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#1e2530]">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-[#111823] text-[#7c8a96] uppercase font-semibold text-[11px] border-b border-[#1e2530]">
              <tr>
                <th className="px-4 py-3">Integration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Sync</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2530]">
              {ints.map((i, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{i.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${i.status === 'Connected' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[#7c8a96]">{i.lastSync}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${hColors[i.health]}`}>{i.health}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                     <button className="text-[12px] font-semibold text-[#b0bec5] px-3 py-1.5 rounded border border-[#2a3444] hover:bg-white/5 hover:text-white transition-colors mr-2">Config</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

// 5. Automation Safety Tab
function AutomationSafetyTab({ onDirty }) {
  const [auto, setAuto] = useState({ mode: 'Approval Required', rollback: 'Auto-Revert on Failure' })
  const [isDirty, setIsDirty] = useState(false); const [isSaving, setIsSaving] = useState(false)
  const update = (k) => (v) => { setAuto(p => ({...p, [k]: v})); setIsDirty(true); onDirty(true) }

  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="Automation Governance" description="Define strict boundaries for autonomous actions." footer={<SaveButton isDirty={isDirty} isSaving={isSaving} onSave={async () => { setIsSaving(true); await new Promise(r=>setTimeout(r,800)); setIsSaving(false); setIsDirty(false); onDirty(false); onDirty('toast:Safety rules updated.') }} />}>
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <FieldLabel>Automation Execution Mode</FieldLabel>
            <CustomSelect value={auto.mode} onChange={update('mode')} options={[
              {label: 'Manual (No automation)', value: 'Manual'}, 
              {label: 'Approval Required (Human-in-the-loop)', value: 'Approval Required'}, 
              {label: 'Autonomous (Zero-touch)', value: 'Autonomous'}
            ]} />
            <p className="text-[12.5px] text-orange-400 mt-2 flex items-center gap-1.5"><MdShield className="text-[14px]" /> Current mode requires human approval for disruptive actions.</p>
          </div>
          <div>
            <FieldLabel>Rollback Policy</FieldLabel>
            <CustomSelect value={auto.rollback} onChange={update('rollback')} options={[
              {label: 'Auto-Revert on Failure', value: 'Auto-Revert on Failure'}, 
              {label: 'Halt on Failure', value: 'Halt on Failure'}
            ]} />
          </div>
        </div>
        <hr className="border-[#1e2530] mb-6" />
        <h4 className="text-[14px] font-medium text-white mb-4">Restricted Actions</h4>
        <div className="space-y-3">
          {['Isolate Domain Controllers', 'Disable Global Admin Accounts', 'Block AWS Root IPs'].map((action, i) => (
             <div key={i} className="flex items-center justify-between p-3.5 rounded-lg bg-[#111823] border border-red-500/20 shadow-sm">
                <span className="text-[13.5px] text-white">{action}</span>
                <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded uppercase tracking-wider">Blocked</span>
             </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// 6. Notifications Tab (Updated for SOC)
function NotificationsTab({ onDirty }) {
  const [notifs, setNotifs] = useState({ critical: true, high: true, responseFail: true, approvals: true, email: true, inapp: true })
  const [isDirty, setIsDirty] = useState(false); const [isSaving, setIsSaving] = useState(false)
  const toggle = (k) => { setNotifs(p => ({...p, [k]: !p[k]})); setIsDirty(true); onDirty(true) }

  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="Event Notifications" description="Configure alerts for critical SOC operations." footer={<SaveButton isDirty={isDirty} isSaving={isSaving} onSave={async () => { setIsSaving(true); await new Promise(r=>setTimeout(r,800)); setIsSaving(false); setIsDirty(false); onDirty(false); onDirty('toast:Alerts updated.') }} />}>
        <div className="-mx-6 -my-6">
          <div className="px-6 border-b border-[#1e2530]/60 hover:bg-[#111823]/30">
            <NotificationRow id="critical" label="Critical Incident Alerts" description="Immediate page for severity 1 incidents." checked={notifs.critical} onChange={() => toggle('critical')} />
          </div>
          <div className="px-6 border-b border-[#1e2530]/60 hover:bg-[#111823]/30">
            <NotificationRow id="high" label="High-Risk Alerts" description="Notifications for high-severity signals." checked={notifs.high} onChange={() => toggle('high')} />
          </div>
          <div className="px-6 border-b border-[#1e2530]/60 hover:bg-[#111823]/30">
            <NotificationRow id="responseFail" label="Response Failure Alerts" description="Notify when an automated playbook fails to execute." checked={notifs.responseFail} onChange={() => toggle('responseFail')} />
          </div>
          <div className="px-6 hover:bg-[#111823]/30">
            <NotificationRow id="approvals" label="Approval Notifications" description="Ping when a playbook requires manual approval." checked={notifs.approvals} onChange={() => toggle('approvals')} />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// 7. Data Freshness Tab
function DataFreshnessTab() {
  const sources = [
    { name: 'Active Directory Logs', status: 'Data Fresh', time: 'Updated 30 sec ago', color: 'bg-green-500' },
    { name: 'AWS CloudTrail', status: 'Data Fresh', time: 'Updated 1 min ago', color: 'bg-green-500' },
    { name: 'CrowdStrike EDR Telemetry', status: 'Delayed', time: 'Updated 8 min ago', color: 'bg-yellow-400' },
    { name: 'Firewall Syslog', status: 'Stale', time: 'Updated 45 min ago', color: 'bg-red-500' },
  ]
  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="Data Ingestion Health" description="Monitor the real-time sync status of your security data sources.">
        <div className="space-y-4">
          {sources.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[#1e2530] bg-[#111823] hover:border-[#2a3444] transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1a2030] border border-[#2a3444]">
                   <MdDataUsage className="text-[#7c8a96] text-[20px]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{s.name}</p>
                  <p className="text-[12.5px] text-[#7c8a96] flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
                    {s.status} — {s.time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-[#7c8a96] uppercase tracking-wider mb-1">Frequency</p>
                <p className="text-[13px] font-mono text-white">Continuous</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// 8. Audit Logs Tab
function AuditLogsTab() {
  const logs = []
  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="System Audit Logs" description="Immutable record of user actions and automated system events.">
        <div className="mb-4 flex gap-3">
          <input type="text" placeholder="Search logs..." className="bg-[#0c1118] border border-[#1e2530] rounded-lg px-3 py-1.5 text-[13px] text-white w-64 outline-none focus:border-green-500/50 transition-colors" />
          <button className="px-3 py-1.5 bg-[#1a2030] text-[#b0bec5] text-[12px] font-medium rounded-lg border border-[#2a3444] hover:bg-white/5 transition-colors">Export CSV</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#1e2530]">
          <table className="w-full text-[12px] text-left">
            <thead className="bg-[#111823] text-[#7c8a96] uppercase font-semibold text-[10px] border-b border-[#1e2530]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2530]">
              {logs.map((l, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors font-mono">
                  <td className="px-4 py-3 text-[#7c8a96] whitespace-nowrap">{l.time}</td>
                  <td className="px-4 py-3 text-[#b0bec5]">{l.user}</td>
                  <td className="px-4 py-3 text-white font-sans font-medium">{l.action}</td>
                  <td className="px-4 py-3 text-[#7c8a96]">{l.resource}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${l.result.includes('Success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{l.result}</span>
                  </td>
                  <td className="px-4 py-3 text-[#7c8a96]">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

// 9. General & Account Tabs (Consolidated from earlier for completeness)
function GeneralTab({ onDirty }) {
  const [theme, setTheme] = useState('dark'); const [language, setLanguage] = useState('en-US'); const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [isDirty, setIsDirty] = useState(false); const [isSaving, setIsSaving] = useState(false)
  const update = (fn) => (v) => { fn(v); setIsDirty(true); onDirty(true) }

  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="Preferences" description="Local display settings." footer={<SaveButton isDirty={isDirty} isSaving={isSaving} onSave={async () => { setIsSaving(true); await new Promise(r=>setTimeout(r,800)); setIsSaving(false); setIsDirty(false); onDirty(false); onDirty('toast:Preferences saved.') }} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div><FieldLabel>Language</FieldLabel><CustomSelect value={language} onChange={update(setLanguage)} options={LANGUAGES} /></div>
          <div><FieldLabel>Timezone</FieldLabel><CustomSelect value={timezone} onChange={update(setTimezone)} options={TIMEZONES} /></div>
        </div>
        <div>
          <FieldLabel>Theme</FieldLabel>
          <ThemeToggle value={theme} onChange={update(setTheme)} />
        </div>
      </SectionCard>
    </div>
  )
}

function AccountTab({ onDirty, avatarSrc, setAvatarSrc }) {
  const [form, setForm] = useState({ fullName: 'Poojitha Reddy', email: 'poojitha24@gmail.com' })
  const [isDirty, setIsDirty] = useState(false); const [isSaving, setIsSaving] = useState(false)
  
  return (
    <div className="space-y-8 pb-12">
      <SectionCard title="My Profile" description="Update your personal information." footer={<SaveButton isDirty={isDirty} isSaving={isSaving} onSave={async () => { setIsSaving(true); await new Promise(r=>setTimeout(r,800)); setIsSaving(false); setIsDirty(false); onDirty(false); onDirty('toast:Profile updated.') }} />}>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[#1e2530]"><img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" /></div>
          <div><p className="text-[14px] font-semibold text-white">{form.fullName}</p><p className="text-[13px] text-[#7c8a96]">{form.email}</p></div>
        </div>
        <hr className="border-[#1e2530] mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div><FieldLabel>Full Name</FieldLabel><Input value={form.fullName} onChange={e => {setForm({...form, fullName: e.target.value}); setIsDirty(true); onDirty(true)}} /></div>
           <div><FieldLabel>Email</FieldLabel><Input value={form.email} onChange={e => {setForm({...form, email: e.target.value}); setIsDirty(true); onDirty(true)}} /></div>
        </div>
      </SectionCard>
    </div>
  )
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Settings({ defaultTab = 'organization', avatarSrc, setAvatarSrc }) {
  const [activeTab, setActiveTab]     = useState(defaultTab)
  const [toast, setToast]             = useState(null)
  const [hasUnsaved, setHasUnsaved]   = useState(false)
  const [pendingTab, setPendingTab]   = useState(null)
  const [showWarning, setShowWarning] = useState(false)

  // Auto-scroll to top when tab changes
  const mainRef = useRef(null)
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'smooth' }) }, [activeTab])

  const handleDirty = useCallback((val) => {
    if (typeof val === 'string' && val.startsWith('toast:')) {
      setToast({ message: val.replace('toast:', ''), type: 'success' })
      setHasUnsaved(false)
    } else {
      setHasUnsaved(val)
    }
  }, [])

  const handleTabClick = (tabId) => {
    if (hasUnsaved && tabId !== activeTab) {
      setPendingTab(tabId)
      setShowWarning(true)
    } else {
      setActiveTab(tabId)
    }
  }

  const confirmLeave = () => {
    if (pendingTab) { setActiveTab(pendingTab); setPendingTab(null) }
    setHasUnsaved(false)
    setShowWarning(false)
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'organization':  return <OrganizationTab onDirty={handleDirty} />
      case 'users':         return <UsersRolesTab />
      case 'security':      return <SecurityTab onDirty={handleDirty} />
      case 'integrations':  return <IntegrationsTab />
      case 'automation':    return <AutomationSafetyTab onDirty={handleDirty} />
      case 'notifications': return <NotificationsTab onDirty={handleDirty} />
      case 'data':          return <DataFreshnessTab />
      case 'audit':         return <AuditLogsTab />
      case 'general':       return <GeneralTab onDirty={handleDirty} />
      case 'account':       return <AccountTab onDirty={handleDirty} avatarSrc={avatarSrc} setAvatarSrc={setAvatarSrc} />
      default:              return <OrganizationTab onDirty={handleDirty} />
    }
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto bg-grid"
      ref={mainRef}
      style={{
        backgroundColor: '#070B11',
      }}
    >
      <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10">

        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-[28px] font-bold text-white tracking-tight">Platform Settings</h1>
          <p className="text-[14.5px] text-[#7c8a96] mt-2">Manage enterprise SOC configuration, security policies, and integrations.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start">

          {/* Left Nav */}
          <aside className="w-full md:w-[250px] flex-shrink-0 md:sticky md:top-8">
            <nav className="flex flex-col gap-1">
              {TABS.map((tab, idx) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <div key={tab.id}>
                    {idx === 8 && <div className="h-px bg-[#1e2530] my-4 mx-2" />}
                    <button
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200 group w-full
                        ${isActive
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm'
                          : 'text-[#7c8a96] border border-transparent hover:text-white hover:bg-white/[0.04]'
                        }
                      `}
                    >
                      <Icon className={`text-[20px] flex-shrink-0 transition-colors ${isActive ? 'text-green-400' : 'text-[#7c8a96] group-hover:text-white'}`} />
                      <div className="min-w-0">
                        <p className={`text-[13.5px] font-semibold leading-tight truncate`}>{tab.label}</p>
                      </div>
                    </button>
                  </div>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {renderTab()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Unsaved Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111823] border border-[#1e2530] rounded-2xl p-6 w-full max-w-[400px] shadow-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center mb-4">
                <MdOutlineSettings className="text-orange-400 text-[20px]" />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">Unsaved Changes</h3>
              <p className="text-[13px] text-[#7c8a96] mb-6">You have unsaved changes. Are you sure you want to leave without saving?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowWarning(false)} className="px-4 py-2 text-[13px] text-[#b0bec5] bg-[#1a2030] border border-[#2a3444] rounded-xl hover:bg-[#1e2a3a] transition-colors">
                  Stay
                </button>
                <button onClick={confirmLeave} className="px-4 py-2 text-[13px] text-[#0B0F14] bg-orange-500 hover:bg-orange-400 rounded-xl transition-colors font-bold shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                  Leave Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
