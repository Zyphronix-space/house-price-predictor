import './Modal.css'

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="hv-glass modal__panel">
        <div className="modal__header">
          <p className="modal__title">{title}</p>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
