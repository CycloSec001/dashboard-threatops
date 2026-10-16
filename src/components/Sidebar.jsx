import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdOutlineDashboard,
  MdOutlineLeaderboard,
  MdOutlinePersonOutline,
  MdOutlineExplore,
  MdOutlineManageAccounts,
  MdOutlineBarChart,
  MdOutlineComputer,
  MdOutlineNotifications,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdMenuOpen,
  MdMenu
} from 'react-icons/md'

import logoImage from '../assets/logo.png'

const menuGroups = [
  {
    id: 'group_command_center',
    label: 'Command Center',
    icon: MdOutlineDashboard,
    items: [
      { id: 'overview',             label: 'Overview',             icon: MdOutlineDashboard },
      { id: 'active_incidents',     label: 'Active Incidents',     icon: MdOutlineDashboard },
      { id: 'incident_timeline',    label: 'Incident Timeline',    icon: MdOutlineDashboard },
      { id: 'autonomous_actions',   label: 'Autonomous Actions',   icon: MdOutlineDashboard },
      { id: 'response_readiness',   label: 'Response Readiness',   icon: MdOutlineDashboard },
    ]
  },
  {
    id: 'group_alerts_detections',
    label: 'Alerts & Detections',
    icon: MdOutlineNotifications,
    items: [
      { id: 'alerts_signals',       label: 'Alerts & Signals',     icon: MdOutlineNotifications },
      { id: 'attack_chains',        label: 'Attack Chains',        icon: MdOutlineNotifications },
      { id: 'threat_hunting',       label: 'Threat Hunting',       icon: MdOutlineNotifications },
      { id: 'correlation_view',     label: 'Correlation View',     icon: MdOutlineNotifications },
      { id: 'evidence',             label: 'Evidence',             icon: MdOutlineNotifications },
    ]
  },
  {
    id: 'group_investigation',
    label: 'Investigation',
    icon: MdOutlineExplore,
    items: [
      { id: 'investigation_workspace', label: 'Investigation Workspace', icon: MdOutlineExplore },
      { id: 'entity_explorer',      label: 'Entity Explorer',      icon: MdOutlineExplore },
      { id: 'event_explorer',       label: 'Event Explorer',       icon: MdOutlineExplore },
      { id: 'ioc_explorer',         label: 'IOC Explorer',         icon: MdOutlineExplore },
    ]
  },
  {
    id: 'group_context_intelligence',
    label: 'Context & Intelligence',
    icon: MdOutlineManageAccounts,
    items: [
      { id: 'assets',               label: 'Assets & Identity',    icon: MdOutlineManageAccounts },
      { id: 'ueba',                 label: 'User Behavior (UEBA)', icon: MdOutlineManageAccounts },
      { id: 'endpoint_context',     label: 'Endpoint Context',     icon: MdOutlineManageAccounts },
      { id: 'network_visibility',   label: 'Network Visibility',   icon: MdOutlineManageAccounts },
      { id: 'cloud_saas',           label: 'Cloud & SaaS Context', icon: MdOutlineManageAccounts },
      { id: 'threat_intelligence',  label: 'Threat Intelligence',  icon: MdOutlineManageAccounts },
      { id: 'dark_web_intel',       label: 'Dark Web Intelligence',icon: MdOutlineManageAccounts },
      { id: 'vulnerabilities',      label: 'Vulnerabilities',      icon: MdOutlineManageAccounts },
    ]
  },
  {
    id: 'group_risk_posture',
    label: 'Risk & Posture',
    icon: MdOutlineComputer,
    items: [
      { id: 'exposure',             label: 'Exposure',             icon: MdOutlineComputer },
      { id: 'risk_overview',        label: 'Risk Overview',        icon: MdOutlineComputer },
      { id: 'control_effectiveness',label: 'Control Effectiveness',icon: MdOutlineComputer },
      { id: 'security_posture',     label: 'Security Posture',     icon: MdOutlineComputer },
      { id: 'compliance',           label: 'Compliance',           icon: MdOutlineComputer },
    ]
  },
  {
    id: 'group_governance_trust',
    label: 'Governance & Trust',
    icon: MdOutlinePersonOutline,
    items: [
      { id: 'audit_logs',           label: 'Audit Logs',           icon: MdOutlinePersonOutline },
      { id: 'rules_policies',       label: 'Rules & Policies',     icon: MdOutlinePersonOutline },
      { id: 'policy_exceptions',    label: 'Policy Exceptions',    icon: MdOutlinePersonOutline },
      { id: 'engines_confidence',   label: 'Engines & Confidence', icon: MdOutlinePersonOutline },
      { id: 'ai_decisions',         label: 'AI Decisions',         icon: MdOutlinePersonOutline },
      { id: 'automation_safety',    label: 'Automation Safety',    icon: MdOutlinePersonOutline },
      { id: 'data_freshness',       label: 'Data Freshness',       icon: MdOutlinePersonOutline },
      { id: 'playbooks',            label: 'Playbooks',            icon: MdOutlinePersonOutline },
    ]
  },
  {
    id: 'group_decision_logs',
    label: 'Decision Logs',
    icon: MdOutlineLeaderboard,
    items: [
      { id: 'approvals',            label: 'Approvals',            icon: MdOutlineLeaderboard },
      { id: 'action_history',       label: 'Action Logs',          icon: MdOutlineLeaderboard },
      { id: 'rollbacks',            label: 'Rollbacks',            icon: MdOutlineLeaderboard },
      { id: 'incident_audit',       label: 'Incident Audit',       icon: MdOutlineLeaderboard },
    ]
  },
  {
    id: 'group_analytics',
    label: 'Analytics',
    icon: MdOutlineBarChart,
    items: [
      { id: 'security_analytics',   label: 'Security Analytics',   icon: MdOutlineBarChart },
      { id: 'detection_trends',     label: 'Detection Trends',     icon: MdOutlineBarChart },
      { id: 'response_analytics',   label: 'Response Analytics',   icon: MdOutlineBarChart },
      { id: 'kpis',                 label: 'KPIs',                 icon: MdOutlineBarChart },
      { id: 'custom_dashboard',     label: 'Custom Dashboard',     icon: MdOutlineBarChart },
    ]
  },
]

const ITEM_PERMISSIONS = {
  active_incidents: 'incidents:read',
  incident_timeline: 'incidents:read',
  alerts_signals: 'events:read',
  event_explorer: 'events:read',
  threat_intelligence: 'threat_intelligence:read',
  ioc_explorer: 'threat_intelligence:read',
  threat_actors: 'threat_intelligence:read',
  campaigns: 'threat_intelligence:read',
  investigation_workspace: 'investigations:read',
  evidence: 'evidence:read',
  audit_logs: 'audit:read',
  kpis: 'kpi:read',
  security_analytics: 'kpi:read',
  detection_trends: 'kpi:read',
  response_analytics: 'kpi:read',
  autonomous_actions: 'actions:read',
  action_history: 'actions:read',
  approvals: 'decisions:read',
  rollbacks: 'actions:read',
  playbooks: 'actions:read',
}

export default function Sidebar({ active, setActive, isCollapsed, setIsCollapsed, currentUser = null }) {
  const [openGroups, setOpenGroups] = useState({
    group_command_center: true,
    group_alerts_detections: false,
    group_investigation: false,
    group_context_intelligence: false,
    group_risk_posture: false,
    group_governance_trust: false,
    group_decision_logs: false,
    group_analytics: false,
  })

  // Dynamically build menu groups
  const permissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : []
  const canSee = item => !ITEM_PERMISSIONS[item.id] || permissions.length === 0 || permissions.includes(ITEM_PERMISSIONS[item.id])
  const dynamicMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items?.filter(canSee),
  }))
  
  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      data-collapsed={isCollapsed}
      className="relative z-40 h-full bg-[#080d14]/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col flex-shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-5 py-6 ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img 
            src={typeof logoImage === 'object' && logoImage?.src ? logoImage.src : (logoImage || '/assets/logo.png')}
            alt="Cyclosec Logo" 
            className="w-8 h-8 object-contain"
          />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col ml-1 justify-center"
          >
            <span className="text-white font-bold text-[16px] tracking-widest leading-none whitespace-nowrap">
              CYCLOSEC
            </span>
            <span className="text-slate-400 text-[10px] tracking-wide whitespace-nowrap mt-1">
              Secure together
            </span>
          </motion.div>
        )}
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide">
        {!isCollapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-3 mt-2">Menu</p>
        )}
        
        <ul className="flex flex-col gap-1.5">
          {dynamicMenuGroups.map((group) => {
            const GroupIcon = group.icon
            const isOpen = openGroups[group.id]
            const isActiveRoute = group.isRoute && active === group.route
            
            return (
              <li key={group.id} className="flex flex-col">
                <button
                  onClick={() => {
                    if (isCollapsed && setIsCollapsed) setIsCollapsed(false)
                    if (group.isRoute) {
                      setActive(group.route)
                    } else {
                      if (isCollapsed) {
                        setOpenGroups(prev => ({ ...prev, [group.id]: true }))
                      } else {
                        toggleGroup(group.id)
                      }
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 ${
                    isActiveRoute
                      ? 'bg-[#39FF6A]/10 text-white border-l-[3px] border-[#39FF6A] font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border-l-[3px] border-transparent'
                  }`}
                  title={isCollapsed ? group.label : ''}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon className={`text-[18px] flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                    {!isCollapsed && <span className="text-[13.5px] font-medium whitespace-nowrap">{group.label}</span>}
                  </div>
                  {!isCollapsed && !group.isRoute && (
                    <span className="text-[16px]">
                      {isOpen ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
                    </span>
                  )}
                </button>

                {/* Submenu Items */}
                <AnimatePresence>
                  {!isCollapsed && !group.isRoute && isOpen && group.items && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1 mt-1 overflow-hidden"
                    >
                      {group.items.map(item => {
                        const ItemIcon = item.icon
                        const isChildActive = active === item.id
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setActive(item.id)}
                              className={`w-full flex items-center gap-3 pl-10 pr-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                                isChildActive
                                  ? 'text-[#39FF6A] bg-white/[0.06] border-l-[3px] border-[#39FF6A] font-semibold'
                                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border-l-[3px] border-transparent'
                              }`}
                            >
                              {item.label}
                            </button>
                          </li>
                        )
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all w-full ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? <MdMenu size={20} /> : <MdMenuOpen size={20} />}
          {!isCollapsed && <span className="text-[13px] font-medium">Collapse Menu</span>}
        </button>
      </div>
    </motion.aside>
  )
}