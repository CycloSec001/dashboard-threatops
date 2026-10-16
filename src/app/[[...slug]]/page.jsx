'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ClientShell from '../../components/ClientShell'
import BackendPageState from '../../components/BackendPageState'

// Dynamic imports with ssr: false for charts/animations
const Overview = dynamic(() => import('../../views/Overview'), { ssr: false })
const ActiveIncidents = dynamic(() => import('../../views/ActiveIncidents'), { ssr: false })
const IncidentsPage = dynamic(() => import('../../views/Incidents'), { ssr: false })
const IncidentTimeline = dynamic(() => import('../../views/IncidentTimeline'), { ssr: false })
const AttackChains = dynamic(() => import('../../views/AttackChains'), { ssr: false })
const AlertsSignals = dynamic(() => import('../../views/AlertsSignals'), { ssr: false })
const AlertsPage = dynamic(() => import('../../views/Alerts'), { ssr: false })
const DetectionAnalytics = dynamic(() => import('../../views/DetectionAnalytics'), { ssr: false })
const InvestigationWorkspace = dynamic(() => import('../../views/InvestigationWorkspace'), { ssr: false })
const ThreatHunting = dynamic(() => import('../../views/ThreatHunting'), { ssr: false })
const EntityExplorer = dynamic(() => import('../../views/EntityExplorer'), { ssr: false })
const EventExplorer = dynamic(() => import('../../views/EventExplorer'), { ssr: false })
const Evidence = dynamic(() => import('../../views/Evidence'), { ssr: false })
const Assets = dynamic(() => import('../../views/Assets'), { ssr: false })
const UsersIdentity = dynamic(() => import('../../views/UsersIdentity'), { ssr: false })
const EndpointContext = dynamic(() => import('../../views/EndpointContext'), { ssr: false })
const NetworkVisibility = dynamic(() => import('../../views/NetworkVisibility'), { ssr: false })
const CloudSaas = dynamic(() => import('../../views/CloudSaas'), { ssr: false })
const AssetRisk = dynamic(() => import('../../views/AssetRisk'), { ssr: false })
const ThreatIntelligence = dynamic(() => import('../../views/ThreatIntelligence'), { ssr: false })
const IocExplorer = dynamic(() => import('../../views/IocExplorer'), { ssr: false })
const ThreatActors = dynamic(() => import('../../views/ThreatActors'), { ssr: false })
const Campaigns = dynamic(() => import('../../views/Campaigns'), { ssr: false })
const MitreAttack = dynamic(() => import('../../views/MitreAttack'), { ssr: false })
const AutonomousActions = dynamic(() => import('../../views/AutonomousActions'), { ssr: false })
const Approvals = dynamic(() => import('../../views/Approvals'), { ssr: false })
const ActionHistory = dynamic(() => import('../../views/ActionHistory'), { ssr: false })
const Rollbacks = dynamic(() => import('../../views/Rollbacks'), { ssr: false })
const SecurityAnalytics = dynamic(() => import('../../views/SecurityAnalytics'), { ssr: false })
const DetectionTrends = dynamic(() => import('../../views/DetectionTrends'), { ssr: false })
const ResponseAnalytics = dynamic(() => import('../../views/ResponseAnalytics'), { ssr: false })
const Kpis = dynamic(() => import('../../views/Kpis'), { ssr: false })
const CustomDashboard = dynamic(() => import('../../views/CustomDashboard'), { ssr: false })
const Dashboard = dynamic(() => import('../../views/Dashboard'), { ssr: false })
const AiDecisions = dynamic(() => import('../../views/AiDecisions'), { ssr: false })
const EnginesConfidence = dynamic(() => import('../../views/EnginesConfidence'), { ssr: false })
const AutomationSafety = dynamic(() => import('../../views/AutomationSafety'), { ssr: false })
const DataFreshness = dynamic(() => import('../../views/DataFreshness'), { ssr: false })
const RulesPolicies = dynamic(() => import('../../views/RulesPolicies'), { ssr: false })
const AuditLogs = dynamic(() => import('../../views/AuditLogs'), { ssr: false })
const CorrelationView = dynamic(() => import('../../views/CorrelationView'), { ssr: false })
const Ueba = dynamic(() => import('../../views/Ueba'), { ssr: false })
const DarkWebIntel = dynamic(() => import('../../views/DarkWebIntel'), { ssr: false })
const RiskOverview = dynamic(() => import('../../views/RiskOverview'), { ssr: false })
const ControlEffectiveness = dynamic(() => import('../../views/ControlEffectiveness'), { ssr: false })
const SecurityPosture = dynamic(() => import('../../views/SecurityPosture'), { ssr: false })
const PolicyExceptions = dynamic(() => import('../../views/PolicyExceptions'), { ssr: false })
const IncidentAudit = dynamic(() => import('../../views/IncidentAudit'), { ssr: false })
const RiskPostureGovernance = dynamic(() => import('../../views/RiskPostureGovernance'), { ssr: false })
const Playbooks = dynamic(() => import('../../views/Playbooks'), { ssr: false })
const Exposure = dynamic(() => import('../../views/Exposure'), { ssr: false })
const ResponseReadiness = dynamic(() => import('../../views/ResponseReadiness'), { ssr: false })
const SettingsPage = dynamic(() => import('../../views/Settings'), { ssr: false })
const ThreatMonitoring = dynamic(() => import('../../views/ThreatMonitoring'), { ssr: false })
const VulnerabilitiesPage = dynamic(() => import('../../views/Vulnerabilities'), { ssr: false })
const CompliancePage = dynamic(() => import('../../views/Compliance'), { ssr: false })
const ReportsPage = dynamic(() => import('../../views/Reports'), { ssr: false })
const KpiManagement = dynamic(() => import('../../views/KpiManagement'), { ssr: false })
const DashboardManagement = dynamic(() => import('../../views/DashboardManagement'), { ssr: false })
const CloudDashboard = dynamic(() => import('../../views/CloudDashboard'), { ssr: false })
const EndpointDashboard = dynamic(() => import('../../views/EndpointDashboard'), { ssr: false })
const NetworkDashboard = dynamic(() => import('../../views/NetworkDashboard'), { ssr: false })
const DomainDashboard = dynamic(() => import('../../views/DomainDashboard'), { ssr: false })

function LoadingPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-htb-green/30 border-t-htb-green animate-spin" />
        <span className="text-slate-400 text-xs font-mono tracking-wider uppercase">Loading View...</span>
      </div>
    </div>
  )
}

const BACKEND_BACKED_ROUTES = new Set([
  'overview',
  'active_incidents',
  'incidents_page',
  'incident_timeline',
  'alerts_signals',
  'attack_chains',
  'threat_hunting',
  'investigation_workspace',
  'event_explorer',
  'correlation_view',
  'evidence',
  'threat_intelligence',
  'ioc_explorer',
  'threat_actors',
  'campaigns',
  'autonomous_actions',
  'action_history',
  'approvals',
  'playbooks',
  'rules_policies',
  'audit_logs',
  'kpis',
  'security_analytics',
  'detection_trends',
  'response_analytics',
  'exposure',
  'response_readiness',
  'vulnerabilities',
  'cloud_dashboard',
  'endpoint_dashboard',
  'network_dashboard',
  'dark_web_intelligence',
  'security_posture',
  'control_effectiveness',
  'compliance',
  'custom_dashboard',
])

function normalizeRouteId(raw) {
  if (!raw) return 'overview'
  const clean = raw.toLowerCase().replace(/-/g, '_').trim()
  // Alias mappings
  const aliases = {
    '': 'overview',
    'command_center': 'overview',
    'incidents': 'active_incidents',
    'active_incidents': 'active_incidents',
    'alerts': 'alerts_signals',
    'posture': 'security_posture',
    'analytics': 'security_analytics',
    'automation': 'autonomous_actions',
    'investigations': 'investigation_workspace',
    'actions': 'autonomous_actions',
    'threat_intel': 'threat_intelligence',
    'cloud_saas': 'cloud_dashboard',
    'cloud': 'cloud_dashboard',
    'endpoint': 'endpoint_dashboard',
    'endpoint_context': 'endpoint_dashboard',
    'network': 'network_dashboard',
    'network_visibility': 'network_dashboard',
    'dark_web_intel': 'dark_web_intelligence',
    'dark_web': 'dark_web_intelligence',
    'vulnerability': 'vulnerabilities',
    'compliance_tracking': 'compliance',
  }

  return aliases[clean] || clean
}

export default function DynamicPage({ params }) {
  const [mounted, setMounted] = useState(false)
  const slugArray = params?.slug || []
  const initialSlug = slugArray.join('_')
  const initialPage = normalizeRouteId(initialSlug)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <LoadingPlaceholder />
  }

  return (
    <ClientShell initialPage={initialPage}>
      {({ activeItem, handleSetActive, selectedTime, defaultSettingsTab, avatarSrc, setAvatarSrc }) => {
        const route = normalizeRouteId(activeItem)

        if (!BACKEND_BACKED_ROUTES.has(route)) {
          return <BackendPageState title={route.replace(/_/g, ' ')} />
        }

        switch (route) {
          case 'overview':
            return <Overview selectedTime={selectedTime} setActive={handleSetActive} />
          case 'vulnerabilities':
            return <DomainDashboard domain="vulnerabilities" selectedTime={selectedTime} />
          case 'cloud_dashboard':
            return <DomainDashboard domain="cloud/resources" selectedTime={selectedTime} />
          case 'endpoint_dashboard':
            return <DomainDashboard domain="endpoint/assets" selectedTime={selectedTime} />
          case 'network_dashboard':
            return <DomainDashboard domain="network/observations" selectedTime={selectedTime} />
          case 'dark_web_intelligence':
            return <DomainDashboard domain="dark-web/observations" selectedTime={selectedTime} />
          case 'security_posture':
            return <DomainDashboard domain="security-posture" selectedTime={selectedTime} />
          case 'control_effectiveness':
            return <DomainDashboard domain="controls/assessments" selectedTime={selectedTime} />
          case 'compliance':
            return <DomainDashboard domain="compliance/assessments" selectedTime={selectedTime} />
          case 'custom_dashboard':
            return <DomainDashboard domain="dashboards/custom" selectedTime={selectedTime} />
          case 'active_incidents':
            return <ActiveIncidents selectedTime={selectedTime} setActive={handleSetActive} />
          case 'incidents_page':
            return <IncidentsPage selectedTime={selectedTime} setActive={handleSetActive} />
          case 'incident_timeline':
            return <IncidentTimeline selectedTime={selectedTime} setActive={handleSetActive} />
          case 'attack_chains':
            return <AttackChains selectedTime={selectedTime} setActive={handleSetActive} />
          case 'alerts_signals':
            return <AlertsSignals selectedTime={selectedTime} setActive={handleSetActive} />
          case 'alerts_page':
            return <AlertsPage selectedTime={selectedTime} setActive={handleSetActive} />
          case 'detection_analytics':
            return <DetectionAnalytics selectedTime={selectedTime} setActive={handleSetActive} />
          case 'investigation_workspace':
            return <InvestigationWorkspace selectedTime={selectedTime} setActive={handleSetActive} />
          case 'threat_hunting':
            return <ThreatHunting selectedTime={selectedTime} setActive={handleSetActive} />
          case 'entity_explorer':
            return <EntityExplorer selectedTime={selectedTime} setActive={handleSetActive} />
          case 'event_explorer':
            return <EventExplorer selectedTime={selectedTime} setActive={handleSetActive} />
          case 'evidence':
            return <Evidence selectedTime={selectedTime} setActive={handleSetActive} />
          case 'assets':
            return <Assets selectedTime={selectedTime} setActive={handleSetActive} />
          case 'users_identity':
            return <UsersIdentity selectedTime={selectedTime} setActive={handleSetActive} />
          case 'endpoint_context':
            return <EndpointContext selectedTime={selectedTime} setActive={handleSetActive} />
          case 'network_visibility':
            return <NetworkVisibility selectedTime={selectedTime} setActive={handleSetActive} />
          case 'cloud_saas':
            return <CloudSaas selectedTime={selectedTime} setActive={handleSetActive} />
          case 'asset_risk':
            return <AssetRisk selectedTime={selectedTime} setActive={handleSetActive} />
          case 'threat_intelligence':
            return <ThreatIntelligence selectedTime={selectedTime} setActive={handleSetActive} />
          case 'ioc_explorer':
            return <IocExplorer selectedTime={selectedTime} setActive={handleSetActive} />
          case 'threat_actors':
            return <ThreatActors selectedTime={selectedTime} setActive={handleSetActive} />
          case 'campaigns':
            return <Campaigns selectedTime={selectedTime} setActive={handleSetActive} />
          case 'mitre_attack':
            return <MitreAttack selectedTime={selectedTime} setActive={handleSetActive} />
          case 'autonomous_actions':
            return <AutonomousActions selectedTime={selectedTime} setActive={handleSetActive} />
          case 'approvals':
            return <Approvals selectedTime={selectedTime} setActive={handleSetActive} />
          case 'action_history':
            return <ActionHistory selectedTime={selectedTime} setActive={handleSetActive} />
          case 'rollbacks':
            return <Rollbacks selectedTime={selectedTime} setActive={handleSetActive} />
          case 'security_analytics':
            return <SecurityAnalytics selectedTime={selectedTime} setActive={handleSetActive} />
          case 'detection_trends':
            return <DetectionTrends selectedTime={selectedTime} setActive={handleSetActive} />
          case 'response_analytics':
            return <ResponseAnalytics selectedTime={selectedTime} setActive={handleSetActive} />
          case 'kpis':
            return <Kpis selectedTime={selectedTime} setActive={handleSetActive} />
          case 'custom_dashboard':
            return <CustomDashboard selectedTime={selectedTime} setActive={handleSetActive} />
          case 'ai_decisions':
            return <AiDecisions selectedTime={selectedTime} setActive={handleSetActive} />
          case 'engines_confidence':
            return <EnginesConfidence selectedTime={selectedTime} setActive={handleSetActive} />
          case 'automation_safety':
            return <AutomationSafety selectedTime={selectedTime} setActive={handleSetActive} />
          case 'data_freshness':
            return <DataFreshness selectedTime={selectedTime} setActive={handleSetActive} />
          case 'rules_policies':
            return <RulesPolicies selectedTime={selectedTime} setActive={handleSetActive} />
          case 'audit_logs':
            return <AuditLogs selectedTime={selectedTime} setActive={handleSetActive} />
          case 'correlation_view':
            return <CorrelationView selectedTime={selectedTime} setActive={handleSetActive} />
          case 'ueba':
            return <Ueba selectedTime={selectedTime} setActive={handleSetActive} />
          case 'dark_web_intel':
            return <DarkWebIntel selectedTime={selectedTime} setActive={handleSetActive} />
          case 'risk_overview':
            return <RiskOverview selectedTime={selectedTime} setActive={handleSetActive} />
          case 'control_effectiveness':
            return <ControlEffectiveness selectedTime={selectedTime} setActive={handleSetActive} />
          case 'security_posture':
            return <SecurityPosture selectedTime={selectedTime} setActive={handleSetActive} />
          case 'policy_exceptions':
            return <PolicyExceptions selectedTime={selectedTime} setActive={handleSetActive} />
          case 'incident_audit':
            return <IncidentAudit selectedTime={selectedTime} setActive={handleSetActive} />
          case 'risk_posture_governance':
            return <RiskPostureGovernance selectedTime={selectedTime} setActive={handleSetActive} />
          case 'playbooks':
            return <Playbooks selectedTime={selectedTime} setActive={handleSetActive} />
          case 'exposure':
            return <Exposure selectedTime={selectedTime} setActive={handleSetActive} />
          case 'response_readiness':
            return <ResponseReadiness selectedTime={selectedTime} setActive={handleSetActive} />
          case 'settings':
            return <SettingsPage defaultTab={defaultSettingsTab} avatarSrc={avatarSrc} setAvatarSrc={setAvatarSrc} />
          case 'threat_monitoring':
            return <ThreatMonitoring selectedTime={selectedTime} setActive={handleSetActive} />
          case 'vulnerabilities':
            return <VulnerabilitiesPage selectedTime={selectedTime} setActive={handleSetActive} />
          case 'compliance':
            return <CompliancePage selectedTime={selectedTime} setActive={handleSetActive} />
          case 'reports':
            return <ReportsPage selectedTime={selectedTime} setActive={handleSetActive} />
          case 'kpi_management':
            return <KpiManagement selectedTime={selectedTime} setActive={handleSetActive} />
          case 'dashboard_management':
            return <DashboardManagement selectedTime={selectedTime} setActive={handleSetActive} />
          case 'cloud_dashboard':
            return <CloudDashboard selectedTime={selectedTime} setActive={handleSetActive} />
          case 'endpoint_dashboard':
            return <EndpointDashboard selectedTime={selectedTime} setActive={handleSetActive} />
          case 'network_dashboard':
            return <NetworkDashboard selectedTime={selectedTime} setActive={handleSetActive} />
          default:
            return <Overview selectedTime={selectedTime} setActive={handleSetActive} />
        }
      }}
    </ClientShell>
  )
}
