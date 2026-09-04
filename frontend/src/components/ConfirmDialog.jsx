import './ConfirmDialog.css'

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="confirm-dialog__backdrop" aria-label="Close" onClick={onCancel} />
      <div className="hv-card confirm-dialog__panel">
        <p className="confirm-dialog__title">{title}</p>
        {message && <p className="confirm-dialog__message">{message}</p>}
        <div className="confirm-dialog__actions">
          <button type="button" className="hv-btn hv-btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`hv-btn ${danger ? 'confirm-dialog__danger-btn' : 'hv-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
