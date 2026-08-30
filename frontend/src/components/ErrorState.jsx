import './ErrorState.css'

export default function ErrorState({ title = 'VALUATION UNAVAILABLE', message, onRetry }) {
  return (
    <div className="hv-card error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">!</span>
      <div>
        <p className="hv-label error-state__title">{title}</p>
        <p className="error-state__message">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
