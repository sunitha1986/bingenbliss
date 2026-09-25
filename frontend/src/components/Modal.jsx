function Modal({ children, onClose, className = "modal-card" }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={className}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
