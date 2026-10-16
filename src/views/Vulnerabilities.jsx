import DomainDashboard from './DomainDashboard'

export default function Vulnerabilities({ selectedTime }) {
  return <DomainDashboard domain="vulnerabilities" selectedTime={selectedTime} />
}
