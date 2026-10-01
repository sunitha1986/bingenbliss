import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  adminLogin,
  createLuckyDrawEntry,
  getLuckyDrawStatus,
} from "../services/api";
import "../App.css";
import "./LuckyDraw.css";

const celebrationOccasions = [
  "Birthday party",
  "Anniversary",
  "Kitty party",
  "Private theatre",
  "Mini theatre",
  "Photography",
  "Other",
];

function formatLast4Phone(phone) {
  const clean = (phone || "").replace(/\D/g, "");
  if (clean.length >= 4) {
    return `•••• ${clean.slice(-4)}`;
  }
  return "•••• 1234";
}

function validatePhoneNumber(phone) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) return false;
  if (/^(\d)\1{9}$/.test(cleanPhone)) return false;
  if (cleanPhone === "9876543210" || cleanPhone === "1234567890") return false;
  return true;
}

function LuckyDraw() {
  const [user, setUser] = useState(() => {
    const savedUser = window.localStorage.getItem("bnb-user");
    const adminToken = window.localStorage.getItem("bnb-admin-token");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    if (adminToken) {
      return { isAdmin: true };
    }
    return null;
  });

  const [activeModal, setActiveModal] = useState(null);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginRole, setLoginRole] = useState("customer");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [luckyDrawEntries, setLuckyDrawEntries] = useState([]);
  const [luckyDrawForm, setLuckyDrawForm] = useState({
    name: "",
    phone: "",
    occasion: "Birthday party",
    date: "",
    guests: "2",
    consent: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showDuplicatePhonePopup, setShowDuplicatePhonePopup] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWheelOverlay, setShowWheelOverlay] = useState(false);
  const [luckyDrawWinner, setLuckyDrawWinner] = useState(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const lastSpinIdRef = useRef(null);
  const hasLoadedStatus = useRef(false);

  // Verification state
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);

  const handleNavigateHome = (event) => {
    event.preventDefault();
    if (isNavigatingHome) return;
    setIsNavigatingHome(true);
    window.setTimeout(() => {
      window.location.href = "/";
    }, 380);
  };

  const isLoggedIn = Boolean(user);

  useEffect(() => {
    let isMounted = true;
    const syncStatus = async () => {
      try {
        const status = await getLuckyDrawStatus();
        if (!isMounted) return;

        setShowWheel(status.showWheel);
        setLuckyDrawEntries((currentEntries) => {
          const hasSameEntries =
            currentEntries.length === status.entries.length &&
            currentEntries.every(
              (entry, index) =>
                entry.id === status.entries[index]?.id &&
                entry.name === status.entries[index]?.name,
            );
          return hasSameEntries ? currentEntries : status.entries;
        });

        const currentSpinId = status.lastSpin?.id || null;

        if (!hasLoadedStatus.current) {
          hasLoadedStatus.current = true;
          lastSpinIdRef.current = currentSpinId;
          if (status.lastSpin) {
            const winner = status.lastSpin.winner || {};
            setLuckyDrawWinner({
              id: `${winner.Name || winner.name}-${winner.Phone || winner.phone}`,
              name: winner.Name || winner.name || "Lucky Winner",
              phone: winner.Phone || winner.phone || "",
              date: winner.date || winner.dob || winner["Date of birth"] || "",
              occasion:
                winner.occasion || winner.Occasion || "Special Celebration",
            });
          }
          return;
        }

        // Only trigger drawing sequence if showWheel is true AND a brand new spin occurs
        if (
          status.showWheel &&
          currentSpinId &&
          currentSpinId !== lastSpinIdRef.current
        ) {
          lastSpinIdRef.current = currentSpinId;
          const winner = status.lastSpin.winner || {};
          const winnerEntry = {
            id: `${winner.Name || winner.name}-${winner.Phone || winner.phone}`,
            name: winner.Name || winner.name || "Lucky Winner",
            phone: winner.Phone || winner.phone || "",
            date: winner.date || winner.dob || winner["Date of birth"] || "",
            occasion:
              winner.occasion || winner.Occasion || "Special Celebration",
          };
          setLuckyDrawWinner(winnerEntry);

          // Step 1: Rapid blinking on name capsules on main screen
          setIsDrawing(true);
          if (window.matchMedia("(max-width: 768px)").matches) {
            window.setTimeout(() => {
              document
                .querySelector(".lucky-draw-reveal-panel .name-capsule-grid")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 0);
          }
          setShowWheelOverlay(false);
          setShowWinnerPopup(false);

          // Step 2: Show spinning wheel overlay after 2.2s of name blinking
          window.setTimeout(() => {
            if (isMounted) {
              setShowWheelOverlay(true);
            }
          }, 2200);

          // Step 3: Hide overlay & open winner dialog after another 2.5s (4.7s total)
          window.setTimeout(() => {
            if (isMounted) {
              setIsDrawing(false);
              setShowWheelOverlay(false);
              setShowWinnerPopup(true);
            }
          }, 4700);
        } else if (currentSpinId !== lastSpinIdRef.current) {
          lastSpinIdRef.current = currentSpinId;
        }
      } catch {
        if (isMounted) setShowWheel(false);
      }
    };

    syncStatus();
    const statusTimer = window.setInterval(syncStatus, 1000);
    return () => {
      isMounted = false;
      window.clearInterval(statusTimer);
    };
  }, []);

  const openLogin = () => {
    setActiveModal("login");
    setLoginError("");
  };

  const handleLogout = () => {
    window.localStorage.removeItem("bnb-user");
    window.localStorage.removeItem("bnb-admin-token");
    setUser(null);
    setActiveModal(null);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    try {
      if (loginRole === "admin") {
        const result = await adminLogin({
          email: adminEmail.trim(),
          password: adminPassword,
        });
        window.localStorage.setItem("bnb-admin-token", result.token);
        window.localStorage.removeItem("bnb-user");
        setUser({ isAdmin: true });
        setActiveModal(null);
        return;
      }

      const normalizedPhone = loginPhone.replace(/\D/g, "");
      if (!validatePhoneNumber(normalizedPhone)) {
        throw new Error(
          "Please enter a valid 10-digit Indian WhatsApp number.",
        );
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setUser(result.user);
      window.localStorage.setItem("bnb-user", JSON.stringify(result.user));
      setActiveModal(null);
    } catch (error) {
      setLoginError(error.message || "Unable to sign in");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const updateLuckyDrawField = (field, value) => {
    setLuckyDrawForm((currentForm) => ({ ...currentForm, [field]: value }));
    if (field === "phone") {
      setIsPhoneVerified(false);
      setIsVerifyingPhone(false);
      setGeneratedCode("");
      setEnteredCode("");
      setOtpError("");
      setPhoneError("");
    }
  };

  const closeRegistrationResult = () => {
    setLuckyDrawForm({
      name: "",
      phone: "",
      occasion: "Birthday party",
      date: "",
      guests: "2",
      consent: true,
    });
    setIsPhoneVerified(false);
    setIsVerifyingPhone(false);
    setGeneratedCode("");
    setEnteredCode("");
    setOtpError("");
    setPhoneError("");
    setSubmitError("");
    setSubmitSuccess(false);
    setShowDuplicatePhonePopup(false);
  };

  const handleSendOtp = () => {
    setPhoneError("");
    setOtpError("");
    const cleanPhone = (luckyDrawForm.phone || "").replace(/\D/g, "");
    if (!validatePhoneNumber(cleanPhone)) {
      setPhoneError(
        "Please enter a valid 10-digit Indian WhatsApp number starting with 6, 7, 8, or 9.",
      );
      return;
    }

    const code = "7374";
    setGeneratedCode(code);
    setIsVerifyingPhone(true);
  };

  const handleVerifyOtp = (e) => {
    if (e) e.preventDefault();
    setOtpError("");
    if (!enteredCode.trim()) {
      setOtpError("Please enter the 4-digit code.");
      return;
    }
    if (enteredCode.trim() === generatedCode) {
      setIsPhoneVerified(true);
      setIsVerifyingPhone(false);
      setOtpError("");
    } else {
      setOtpError("Invalid code. Enter the 4-digit verification code.");
    }
  };

  const cleanPhone = (luckyDrawForm.phone || "").replace(/\D/g, "");
  const isFormValid = Boolean(
    luckyDrawForm.name.trim() &&
    validatePhoneNumber(cleanPhone) &&
    isPhoneVerified &&
    luckyDrawForm.occasion &&
    luckyDrawForm.date &&
    luckyDrawForm.guests &&
    Number(luckyDrawForm.guests) > 0 &&
    luckyDrawForm.consent,
  );

  const handleLuckyDrawSubmit = async (event) => {
    event.preventDefault();
    if (!isFormValid) {
      if (!isPhoneVerified) {
        setSubmitError("Please verify your WhatsApp number before submitting.");
      } else {
        setSubmitError("Please complete all form fields.");
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const payload = {
        ...luckyDrawForm,
        phone: cleanPhone,
      };
      const result = await createLuckyDrawEntry(payload);

      const loggedUser = result.user || {
        name: luckyDrawForm.name.trim(),
        phone: cleanPhone,
      };
      setUser(loggedUser);
      window.localStorage.setItem("bnb-user", JSON.stringify(loggedUser));

      const status = await getLuckyDrawStatus();
      setLuckyDrawEntries(status.entries);
      setSubmitSuccess(true);
    } catch (error) {
      if (/already registered/i.test(error.message || "")) {
        setShowDuplicatePhonePopup(true);
      } else {
        setSubmitError(
          error.message ||
            "Unable to submit your registration. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`site-shell ${isNavigatingHome ? "is-navigating-out" : ""}`}
    >
      {/* Smooth Page Curtain Transition */}
      {isNavigatingHome && <div className="page-transition-curtain" />}

      {/* Minimal Top Bar with Home Button */}
      <div className="lucky-draw-top-bar">
        <a
          className="lucky-draw-home-btn"
          href="/"
          onClick={handleNavigateHome}
          aria-label="Return to BNB Home"
        >
          <span className="home-btn-icon" aria-hidden="true">
            ←
          </span>
          <span>Home</span>
        </a>
      </div>

      <section className="lucky-draw-registration-hero" id="lucky-draw">
        {/* Live Capsule Grid when showWheel is enabled from admin screen */}
        {showWheel && (
          <div
            className="lucky-draw-layout"
            style={{
              marginBottom: "36px",
              gridTemplateColumns: "minmax(0, 1fr)",
            }}
          >
            <div className="lucky-draw-wheel-panel">
              <div className="lucky-draw-reveal-panel">
                <span className="draw-reveal-kicker">Live Draw Entries</span>
                <strong className={isDrawing ? "is-drawing" : ""}>
                  {isDrawing
                    ? "And the winner is..."
                    : luckyDrawWinner
                      ? `Winner: ${luckyDrawWinner.name}`
                      : "Ready when you are"}
                </strong>
                <div
                  className="name-capsule-grid"
                  aria-label="Lucky draw customers"
                >
                  {luckyDrawEntries.map((entry, index) => {
                    const isWinner =
                      !isDrawing && luckyDrawWinner?.name === entry.name;
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
                          animationDelay: `${(index * 83) % 900}ms`,
                          animationDuration: `${1.2 + (index % 4) * 0.38}s`,
                        }}
                      >
                        {entry.name}
                      </span>
                    );
                  })}
                </div>
                <small>
                  {luckyDrawEntries.length} entries in this month&apos;s draw
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Floating Left-Edge Winner Widget when winner exists */}
        {luckyDrawWinner && (
          <div
            className="floating-winner-widget"
            onClick={() => setShowWinnerPopup(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowWinnerPopup(true);
            }}
            aria-label="View winner poster"
          >
            <div className="winner-widget-header">
              <span className="winner-widget-badge">👑 MONTHLY WINNER</span>
              <span className="widget-sparkle-icon">🎉</span>
            </div>

            <div className="winner-widget-body">
              <div className="winner-name-badge-wrapper">
                <span className="winner-name-glowing-pill">
                  {luckyDrawWinner.name}
                </span>
              </div>
              <button
                className="view-poster-glowing-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWinnerPopup(true);
                }}
                type="button"
              >
                <span className="poster-label-full">View Winner Poster</span>
                <span className="poster-label-compact">Poster</span>
                <span className="btn-sparkle">✨ ↗</span>
              </button>
            </div>
          </div>
        )}

        {/* Registration Form Wrapper */}
        {!showWheel && (
          <div className="lucky-draw-card-wrapper">
            <img
              className="registration-form-mascot"
              src="/lucky_draw_registration/lucky-draw-info.png"
              alt="For next month's winner"
            />
            <form
              className="registration-card-form"
              onSubmit={handleLuckyDrawSubmit}
            >
              {/* Full Name */}
              <div className="reg-field">
                <label htmlFor="lucky-draw-name">FULL NAME</label>
                <div className="reg-input-group">
                  <span className="reg-icon-badge badge-pink">
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="currentColor"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </span>
                  <input
                    id="lucky-draw-name"
                    type="text"
                    value={luckyDrawForm.name}
                    onChange={(event) =>
                      updateLuckyDrawField("name", event.target.value)
                    }
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="reg-field">
                <label htmlFor="lucky-draw-phone">WHATSAPP NUMBER</label>
                <div className="reg-input-group">
                  <span className="reg-icon-badge badge-green">
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="currentColor"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                  </span>
                  <input
                    id="lucky-draw-phone"
                    type="tel"
                    pattern="[0-9]{10}"
                    value={luckyDrawForm.phone}
                    onChange={(event) =>
                      updateLuckyDrawField("phone", event.target.value)
                    }
                    placeholder="10-digit WhatsApp number"
                    className={
                      isPhoneVerified ? "has-verified-badge" : "has-verify-btn"
                    }
                    required
                  />
                  {isPhoneVerified ? (
                    <span className="phone-verified-badge">✓ Verified</span>
                  ) : (
                    <button
                      type="button"
                      className="verify-num-btn"
                      onClick={handleSendOtp}
                    >
                      Verify Number
                    </button>
                  )}
                </div>
                {phoneError && <p className="field-error-text">{phoneError}</p>}
                {isVerifyingPhone && !isPhoneVerified && (
                  <div className="otp-verification-box">
                    <p className="otp-label">
                      Enter the test verification code 7374:
                    </p>
                    <div className="otp-input-row">
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredCode}
                        onChange={(e) =>
                          setEnteredCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="4-digit code"
                        className="otp-code-input"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="confirm-otp-btn"
                        onClick={handleVerifyOtp}
                      >
                        Confirm Code
                      </button>
                    </div>
                    {otpError && <p className="otp-error">{otpError}</p>}
                    <button
                      type="button"
                      className="resend-otp-btn"
                      onClick={handleSendOtp}
                    >
                      Use test code 7374
                    </button>
                  </div>
                )}
              </div>

              {/* Special Occasion */}
              <div className="reg-field">
                <label htmlFor="lucky-draw-occasion">SPECIAL OCCASION</label>
                <div className="reg-input-group">
                  <span className="reg-icon-badge badge-purple">
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="currentColor"
                    >
                      <path d="M20 6h-3.18c.09-.32.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.67C9.96 2.54 9.05 2 8 2 6.34 2 5 3.34 5 5c0 .35.09.68.18 1H2v4h20V6zm-9-1c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1h-1V5zM7 5c0-.55.45-1 1-1s1 .45 1 1v1H8c-.55 0-1-.45-1-1zM3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V11H3v9zm11-7h3v2h-3v-2z" />
                    </svg>
                  </span>
                  <select
                    id="lucky-draw-occasion"
                    value={luckyDrawForm.occasion}
                    onChange={(event) =>
                      updateLuckyDrawField("occasion", event.target.value)
                    }
                    required
                  >
                    {celebrationOccasions.map((occasion) => (
                      <option key={occasion} value={occasion}>
                        {occasion}
                      </option>
                    ))}
                  </select>
                  <span className="select-dropdown-arrow">▾</span>
                </div>
              </div>

              {/* Celebration Date */}
              <div className="reg-field">
                <label htmlFor="lucky-draw-date">CELEBRATION DATE</label>
                <div className="reg-input-group">
                  <span className="reg-icon-badge badge-indigo">
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="currentColor"
                    >
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" />
                    </svg>
                  </span>
                  <input
                    id="lucky-draw-date"
                    type="date"
                    value={luckyDrawForm.date}
                    onChange={(event) =>
                      updateLuckyDrawField("date", event.target.value)
                    }
                    placeholder="dd - mm - yyyy"
                    required
                  />
                </div>
              </div>

              {/* Expected Guests */}
              <div className="reg-field">
                <label htmlFor="lucky-draw-guests">EXPECTED GUESTS</label>
                <div className="reg-input-group">
                  <span className="reg-icon-badge badge-purple">
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="currentColor"
                    >
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                  </span>
                  <input
                    id="lucky-draw-guests"
                    type="number"
                    min="1"
                    value={luckyDrawForm.guests}
                    onChange={(event) =>
                      updateLuckyDrawField("guests", event.target.value)
                    }
                    placeholder="2"
                    required
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="reg-consent-group">
                <input
                  id="lucky-draw-consent"
                  type="checkbox"
                  checked={luckyDrawForm.consent}
                  onChange={(event) =>
                    updateLuckyDrawField("consent", event.target.checked)
                  }
                  required
                />
                <label htmlFor="lucky-draw-consent">
                  I AGREE TO RECEIVE BINGE AND BLISS CELEBRATION REMINDERS,
                  BOOKING INFORMATION AND PROMOTIONAL OFFERS ON WHATSAPP.
                </label>
              </div>

              {/* CTA Button */}
              <button
                className="reg-submit-btn"
                type="submit"
                disabled={!isFormValid || isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? "Registering..."
                    : "Register and Enter the Draw"}
                </span>
                <span className="btn-arrow">→</span>
              </button>
              {!isFormValid && (
                <p
                  className="form-hint"
                  style={{
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "11px",
                    marginTop: "-4px",
                    marginBottom: "0",
                  }}
                >
                  {!isPhoneVerified
                    ? "* Verify your WhatsApp number to enable registration"
                    : "* Please fill all required fields to proceed"}
                </p>
              )}

              {submitError && (
                <p
                  className="form-error"
                  role="alert"
                  style={{
                    textAlign: "center",
                    color: "#e11d48",
                    marginTop: "12px",
                  }}
                >
                  {submitError}
                </p>
              )}
            </form>
          </div>
        )}
      </section>
      <Footer standalone />

      {(submitSuccess || showDuplicatePhonePopup) && (
        <div
          className="modal-backdrop registration-success-backdrop"
          onClick={closeRegistrationResult}
          role="presentation"
        >
          <div
            className="modal-card registration-success-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-result-title"
          >
            <button
              className="modal-close registration-success-close"
              onClick={closeRegistrationResult}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
            <p className="eyebrow dark">
              {submitSuccess
                ? "Registration complete"
                : "Entry already registered"}
            </p>
            <h2 id="registration-result-title">
              {submitSuccess
                ? "You&apos;re registered."
                : "Phone number already registered."}
            </h2>
            <p>
              {submitSuccess
                ? "Your number has been verified. Good luck in the draw!"
                : "This phone number is already registered, and each number may enter once every 12 months. Please invite your family or friends to register with their own phone numbers so they can join the draw."}
            </p>
            <button
              className="dark-button registration-success-done"
              onClick={closeRegistrationResult}
              type="button"
            >
              {submitSuccess ? "Done" : "Close"} <span>↗</span>
            </button>
          </div>
        </div>
      )}

      {activeModal === "login" && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveModal(null)}
          role="presentation"
        >
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="modal-close"
              onClick={() => setActiveModal(null)}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
            <p className="eyebrow dark">Member access</p>
            <div className="login-role-toggle" aria-label="Login type">
              <button
                className={loginRole === "customer" ? "is-active" : ""}
                onClick={() => {
                  setLoginRole("customer");
                  setLoginError("");
                }}
                type="button"
              >
                Customer
              </button>
              <button
                className={loginRole === "admin" ? "is-active" : ""}
                onClick={() => {
                  setLoginRole("admin");
                  setLoginError("");
                }}
                type="button"
              >
                Admin
              </button>
            </div>
            <h2>
              {loginRole === "admin" ? "Admin access." : "Welcome back to BNB."}
            </h2>
            <p>
              {loginRole === "admin"
                ? "Sign in to access draw settings."
                : "Enter your registered WhatsApp number to view the live lucky draw wheel."}
            </p>
            <form className="modal-form" onSubmit={handleLoginSubmit}>
              {loginRole === "admin" ? (
                <>
                  <label htmlFor="draw-login-admin-email">Admin email</label>
                  <input
                    id="draw-login-admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    placeholder="admin@example.com"
                    required
                  />
                  <label htmlFor="draw-login-admin-password">Password</label>
                  <input
                    id="draw-login-admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    placeholder="Admin password"
                    required
                  />
                </>
              ) : (
                <>
                  <label htmlFor="draw-login-phone">WhatsApp number</label>
                  <input
                    id="draw-login-phone"
                    type="tel"
                    pattern="[0-9]{10}"
                    value={loginPhone}
                    onChange={(event) => setLoginPhone(event.target.value)}
                    placeholder="10-digit WhatsApp number"
                    required
                  />
                </>
              )}
              {loginError && <p className="form-error">{loginError}</p>}
              <button
                className="dark-button"
                disabled={isLoggingIn}
                type="submit"
              >
                {isLoggingIn ? "Signing in..." : "Continue"} <span>↗</span>
              </button>
            </form>
          </div>
        </div>
      )}

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
      {showWinnerPopup && luckyDrawWinner && (
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
            aria-labelledby="customer-winner-popup-title"
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
                <div className="overlay-ribbon-text">
                  {luckyDrawWinner.name}
                </div>

                {/* Slot 2: Celebration Date */}
                <div className="overlay-slot slot-date">
                  <span className="slot-label">Celebration Date</span>
                  <strong className="slot-value">
                    {luckyDrawWinner.date ||
                      luckyDrawWinner.dob ||
                      "Upcoming Celebration"}
                  </strong>
                </div>

                {/* Slot 3: Occasion */}
                <div className="overlay-slot slot-occasion">
                  <span className="slot-label">Occasion</span>
                  <strong className="slot-value">
                    {luckyDrawWinner.occasion || "Special Celebration"}
                  </strong>
                </div>

                {/* Slot 4: Phone Number */}
                <div className="overlay-slot slot-phone">
                  <span className="slot-label">
                    Phone Number (Last 4 Digits)
                  </span>
                  <strong className="slot-value">
                    {formatLast4Phone(luckyDrawWinner.phone)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Button at bottom */}
            <div className="template-card-footer-actions">
              <button
                className="winner-claim-btn"
                onClick={() => setShowWinnerPopup(false)}
                type="button"
              >
                Claim Your Surprise <span>✨</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default LuckyDraw;
