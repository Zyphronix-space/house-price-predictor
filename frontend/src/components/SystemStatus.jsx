import { api } from '../lib/api'
import { usePolling } from '../lib/hooks'
import './SystemStatus.css'

export default function SystemStatus({ compact = false }) {
  const { data, error } = usePolling(() => api.health(), 15000)
  const ready = !error && data?.status === 'ok'

  return (
    <div className={`system-status ${compact ? 'system-status--compact' : ''}`}>
      <span className={`system-status__dot ${ready ? 'is-ready' : 'is-offline'}`} aria-hidden="true" />
      {!compact && <span className="hv-label">Model engine</span>}
      <span className="system-status__state">{ready ? 'Ready' : 'Offline'}</span>
    </div>
  )
}
