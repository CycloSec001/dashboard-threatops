import DomainDashboard from './DomainDashboard'

export default function NetworkDashboard({ selectedTime }) {
  return <DomainDashboard domain="network/observations" selectedTime={selectedTime} />
}
