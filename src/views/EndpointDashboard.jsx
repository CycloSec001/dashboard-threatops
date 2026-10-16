import DomainDashboard from './DomainDashboard'

export default function EndpointDashboard({ selectedTime }) {
  return <DomainDashboard domain="endpoint/assets" selectedTime={selectedTime} />
}
