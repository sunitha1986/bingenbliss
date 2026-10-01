import { useEffect, useState } from "react";
import {
  adminLogin,
  getAdminCustomers,
  getLuckyDrawStatus,
  setLuckyDrawVisibility,
  spinLuckyDraw,
  updateLuckyDrawFeatures,
} from "../services/api";
import { createClientId } from "../utils/createClientId";
import "../App.css";
import "./LuckyDraw.css";

function formatLast4Phone(phone) {
  const clean = (phone || "").replace(/\D/g, "");
  if (clean.length >= 4) {
    return `•••• ${clean.slice(-4)}`;
  }
  return "•••• 1234";
}

function AdminLuckyDraw() {
  const [entries, setEntries] = useState([]);
  const [adminToken, setAdminToken] = useState(
    () => window.localStorage.getItem("bnb-admin-token") || "",
  );
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [adminError, setAdminError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWheelOverlay, setShowWheelOverlay] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [wheelEnabled, setWheelEnabled] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [featureSettings, setFeatureSettings] = useState({
    annualEligibilityEnabled: true,
  });
  const [isUpdatingFeatures, setIsUpdatingFeatures] = useState(false);

  useEffect(() => {
    if (!adminToken) return;
    Promise.all([getLuckyDrawStatus(), getAdminCustomers(adminToken)])
      .then(([status, customerResult]) => {
        const normalizedCustomers = (customerResult.customers || []).map(
          (customer, index) => ({
            ...customer,
            id: String(customer.id ?? index),
            name: customer.name ?? customer.Name ?? "",
            phone: customer.phone ?? customer.Phone ?? "",
            dob:
              customer.dob ?? customer.date ?? customer["Date of birth"] ?? "",
            occasion:
              customer.occasion ?? customer.Occasion ?? "Special Celebration",
          }),
        );
        setWheelEnabled(status.wheelEnabled);
        setFeatureSettings({
          annualEligibilityEnabled: status.annualEligibilityEnabled !== false,
        });
        setEntries(normalizedCustomers);
      })
      .catch((error) => {
        if (error.message === "Admin access is required") {
          window.localStorage.removeItem("bnb-admin-token");
          setAdminToken("");
          setEntries([]);
          return;
        }
        setAdminError(error.message || "Unable to load admin draw data");
      });
  }, [adminToken]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAdminError("");
    try {
      const result = await adminLogin(credentials);
      setAdminToken(result.token);
      window.localStorage.setItem("bnb-admin-token", result.token);
      setCredentials({ email: "", password: "" });
      window.history.replaceState({}, "", "/");
    } catch (error) {
      setAdminError(error.message || "Unable to sign in as admin");
    }
  };

  const handleSpin = async () => {
    if (!adminToken || isDrawing || showWheelOverlay) return;
    setAdminError("");
    try {
      const result = await spinLuckyDraw(adminToken);
      const matchingEntry = entries.find((entry) => {
        const entryName = entry.name ?? entry.Name ?? "";
        const entryPhone = entry.phone ?? entry.Phone ?? "";
        return (
          entryName === result.winner.Name && entryPhone === result.winner.Phone
        );
      });
      const winnerEntry = matchingEntry || {
        id: createClientId(),
        name: result.winner.Name || result.winner.name,
        phone: result.winner.Phone || result.winner.phone,
        date:
          result.winner.date ||
          result.winner.dob ||
          result.winner["Date of birth"],
        occasion:
          result.winner.occasion ||
          result.winner.Occasion ||
          "Special Celebration",
      };
      setWinner(winnerEntry);
      setWhatsappLink(result.whatsapp?.chatLink || "");

      // Step 1: Rapid capsule blinking on main screen
      setIsDrawing(true);
      if (window.matchMedia("(max-width: 768px)").matches) {
        window.setTimeout(() => {
          document
            .querySelector(".admin-draw-panel .name-capsule-grid")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
      }
      setShowWheelOverlay(false);
      setShowWinnerPopup(false);

      // Step 2: Show spinning wheel overlay after 2.2s
      window.setTimeout(() => {
        setShowWheelOverlay(true);
      }, 2200);

      // Step 3: Hide overlay & open winner dialog after another 2.5s (4.7s total)
      window.setTimeout(() => {
        setIsDrawing(false);
        setShowWheelOverlay(false);
        setShowWinnerPopup(true);
      }, 4700);
    } catch (error) {
      if (error.message === "Admin access is required") {
        window.localStorage.removeItem("bnb-admin-token");
        setAdminToken("");
      }
      setAdminError(error.message || "Unable to spin the wheel");
    }
  };

  const handleVisibilityToggle = async () => {
    setIsUpdatingVisibility(true);
    setAdminError("");
    try {
      const result = await setLuckyDrawVisibility(adminToken, !wheelEnabled);
      setWheelEnabled(result.wheelEnabled);
    } catch (error) {
      setAdminError(error.message || "Unable to update draw visibility");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleFeatureSettingChange = async (feature, enabled) => {
    const previousValue = featureSettings[feature];
    setFeatureSettings((current) => ({ ...current, [feature]: enabled }));
    setIsUpdatingFeatures(true);
    setAdminError("");

    try {
      const settings = await updateLuckyDrawFeatures(adminToken, {
        [feature]: enabled,
      });
      setFeatureSettings(settings);
    } catch (error) {
      setFeatureSettings((current) => ({
        ...current,
        [feature]: previousValue,
      }));
      setAdminError(error.message || "Unable to update lucky draw settings");
    } finally {
      setIsUpdatingFeatures(false);
    }
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/" aria-label="Binge N Bliss home">
          <img src="/landing_page/logo.jpg" alt="Binge N Bliss" />
          <span>BNB admin</span>
        </a>
        <nav className="admin-nav">
          <a className="is-active" href="#spin-wheel">
            Spin draw
          </a>
          <a href="/admin/customers">Customers</a>
          <a href="/admin/winner-history">Winner history</a>
          <a href="/lucky-draw">Customer site</a>
        </nav>
        {adminToken && (
          <button
            className="admin-signout"
            onClick={() => {
              window.localStorage.removeItem("bnb-admin-token");
              window.location.href = "/";
            }}
            type="button"
          >
            Sign out
          </button>
        )}
      </aside>
      <section className="admin-main" id="admin-lucky-draw">
        <div className="admin-page-heading">
          <span className="heading-tag">Monthly Draw</span>
          <span className="heading-title">Choose a winner.</span>
          <span className="heading-divider">•</span>
          <span className="heading-sub">
            Choose one winner from the saved customer entries.
          </span>
        </div>
        <div className="admin-draw-layout" id="spin-wheel">
          {!adminToken ? (
            <form className="admin-access-form" onSubmit={handleAdminLogin}>
              <p className="admin-access-title">Admin access</p>
              <input
                type="email"
                value={credentials.email}
                onChange={(event) =>
                  setCredentials((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Admin email"
                aria-label="Admin email"
                required
              />
              <input
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Admin password"
                aria-label="Admin password"
                required
              />
              <button className="dark-button" type="submit">
                Sign in to continue <span>↗</span>
              </button>
              {adminError && (
                <p className="form-error" role="alert">
                  {adminError}
                </p>
              )}
            </form>
          ) : (
            <div className="admin-draw-panel">
              <span className="admin-access-title">
                🔒 Admin Control Active
              </span>
              <div className="lucky-draw-reveal-panel">
                <span className="draw-reveal-kicker">
                  Monthly Winner Selection
                </span>
                <strong className={isDrawing ? "is-drawing" : ""}>
                  {isDrawing
                    ? "And the winner is..."
                    : winner
                      ? winner.name
                      : "Ready when you are"}
                </strong>
                <div
                  className="name-capsule-grid"
                  aria-label="Lucky draw customers"
                >
                  {entries.map((entry, index) => {
                    const displayName = entry.name ?? entry.Name ?? "Unknown";
                    const isWinner =
                      !isDrawing &&
                      (winner?.name ?? winner?.Name ?? "") === displayName;
                    return (
                      <span
                        className={[
                          "name-capsule",
                          isWinner ? "is-winner" : "",
                          isDrawing ? "is-blinking" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={entry.id}
                        style={{
                          animationDelay: `${(index * 79) % 900}ms`,
                          animationDuration: `${1.2 + (index % 4) * 0.38}s`,
                        }}
                      >
                        {displayName}
                      </span>
                    );
                  })}
                </div>
                <small>
                  {entries.length} entries registered in this month&apos;s draw
                </small>
              </div>

              <button
                className="draw-button"
                disabled={isDrawing || !entries.length}
                onClick={handleSpin}
                type="button"
              >
                <span>
                  {isDrawing ? "Selecting Winner..." : "Start the Draw"}
                </span>
                <span className="btn-arrow">→</span>
              </button>

              <button
                className="admin-visibility-button"
                disabled={isUpdatingVisibility}
                onClick={handleVisibilityToggle}
                type="button"
              >
                <span>
                  {isUpdatingVisibility
                    ? "Updating..."
                    : wheelEnabled
                      ? "👁 Hide Draw from Customers"
                      : "✨ Enable Draw for Customers"}
                </span>
              </button>

              <p className="admin-visibility-status">
                <span
                  className={`status-dot ${wheelEnabled ? "is-live" : "is-hidden"}`}
                ></span>
                <span>
                  Public Wheel:{" "}
                  <strong>
                    {wheelEnabled
                      ? "Live for customers"
                      : "Hidden from customers"}
                  </strong>
                </span>
              </p>

              <fieldset
                className="admin-feature-settings"
                disabled={isUpdatingFeatures}
              >
                <legend>Draw behavior</legend>
                <label className="admin-feature-toggle">
                  <span>
                    <strong>Annual entry limit</strong>
                    <small>
                      Limit each phone to one entry per year and exclude recent
                      winners.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={featureSettings.annualEligibilityEnabled}
                    onChange={(event) =>
                      handleFeatureSettingChange(
                        "annualEligibilityEnabled",
                        event.target.checked,
                      )
                    }
                    aria-label="Enable annual entry and winner limits"
                  />
                </label>
              </fieldset>

              {adminError && (
                <p className="form-error" role="alert">
                  {adminError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Full Screen Spinning Wheel Overlay Blocking Screen */}
      {showWheelOverlay && (
        <div
          className="spinning-wheel-full-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="spinning-wheel-stage">
            <div className="wheel-crown-header">👑</div>

            <div className="wheel-stage-container">
              {/* Pointer at top (Stationary) */}
              <div className="wheel-top-pointer">▼</div>

              {/* Smooth Spinning Wheel Rotator */}
              <div className="wheel-svg-rotator is-spinning">
                <svg
                  viewBox="0 0 300 300"
                  width="300"
                  height="300"
                  className="wheel-svg-graphic"
                >
                  {/* Outer Rim Shadow & Glow */}
                  <circle cx="150" cy="150" r="146" fill="#be185d" />
                  <circle cx="150" cy="150" r="138" fill="#e879f9" />

                  {/* 8 Segments */}
                  <g>
                    <path
                      d="M150 150 L150 15 A135 135 0 0 1 245.45 54.55 Z"
                      fill="#fbcfe8"
                    />
                    <path
                      d="M150 150 L245.45 54.55 A135 135 0 0 1 285 150 Z"
                      fill="#f3e8ff"
                    />
                    <path
                      d="M150 150 L285 150 A135 135 0 0 1 245.45 245.45 Z"
                      fill="#fef08a"
                    />
                    <path
                      d="M150 150 L245.45 245.45 A135 135 0 0 1 150 285 Z"
                      fill="#e0e7ff"
                    />
                    <path
                      d="M150 150 L150 285 A135 135 0 0 1 54.55 245.45 Z"
                      fill="#fbcfe8"
                    />
                    <path
                      d="M150 150 L54.55 245.45 A135 135 0 0 1 15 150 Z"
                      fill="#f3e8ff"
                    />
                    <path
                      d="M150 150 L15 150 A135 135 0 0 1 54.55 54.55 Z"
                      fill="#fef08a"
                    />
                    <path
                      d="M150 150 L54.55 54.55 A135 135 0 0 1 150 15 Z"
                      fill="#e0e7ff"
                    />
                  </g>

                  {/* Segment Divider Lines */}
                  <g stroke="#ffffff" strokeWidth="3" opacity="0.85">
                    <line x1="150" y1="150" x2="150" y2="15" />
                    <line x1="150" y1="150" x2="245.45" y2="54.55" />
                    <line x1="150" y1="150" x2="285" y2="150" />
                    <line x1="150" y1="150" x2="245.45" y2="245.45" />
                    <line x1="150" y1="150" x2="150" y2="285" />
                    <line x1="150" y1="150" x2="54.55" y2="245.45" />
                    <line x1="150" y1="150" x2="15" y2="150" />
                    <line x1="150" y1="150" x2="54.55" y2="54.55" />
                  </g>

                  {/* Outer Lights / Bulbs */}
                  {[
                    0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225,
                    247.5, 270, 292.5, 315, 337.5,
                  ].map((angle, idx) => {
                    const rad = (angle * Math.PI) / 180;
                    const cx = 150 + 141.5 * Math.sin(rad);
                    const cy = 150 - 141.5 * Math.cos(rad);
                    return (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r="4.5"
                        fill={idx % 2 === 0 ? "#ffffff" : "#fef08a"}
                        stroke="#be185d"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Center Cap */}
                  <circle cx="150" cy="150" r="32" fill="#be185d" />
                  <circle cx="150" cy="150" r="26" fill="#ec4899" />
                  <circle cx="150" cy="150" r="20" fill="#f472b6" />
                  <circle
                    cx="144"
                    cy="144"
                    r="6"
                    fill="#ffffff"
                    opacity="0.7"
                  />
                </svg>
              </div>

              {/* Pedestal Stand (Stationary at bottom) */}
              <div className="wheel-pedestal-stand">
                <div className="pedestal-top"></div>
                <div className="pedestal-base"></div>
              </div>
            </div>

            <div className="spinning-wheel-status">
              <h2>Spinning the Lucky Wheel...</h2>
              <p>Selecting this month&apos;s lucky draw winner!</p>
            </div>
          </div>
        </div>
      )}

      {/* Smooth Winner Card Modal Overlaid on 3D Template Poster */}
      {showWinnerPopup && winner && (
        <div
          className="winner-popup-backdrop"
          onClick={() => setShowWinnerPopup(false)}
          role="presentation"
        >
          <div
            className="winner-template-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-winner-popup-title"
          >
            <button
              className="winner-template-close-btn"
              onClick={() => setShowWinnerPopup(false)}
              type="button"
              aria-label="Close winner announcement"
            >
              ×
            </button>

            {/* Poster Graphic with Text Overlays */}
            <div className="template-poster-wrapper">
              <img
                src="/lucky_draw_registration/winner_card_template.png"
                alt="Winner Announcement Template"
                className="template-poster-img"
              />

              <div className="template-overlay-layer">
                {/* Occasion Ribbon Text - Winner Name */}
                <div className="overlay-ribbon-text">{winner.name}</div>

                {/* Slot 2: Celebration Date */}
                <div className="overlay-slot slot-date">
                  <span className="slot-label">Celebration Date</span>
                  <strong className="slot-value">
                    {winner.date || winner.dob || "Upcoming Celebration"}
                  </strong>
                </div>

                {/* Slot 3: Occasion */}
                <div className="overlay-slot slot-occasion">
                  <span className="slot-label">Occasion</span>
                  <strong className="slot-value">
                    {winner.occasion || "Special Celebration"}
                  </strong>
                </div>

                {/* Slot 4: Phone Number */}
                <div className="overlay-slot slot-phone">
                  <span className="slot-label">
                    Phone Number (Last 4 Digits)
                  </span>
                  <strong className="slot-value">
                    {formatLast4Phone(winner.phone)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Buttons at bottom */}
            <div className="template-card-footer-actions">
              {whatsappLink ? (
                <a
                  className="winner-claim-btn whatsapp-action-btn"
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Send WhatsApp Notification <span>↗</span>
                </a>
              ) : (
                <button
                  className="winner-claim-btn"
                  onClick={() => setShowWinnerPopup(false)}
                  type="button"
                >
                  Close Poster <span>✨</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminLuckyDraw;
