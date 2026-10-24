import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminLogin,
  getLuckyDrawStatus,
  spinLuckyDraw,
  updateLuckyDrawFeatures,
  updateLuckyDrawNextDrawDate,
} from "../services/api";
import AdminEnquiriesLink from "../components/AdminEnquiriesLink";
import AdminBackButton from "../components/AdminBackButton";
import Modal from "../components/Modal";
import { createClientId } from "../utils/createClientId";
import "../App.css";
import "./LuckyDraw.css";
import logoImg from "../assets/landing_page/logo.jpg";
import winnerCardTemplateImg from "../assets/lucky_draw_registration/winner_card_template.png";

function formatLast4Phone(phone) {
  const clean = (phone || "").replace(/\D/g, "");
  if (clean.length >= 4) {
    return `•••• ${clean.slice(-4)}`;
  }
  return "•••• 1234";
}

function normalizeDrawEntries(entries = []) {
  return entries.map((entry, index) => ({
    ...entry,
    id: String(entry.id ?? index),
    name: entry.name || "",
    celebrationDate:
      entry.celebrationDate ||
      entry.date ||
      entry["Celebration date"] ||
      entry["Date of birth"] ||
      "",
  }));
}

const drawMonths = Array.from({ length: 12 }, (_, monthIndex) =>
  new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, monthIndex, 1)),
  ),
);

function getEntryMonth(entry) {
  const month = String(entry.celebrationDate).match(/^\d{4}-(\d{2})/)?.[1];
  return month ? Number(month) : null;
}

function AdminLuckyDraw() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [drawCountsByMonth, setDrawCountsByMonth] = useState({});
  const [drawCountYear, setDrawCountYear] = useState(new Date().getFullYear());
  const [selectedDrawMonth, setSelectedDrawMonth] = useState(() =>
    new Intl.DateTimeFormat("en", {
      month: "long",
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
  const [adminToken, setAdminToken] = useState(
    () => window.localStorage.getItem("bnb-admin-token") || "",
  );
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [adminError, setAdminError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpinRequestInFlight, setIsSpinRequestInFlight] = useState(false);
  const spinRequestInFlightRef = useRef(false);
  const [showSpinConfirmation, setShowSpinConfirmation] = useState(false);
  const [showWheelOverlay, setShowWheelOverlay] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [, setWheelEnabled] = useState(true);
  const [manualDrawCompleted, setManualDrawCompleted] = useState(false);
  const [hasWinnerForCurrentCycle, setHasWinnerForCurrentCycle] =
    useState(false);

  const [eligibilityRules, setEligibilityRules] = useState({
    annualEligibilityEnabled: true,
    previousWinnerExclusionEnabled: true,
  });
  const [isSavingEligibilityRules, setIsSavingEligibilityRules] =
    useState(false);
  const [nextDrawDate, setNextDrawDate] = useState("");
  const [isSavingNextDrawDate, setIsSavingNextDrawDate] = useState(false);
  const [nextDrawDateSaved, setNextDrawDateSaved] = useState(false);
  const [isAdminStatusLoaded, setIsAdminStatusLoaded] = useState(false);

  useEffect(() => {
    if (!adminToken) return;
    setIsAdminStatusLoaded(false);
    getLuckyDrawStatus()
      .then((status) => {
        setWheelEnabled(status.wheelEnabled ?? true);
        const drawDone = Boolean(
          status.manualDrawCompleted || status.hasWinnerForCurrentCycle,
        );
        setManualDrawCompleted(drawDone);
        setHasWinnerForCurrentCycle(Boolean(status.hasWinnerForCurrentCycle));
        if (status.lastSpin?.winner) {
          const w = status.lastSpin.winner;
          setWinner(
            (current) =>
              current || {
                id: String(w.id ?? status.lastSpin.id ?? createClientId()),
                name: w.Name || w.name,
                phone: w.Phone || w.phone,
                date: w.date || w.dob || w["Date of birth"],
                occasion: w.occasion || w.Occasion || "Special Celebration",
              },
          );
        }
        setEligibilityRules({
          annualEligibilityEnabled: status.annualEligibilityEnabled !== false,
          previousWinnerExclusionEnabled:
            status.previousWinnerExclusionEnabled !== false,
        });
        if (status.nextDrawDate || status.drawDate) {
          setNextDrawDate(status.nextDrawDate || status.drawDate);
        }
        setEntries(normalizeDrawEntries(status.entries));
        setDrawCountsByMonth(status.drawCountsByMonth || {});
        setDrawCountYear(status.drawCountYear || new Date().getFullYear());
        setIsAdminStatusLoaded(true);
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

  useEffect(() => {
    if (!adminToken || !isAdminStatusLoaded) return undefined;
    let isActive = true;

    const syncDrawStatus = async () => {
      try {
        const status = await getLuckyDrawStatus();
        if (!isActive) return;

        setEntries(normalizeDrawEntries(status.entries));
        setDrawCountsByMonth(status.drawCountsByMonth || {});
        setDrawCountYear(status.drawCountYear || new Date().getFullYear());
        setWheelEnabled(status.wheelEnabled ?? true);
        const drawDone = Boolean(
          status.manualDrawCompleted || status.hasWinnerForCurrentCycle,
        );
        setManualDrawCompleted(drawDone);
        setHasWinnerForCurrentCycle(Boolean(status.hasWinnerForCurrentCycle));
        if (status.nextDrawDate || status.drawDate) {
          setNextDrawDate((curr) => curr || status.nextDrawDate || status.drawDate);
        }
      } catch (error) {
        if (isActive) {
          handleAdminActionError(error, "Unable to refresh draw status");
        }
      }
    };

    const intervalId = window.setInterval(() => {
      if (isActive && document.visibilityState === "visible") {
        void syncDrawStatus();
      }
    }, 2500);

    window.addEventListener("focus", syncDrawStatus);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncDrawStatus);
    };
  }, [adminToken, isAdminStatusLoaded]);

  const handleAdminActionError = (error, fallbackMessage) => {
    if (error.message === "Admin access is required") {
      window.localStorage.removeItem("bnb-admin-token");
      setAdminToken("");
      setAdminError("Your admin session has expired. Sign in again.");
      return;
    }
    setAdminError(error.message || fallbackMessage);
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAdminError("");
    try {
      const result = await adminLogin(credentials);
      setAdminToken(result.token);
      window.localStorage.setItem("bnb-admin-token", result.token);
      setCredentials({ email: "", password: "" });
      navigate("/admin/spin-wheel", { replace: true });
    } catch (error) {
      setAdminError(error.message || "Unable to sign in as admin");
    }
  };

  const isCompletedOrHasWinner = Boolean(
    manualDrawCompleted || hasWinnerForCurrentCycle || winner,
  );
  const currentDrawMonthNumber = Number(
    new Intl.DateTimeFormat("en", {
      month: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
  const selectedDrawMonthNumber = drawMonths.indexOf(selectedDrawMonth) + 1;
  const entriesForSelectedMonth = entries.filter(
    (entry) => getEntryMonth(entry) === selectedDrawMonthNumber,
  );

  const handleSpin = async () => {
    if (
      !adminToken ||
      spinRequestInFlightRef.current ||
      isDrawing ||
      showWheelOverlay ||
      !entriesForSelectedMonth.length
    ) {
      return;
    }

    // Immediately prevent multiple clicks and update UI to drawing mode
    spinRequestInFlightRef.current = true;
    setIsSpinRequestInFlight(true);
    setIsDrawing(true);
    setShowWinnerPopup(false);
    setAdminError("");
    let animationWillContinue = false;

    try {
      const result = await spinLuckyDraw(adminToken, {
        respin: isCompletedOrHasWinner,
        celebrationMonth: selectedDrawMonthNumber,
      });
      setManualDrawCompleted(true);
      const winnerEntry = {
        id: String(result.winner.id ?? result.spinId ?? createClientId()),
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
      try {
        window.localStorage.setItem(
          "bnb-lucky-draw-latest-winner",
          JSON.stringify(winnerEntry),
        );
      } catch { }
      setWhatsappLink(result.whatsapp?.chatLink || "");

      try {
        const updatedStatus = await getLuckyDrawStatus();
        setEntries(normalizeDrawEntries(updatedStatus.entries));
        setDrawCountsByMonth(updatedStatus.drawCountsByMonth || {});
        setDrawCountYear(
          updatedStatus.drawCountYear || new Date().getFullYear(),
        );
      } catch { }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setIsDrawing(false);
        setShowWheelOverlay(false);
        setShowWinnerPopup(true);
        setWheelEnabled(true);
        return;
      }

      // Keep the entry animation visible before the wheel begins.
      animationWillContinue = true;
      if (window.matchMedia("(max-width: 768px)").matches) {
        window.setTimeout(() => {
          document
            .querySelector(".admin-draw-panel .name-capsule-grid")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
      }
      setShowWheelOverlay(false);
      setShowWinnerPopup(false);

      // Start the wheel after the entry capsules have animated.
      window.setTimeout(() => {
        setShowWheelOverlay(true);
      }, 3500);

      // Match the wheel animation duration before showing the winner dialog.
      window.setTimeout(() => {
        setIsDrawing(false);
        setShowWheelOverlay(false);
        setShowWinnerPopup(true);
        spinRequestInFlightRef.current = false;
        setWheelEnabled(true);
      }, 9000);
    } catch (error) {
      setIsDrawing(false);
      spinRequestInFlightRef.current = false;
      handleAdminActionError(error, "Unable to run the lucky draw");
    } finally {
      setIsSpinRequestInFlight(false);
      if (!animationWillContinue) {
        spinRequestInFlightRef.current = false;
      }
    }
  };



  const handleSaveEligibilityRules = async (rulesToSave = eligibilityRules) => {
    setEligibilityRules(rulesToSave);
    setIsSavingEligibilityRules(true);
    setAdminError("");

    try {
      const settings = await updateLuckyDrawFeatures(adminToken, {
        annualEligibilityEnabled: rulesToSave.annualEligibilityEnabled,
        previousWinnerExclusionEnabled:
          rulesToSave.previousWinnerExclusionEnabled,
      });
      setEligibilityRules({
        annualEligibilityEnabled: settings.annualEligibilityEnabled !== false,
        previousWinnerExclusionEnabled:
          settings.previousWinnerExclusionEnabled !== false,
      });
      try {
        const status = await getLuckyDrawStatus();
        setEntries(normalizeDrawEntries(status.entries));
      } catch (error) {
        setAdminError(
          `Rules saved, but eligible entries could not be refreshed: ${error.message}`,
        );
      }
    } catch (error) {
      handleAdminActionError(error, "Unable to save eligibility rules");
    } finally {
      setIsSavingEligibilityRules(false);
    }
  };

  const handleNextDrawDateChange = async (event) => {
    const value = event.target.value;
    setNextDrawDate(value);
    setIsSavingNextDrawDate(true);
    setNextDrawDateSaved(false);
    try {
      await updateLuckyDrawNextDrawDate(adminToken, value);
      setNextDrawDateSaved(true);
      window.setTimeout(() => setNextDrawDateSaved(false), 2500);
    } catch (error) {
      handleAdminActionError(error, "Unable to save next draw date");
    } finally {
      setIsSavingNextDrawDate(false);
    }
  };

  if (!adminToken) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleAdminLogin}>
          <a
            className="admin-login-brand"
            href="/"
            aria-label="Binge & Bliss home"
          >
            <img src={logoImg} alt="Binge & Bliss" />
            <span>Binge &amp; Bliss</span>
            <small>ADMIN PORTAL</small>
          </a>
          <p className="admin-access-title">Admin access</p>
          <h1>Sign in to continue</h1>
          <p className="admin-login-description">
            Enter your admin credentials to access the draw dashboard.
          </p>
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
            autoComplete="username"
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
            autoComplete="current-password"
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
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-brand-row">
          <AdminBackButton />
          <a className="admin-brand" href="/" aria-label="Binge N Bliss home">
            <img src={logoImg} alt="Binge N Bliss" />
            <span>BNB admin</span>
          </a>
        </div>
        <nav className="admin-nav">
          <a className="is-active" href="/admin/spin-wheel">
            Spin wheel
          </a>
          <a href="/admin/occasions">Special occasions</a>
          <a href="/admin/customers">Customers</a>
          <AdminEnquiriesLink />
          <a href="/admin/winner-history">Winner history</a>
        </nav>
        {adminToken && (
          <button
            className="admin-signout"
            onClick={() => {
              window.localStorage.removeItem("bnb-admin-token");
              window.location.href = "/admin";
            }}
            type="button"
          >
            Sign out
          </button>
        )}
      </aside>
      <section className="admin-main" id="admin-lucky-draw">
        <div className="admin-page-heading">
          <span className="heading-tag">Monthly Draw - Choose a winner.</span>
        </div>
        <div className="admin-draw-layout" id="spin-wheel">
          <div className="admin-draw-panel">
            <section
              className="admin-draw-tab-panel is-manual"
              id="draw-tab-panel"
            >
              <div className="admin-draw-step">
                <div className="admin-draw-step-heading">
                  <span>Step 1</span>
                  <h2>Manual spin</h2>
                </div>
                <section
                  className="admin-draw-widget is-unlocked"
                  aria-label="Lucky draw widget"
                >
                  <div className="admin-draw-controls-row">
                    <label className="admin-draw-month-control">
                      <span className="admin-draw-control-label">
                        Draw month
                      </span>
                      <select
                        value={selectedDrawMonth}
                        onChange={(event) =>
                          setSelectedDrawMonth(event.target.value)
                        }
                      >
                        {drawMonths.map((month, monthIndex) => (
                          <option
                            key={month}
                            value={month}
                            disabled={monthIndex + 1 < currentDrawMonthNumber}
                          >
                            {month}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="admin-draw-control admin-next-draw-date-control">
                      <span className="admin-draw-control-label">
                        Next draw date
                        {nextDrawDateSaved && (
                          <span className="save-indicator">✓ Saved</span>
                        )}
                      </span>
                      <input
                        type="date"
                        id="admin-next-draw-date"
                        value={nextDrawDate}
                        onChange={handleNextDrawDateChange}
                        disabled={
                          isSavingNextDrawDate ||
                          isDrawing ||
                          isSpinRequestInFlight
                        }
                        className="admin-next-draw-date-input"
                        aria-label="Next draw date"
                      />
                    </div>
                    <div className="admin-draw-control admin-previous-winner-control">
                      <span className="admin-draw-control-label">
                        Previous winners
                      </span>
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            eligibilityRules.previousWinnerExclusionEnabled
                          }
                          disabled={
                            isSavingEligibilityRules ||
                            isDrawing ||
                            isSpinRequestInFlight
                          }
                          onChange={(event) =>
                            void handleSaveEligibilityRules({
                              ...eligibilityRules,
                              previousWinnerExclusionEnabled:
                                event.target.checked,
                            })
                          }
                        />
                        Exclude last 12 months
                      </label>
                    </div>
                    <div className="admin-draw-control admin-draw-action-control">
                      <span className="admin-draw-control-label">Draw</span>
                      <button
                        id="admin-start-spin-button"
                        className={`draw-button ${isDrawing || isSpinRequestInFlight ? "is-running" : ""}`}
                        disabled={
                          isSpinRequestInFlight ||
                          isDrawing ||
                          !entriesForSelectedMonth.length
                        }
                        onClick={() => setShowSpinConfirmation(true)}
                        type="button"
                      >
                        <span>
                          {isDrawing
                            ? "Selecting Winner..."
                            : isSpinRequestInFlight
                              ? "Starting Draw..."
                              : "Spin Wheel"}
                        </span>
                        <span className="btn-arrow">→</span>
                      </button>
                    </div>
                  </div>

                  <div className="lucky-draw-reveal-panel">
                    <span className="draw-reveal-kicker">
                      Manual Winner Selection
                    </span>
                    <div className="admin-winner-display-stack">
                      <strong className={isDrawing ? "is-drawing" : ""}>
                        {isDrawing
                          ? "Selecting Winner..."
                          : winner
                            ? winner.name
                            : "Ready when you are"}
                      </strong>
                      {Boolean(winner) && !isDrawing && (
                        <button
                          type="button"
                          className="view-poster-glowing-btn admin-view-poster-btn"
                          onClick={() => setShowWinnerPopup(true)}
                          aria-label="View winner poster"
                        >
                          <span className="poster-label-full">View Winner Poster</span>
                          <span className="poster-label-compact">Poster</span>
                          <span className="btn-sparkle">✨ ↗</span>
                        </button>
                      )}
                    </div>
                    <div
                      className="name-capsule-grid"
                      aria-label="Lucky draw customers"
                    >
                      {entriesForSelectedMonth.map((entry, index) => {
                        const displayName =
                          entry.name ?? entry.Name ?? "Unknown";
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
                            }}
                          >
                            {displayName}
                          </span>
                        );
                      })}
                    </div>
                    {entriesForSelectedMonth.length === 0 && (
                      <p className="admin-draw-empty-month" role="status">
                        No eligible entries for {selectedDrawMonth}.
                      </p>
                    )}
                    <small>
                      {entriesForSelectedMonth.length} eligible entries for{" "}
                      {selectedDrawMonth}
                    </small>
                  </div>
                  <p className="admin-month-draw-count" role="status">
                    {drawCountsByMonth[selectedDrawMonthNumber] || 0} draws in{" "}
                    {selectedDrawMonth} {drawCountYear} so far (including
                    re-spins)
                  </p>
                </section>
              </div>
            </section>
            {adminError && (
              <p className="form-error" role="alert">
                {adminError}
              </p>
            )}
          </div>
        </div>
      </section>
      {/* Full Screen Spinning Wheel Overlay Blocking Screen */}
      {showSpinConfirmation && (
        <Modal
          className="admin-spin-confirm-modal"
          ariaLabelledby="admin-spin-confirm-title"
          onClose={() => setShowSpinConfirmation(false)}
        >
          <p className="admin-spin-confirm-kicker">Monthly draw</p>
          <h2 id="admin-spin-confirm-title">Start the spin wheel?</h2>
          <p className="admin-spin-confirm-copy">
            This will select a winner from the eligible entries for{" "}
            {selectedDrawMonth}. Do you want to continue?
          </p>
          <div className="admin-spin-confirm-actions">
            <button
              className="admin-spin-confirm-cancel"
              onClick={() => setShowSpinConfirmation(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="admin-spin-confirm-continue"
              onClick={() => {
                setShowSpinConfirmation(false);
                void handleSpin();
              }}
              type="button"
            >
              Spin wheel
            </button>
          </div>
        </Modal>
      )}
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
                src={winnerCardTemplateImg}
                alt="Winner Announcement Template"
                className="template-poster-img"
              />

              <div className="template-overlay-layer">
                {/* Occasion Ribbon Text - Winner Name */}
                <svg
                  className="overlay-ribbon-text"
                  viewBox="0 0 100 32"
                  role="img"
                  aria-label={`Winner: ${winner.name}`}
                >
                  <defs>
                    <path
                      id="admin-winner-name-curve"
                      d="M 8 27 Q 50 5 92 27"
                    />
                  </defs>
                  <text>
                    <textPath
                      href="#admin-winner-name-curve"
                      xlinkHref="#admin-winner-name-curve"
                      startOffset="50%"
                      textAnchor="middle"
                      textLength="82"
                      lengthAdjust="spacingAndGlyphs"
                    >
                      {winner.name}
                    </textPath>
                  </text>
                </svg>

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
              ) : null}
              <button
                className="winner-claim-btn"
                onClick={() => setShowWinnerPopup(false)}
                type="button"
              >
                Close Poster <span>✨</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminLuckyDraw;
