import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './views/Dashboard'
import ThreatMonitoring from './views/ThreatMonitoring'
import AlertsPage from './views/Alerts'
import IncidentsPage from './views/Incidents'
import Navbar from './components/Navbar'

import VulnerabilitiesPage from './views/Vulnerabilities'

import AssetsPage from './views/Assets'

import CompliancePage from './views/Compliance'

import ReportsPage from './views/Reports'
import SettingsPage from './views/Settings'
import KpiManagement from './views/KpiManagement'
import DashboardManagement from './views/DashboardManagement'
import CloudDashboard from './views/CloudDashboard'
import EndpointDashboard from './views/EndpointDashboard'
import NetworkDashboard from './views/NetworkDashboard'
import Overview from './views/Overview'
import Exposure from './views/Exposure'
import ResponseReadiness from './views/ResponseReadiness'
import ActiveIncidents from './views/ActiveIncidents'
import IncidentTimeline from './views/IncidentTimeline'
import AttackChains from './views/AttackChains'
import AlertsSignals from './views/AlertsSignals'
import DetectionAnalytics from './views/DetectionAnalytics'
import InvestigationWorkspace from './views/InvestigationWorkspace'
import ThreatHunting from './views/ThreatHunting'
import EntityExplorer from './views/EntityExplorer'
import EventExplorer from './views/EventExplorer'
import Evidence from './views/Evidence'
import Assets from './views/Assets'
import UsersIdentity from './views/UsersIdentity'
import EndpointContext from './views/EndpointContext'
import NetworkVisibility from './views/NetworkVisibility'
import CloudSaas from './views/CloudSaas'
import AssetRisk from './views/AssetRisk'
import ThreatIntelligence from './views/ThreatIntelligence'
import IocExplorer from './views/IocExplorer'
import ThreatActors from './views/ThreatActors'
import Campaigns from './views/Campaigns'
import MitreAttack from './views/MitreAttack'
import AutonomousActions from './views/AutonomousActions'
import Approvals from './views/Approvals'
import ActionHistory from './views/ActionHistory'
import Rollbacks from './views/Rollbacks'
import SecurityAnalytics from './views/SecurityAnalytics'
import DetectionTrends from './views/DetectionTrends'
import ResponseAnalytics from './views/ResponseAnalytics'
import Kpis from './views/Kpis'
import CustomDashboard from './views/CustomDashboard'
import AiDecisions from './views/AiDecisions'
import EnginesConfidence from './views/EnginesConfidence'
import AutomationSafety from './views/AutomationSafety'
import DataFreshness from './views/DataFreshness'
import RulesPolicies from './views/RulesPolicies'
import AuditLogs from './views/AuditLogs'
import Playbooks from './views/Playbooks'
import CorrelationView from './views/CorrelationView'
import Ueba from './views/Ueba'
import DarkWebIntel from './views/DarkWebIntel'
import RiskOverview from './views/RiskOverview'
import ControlEffectiveness from './views/ControlEffectiveness'
import SecurityPosture from './views/SecurityPosture'
import PolicyExceptions from './views/PolicyExceptions'
import IncidentAudit from './views/IncidentAudit'
import RiskPostureGovernance from './views/RiskPostureGovernance'
import Login from './components/Login'
import { checkBackendHealth, getAuthState, subscribeAuth } from './api/client'
import CapabilityState from './components/CapabilityState'

function DummyPage({ title }) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px), #070B11', backgroundSize: '40px 40px' }}>
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <div className="text-htb-green text-[11px] font-semibold uppercase tracking-widest">Page</div>
        <h2 className="text-4xl font-bold text-htb-text">{title}</h2>
        <div className="text-7xl font-mono text-htb-green font-bold" style={{ textShadow: '0 0 30px rgba(57,255,106,0.4)' }}>123</div>
        <p className="text-htb-muted text-sm mt-2">Content coming soon</p>
      </div>
    </div>
  )
}

function UnsupportedPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-grid p-7">
      <CapabilityState state="UNSUPPORTED" />
    </div>
  )
}

export default function App() {
  const [authState, setAuthState] = useState(getAuthState)
  const [activeItem, setActiveItem] = useState('overview')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [selectedTime, setSelectedTime] = useState('Last 24 Hours')
  const [defaultSettingsTab, setDefaultSettingsTab] = useState('general')
  const [avatarSrc, setAvatarSrc] = useState(null)
  const [backendStatus, setBackendStatus] = useState({ online: false })

  useEffect(() => subscribeAuth((user, token) => setAuthState({ user, token })), [])

  useEffect(() => {
    let active = true
    checkBackendHealth().then(status => { if (active) setBackendStatus(status) })
    return () => { active = false }
  }, [])

  if (!authState.token || !authState.user) {
    return <Login onAuthenticated={user => setAuthState({ user, token: getAuthState().token })} />
  }

  const handleSetActive = (page, subTab) => {
    setActiveItem(page)
    if (page === 'settings' && subTab) setDefaultSettingsTab(subTab)
  }

  const renderPage = () => {
    if (activeItem.startsWith('custom_dashboard_')) {
      const id = activeItem.replace('custom_dashboard_', '')
      return <UnsupportedPage />
    }

    if (activeItem === 'overview') {
      return <Overview selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'exposure') {
      return <Exposure selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'response_readiness') {
      return <ResponseReadiness selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'active_incidents') {
      return <ActiveIncidents selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'incident_timeline') {
      return <IncidentTimeline selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'attack_chains') {
      return <AttackChains selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'alerts_signals') {
      return <AlertsSignals selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'detection_analytics') {
      return <DetectionAnalytics selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'investigation_workspace') {
      return <InvestigationWorkspace selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'threat_hunting') {
      return <ThreatHunting selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'entity_explorer') {
      return <EntityExplorer selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'event_explorer') {
      return <EventExplorer selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'evidence') {
      return <Evidence selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'assets') {
      return <Assets selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'users_identity') {
      return <UsersIdentity selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'endpoint_context') {
      return <EndpointContext selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'network_visibility') {
      return <NetworkVisibility selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'cloud_saas') {
      return <CloudSaas selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'asset_risk') {
      return <AssetRisk selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'threat_intelligence') {
      return <ThreatIntelligence selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'ioc_explorer') {
      return <IocExplorer selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'threat_actors') {
      return <ThreatActors selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'campaigns') {
      return <Campaigns selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'mitre_attack') {
      return <MitreAttack selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'autonomous_actions') {
      return <AutonomousActions selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'approvals') {
      return <Approvals selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'action_history') {
      return <ActionHistory selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'rollbacks') {
      return <Rollbacks selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'security_analytics') {
      return <SecurityAnalytics selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'detection_trends') {
      return <DetectionTrends selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'response_analytics') {
      return <ResponseAnalytics selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'kpis') {
      return <Kpis selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'settings') {
      return <SettingsPage defaultTab={defaultSettingsTab} avatarSrc={avatarSrc} setAvatarSrc={setAvatarSrc} />
    }

    if (activeItem === 'custom_dashboard') {
      return <CustomDashboard selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'ai_decisions') {
      return <AiDecisions selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'engines_confidence') {
      return <EnginesConfidence selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'automation_safety') {
      return <AutomationSafety selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'data_freshness') {
      return <DataFreshness selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'rules_policies') {
      return <RulesPolicies selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'audit_logs') {
      return <AuditLogs selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'correlation_view') {
      return <UnsupportedPage />
    }

    if (activeItem === 'ueba') {
      return <Ueba selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'dark_web_intel') {
      return <UnsupportedPage />
    }

    if (activeItem === 'risk_overview') {
      return <RiskOverview selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'control_effectiveness') {
      return <ControlEffectiveness selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'security_posture') {
      return <UnsupportedPage />
    }

    if (activeItem === 'policy_exceptions') {
      return <UnsupportedPage />
    }

    if (activeItem === 'incident_audit') {
      return <IncidentAudit selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'risk_posture_governance') {
      return <RiskPostureGovernance selectedTime={selectedTime} setActive={handleSetActive} />
    }

    if (activeItem === 'playbooks') {
      return <Playbooks selectedTime={selectedTime} setActive={handleSetActive} />
    }

    // Convert id to a readable title
    const readableTitle = activeItem
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return <DummyPage title={readableTitle} />
  }

  return (
    <div className="flex h-screen bg-htb-bg overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar
        active={activeItem}
        setActive={setActiveItem}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentUser={authState.user}
      />

      {/* Scrollable Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
        <Navbar 
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          setActive={handleSetActive}
          avatarSrc={avatarSrc}
          currentUser={authState.user}
          backendStatus={backendStatus}
        />
        {renderPage()}
      </div>
    </div>
  )
}
