const COPY = {
  BACKEND_UNAVAILABLE: ['Backend unavailable', 'The ThreatOps backend could not be reached.'],
  SERVICE_UNAVAILABLE: ['Service unavailable', 'This backend service is temporarily unavailable.'],
  SESSION_EXPIRED: ['Session expired', 'Sign in again to continue.'],
  PERMISSION_DENIED: ['Permission denied', 'Your account is not authorized for this resource.'],
  NOT_FOUND: ['Not found', 'The requested resource was not found.'],
  VALIDATION_ERROR: ['Validation error', 'The backend rejected the request context or parameters.'],
  UNSUPPORTED: ['Capability unavailable', 'This capability is not currently exposed by the backend.'],
}

export default function CapabilityState({ state = 'UNSUPPORTED', onRetry }) {
  const [title, message] = COPY[state] || [state, 'No data is available for this view.']
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-6 py-12 text-center">
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      <p className="max-w-md text-xs text-slate-400">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-2 rounded-md border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-300">Retry</button>}
    </div>
  )
}
