import logoImg from "../assets/landing_page/logo.jpg";

export function PwaInstallModal({ isOpen, onClose, isIOS }) {
  if (!isOpen) return null;

  return (
    <div
      className="pwa-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div
        className="pwa-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="pwa-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close installation instructions"
        >
          ×
        </button>

        <div className="pwa-modal-header">
          <div className="pwa-brand-icon-wrapper">
            <img
              src={logoImg}
              alt="BingenBliss logo"
              className="pwa-brand-logo-img"
            />
          </div>
          <div className="pwa-header-text">
            <h3 id="pwa-install-title">Install BingenBliss App</h3>
            <p>Access events, venues & lucky draws right from your home screen.</p>
          </div>
        </div>

        <div className="pwa-modal-body">
          {isIOS ? (
            <div className="pwa-steps-list">
              <div className="pwa-step-item">
                <span className="pwa-step-num">1</span>
                <div className="pwa-step-content">
                  <p>
                    Tap the <strong>Share</strong> button{" "}
                    <span className="pwa-inline-icon ios-share-icon" aria-label="Share icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>{" "}
                    in your Safari browser toolbar (at the bottom of your screen).
                  </p>
                </div>
              </div>

              <div className="pwa-step-item">
                <span className="pwa-step-num">2</span>
                <div className="pwa-step-content">
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong>{" "}
                    <span className="pwa-inline-icon" aria-label="Plus icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </span>.
                  </p>
                </div>
              </div>

              <div className="pwa-step-item">
                <span className="pwa-step-num">3</span>
                <div className="pwa-step-content">
                  <p>
                    Tap <strong>Add</strong> in the top-right corner to complete the install.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pwa-steps-list">
              <div className="pwa-step-item">
                <span className="pwa-step-num">1</span>
                <div className="pwa-step-content">
                  <p>
                    Tap the <strong>Install</strong> icon{" "}
                    <span className="pwa-inline-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </span>{" "}
                    in your browser address bar or menu (<strong>⋮</strong>).
                  </p>
                </div>
              </div>

              <div className="pwa-step-item">
                <span className="pwa-step-num">2</span>
                <div className="pwa-step-content">
                  <p>
                    Select <strong>Install BingenBliss</strong> or <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="pwa-step-item">
                <span className="pwa-step-num">3</span>
                <div className="pwa-step-content">
                  <p>
                    Confirm the prompt to install BingenBliss onto your device.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pwa-modal-footer">
          <button
            className="pwa-modal-action-btn"
            onClick={onClose}
            type="button"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}

export default PwaInstallModal;
