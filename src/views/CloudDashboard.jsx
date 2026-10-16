import DomainDashboard from './DomainDashboard'

export default function CloudDashboard({ selectedTime }) {
  return <DomainDashboard domain="cloud/resources" selectedTime={selectedTime} />
}
