import PageShell from './PageShell'
import CapabilityState from './CapabilityState'

export default function BackendPageState({ title, section = 'ThreatOps', capability = 'UNSUPPORTED' }) {
  return (
    <PageShell
      section={section}
      title={title}
      subtitle="This view displays only data exposed by the CycloSec backend."
    >
      <CapabilityState state={capability} />
    </PageShell>
  )
}
