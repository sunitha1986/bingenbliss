import logoImg from "../assets/landing_page/logo.jpg";
import { usePwaInstall } from "../hooks/usePwaInstall";
import PwaInstallModal from "./PwaInstallModal";
import "./GetTheAppButton.css";

export function GetTheAppButton({
  variant = "hero", // "hero" | "nav" | "floating"
  className = "",
  ratingScore = "5.0",
  ratingCount = "500+ RATINGS",
}) {
  const { isInstalled, isIOS, showInstructions, setShowInstructions, installApp } =
    usePwaInstall();

  // Render 5 golden stars
  const renderStars = () => (
    <div className="app-rating-stars" aria-label="5 out of 5 stars rating">
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <svg
          key={starIndex}
          className="star-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ))}
    </div>
  );

  if (variant === "nav") {
    return (
      <>
        <button
          type="button"
          className={`get-app-nav-pill ${className} ${isInstalled ? "is-installed" : ""}`}
          onClick={installApp}
          title={isInstalled ? "BingenBliss App is installed" : "Install BingenBliss App"}
          aria-label="Get BingenBliss App"
        >
          <div className="nav-app-logo-squircle">
            <img src={logoImg} alt="" />
          </div>
          <span className="nav-app-label">
            {isInstalled ? "App Installed ✓" : "Get the app"}
          </span>
          <span className="nav-app-stars-micro" aria-hidden="true">
            ★★★★★
          </span>
        </button>

        <PwaInstallModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          isIOS={isIOS}
        />
      </>
    );
  }

  // Hero / Default layout matching the reference image:
  // [ White Pill: [Icon] "Get the app" ] + [ 5 Stars + Rating Text ]
  return (
    <>
      <div className={`get-app-hero-container ${variant} ${className}`}>
        {/* Slick Action Pill Button matching Hero UI */}
        <button
          type="button"
          className={`get-app-pill ${isInstalled ? "is-installed" : ""}`}
          onClick={installApp}
          aria-label={isInstalled ? "BingenBliss App Installed" : "Get the BingenBliss App"}
        >
          <div className="app-logo-squircle">
            <img src={logoImg} alt="BingenBliss" />
          </div>
          <span className="app-btn-text">
            {isInstalled ? "App Installed ✓" : "Get the app"}
          </span>
          {!isInstalled && (
            <span className="app-btn-arrow" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H8M17 7V16" />
              </svg>
            </span>
          )}
        </button>

        {/* 5-Star Rating Section alongside the button */}
        <div className="app-rating-section">
          {renderStars()}
          <span className="app-rating-caption">
            {ratingScore} ({ratingCount})
          </span>
        </div>
      </div>

      <PwaInstallModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        isIOS={isIOS}
      />
    </>
  );
}

export default GetTheAppButton;
