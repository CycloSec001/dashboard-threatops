import DomainDashboard from './DomainDashboard'

export default function Compliance({ selectedTime }) {
  return <DomainDashboard domain="compliance/assessments" selectedTime={selectedTime} />
}
