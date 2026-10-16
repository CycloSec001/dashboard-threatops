import DomainDashboard from './DomainDashboard'

export default function ControlEffectiveness({ selectedTime }) {
  return <DomainDashboard domain="controls/assessments" selectedTime={selectedTime} />
}
