import { useEffect, useRef, useState } from "react";
import { useScrollLoadedCount } from "../hooks/useScrollLoadedCount";
import Footer from "../components/Footer";
import { testAdminCredentials } from "../testCredentials";
import {
  adminLogin,
  createLuckyDrawEntry,
  getLuckyDrawLatestWinner,
  getLuckyDrawStatus,
  lookupCustomerRegistration,
  verifyCustomerLogin,
} from "../services/api";
import "../App.css";
import "./LuckyDraw.css";

const WINNER_CACHE_KEY = "bnb-lucky-draw-latest-winner";
const DRAW_DATE_CACHE_KEY = "bnb-lucky-draw-draw-date";

function getCachedWinner() {
  try {
    const cached = window.localStorage.getItem(WINNER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function getCachedDrawDate() {
  try {
    return window.localStorage.getItem(DRAW_DATE_CACHE_KEY) || "";
  } catch {
    return "";
  }
}

function saveWinnerToCache(winnerEntry, date) {
  try {
    if (winnerEntry) {
      window.localStorage.setItem(WINNER_CACHE_KEY, JSON.stringify(winnerEntry));
    }
    if (date) {
      window.localStorage.setItem(DRAW_DATE_CACHE_KEY, String(date));
    }
  } catch {
    // Ignore storage errors
  }
}

function formatLuckyDrawWinner(rawWinner) {
  if (!rawWinner) return null;
  const name = rawWinner.Name || rawWinner.name;
  if (!name) return null;
  return {
    id: `${name}-${rawWinner.Phone || rawWinner.phone || ""}`,
    name,
    phone: rawWinner.Phone || rawWinner.phone || "",
    date:
      rawWinner.date ||
      rawWinner.dob ||
      rawWinner["Date of birth"] ||
      rawWinner["Celebration date"] ||
      "",
    occasion:
      rawWinner.occasion ||
      rawWinner.Occasion ||
      "Special Celebration",
  };
}

function formatLast4Phone(phone) {
  const clean = (phone || "").replace(/\D/g, "");
  if (clean.length >= 4) {
    return `•••• ${clean.slice(-4)}`;
  }
  return "•••• 1234";
}

function getMinimumCelebrationDate() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
  const tomorrow = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrow.getUTCDate()).padStart(2, "0")}`;
}

function isFutureCelebrationDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day &&
    date >= getMinimumCelebrationDate()
  );
}

function formatCustomerDate(date) {
  if (!date) return "Not provided";
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, 12));
  return Number.isFinite(value.getTime())
    ? value.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
    : "Not provided";
}

function formatDrawMonth(drawDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(drawDate || "")) return "";
  const [year, month, day] = drawDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}

function formatRegistrationDateTime(dateTime) {
  const value = new Date(dateTime);
  return Number.isFinite(value.getTime())
    ? value.toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    })
    : "Not available";
}

function normalizeCustomerPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
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
  const [customerLoginStep, setCustomerLoginStep] = useState("phone");
  const [customerLoginOtp, setCustomerLoginOtp] = useState("");
  const [customerNeedsRegistration, setCustomerNeedsRegistration] =
    useState(false);
  const [loginRole, setLoginRole] = useState("customer");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [luckyDrawEntries, setLuckyDrawEntries] = useState([]);
  const [drawDate, setDrawDate] = useState(() => getCachedDrawDate());
  const [celebrationOccasions, setCelebrationOccasions] = useState([]);
  const [luckyDrawForm, setLuckyDrawForm] = useState({
    name: "",
    phone: "",
    occasion: "",
    date: "",
    guests: "2",
    consent: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showDuplicatePhonePopup, setShowDuplicatePhonePopup] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [drawStatusError, setDrawStatusError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWheelOverlay, setShowWheelOverlay] = useState(false);
  const [luckyDrawWinner, setLuckyDrawWinner] = useState(() => getCachedWinner());
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const phoneInputRef = useRef(null);
  const shouldFocusDuplicatePhoneRef = useRef(false);
  const lastSpinIdRef = useRef(null);
  const completedWinnerSpinIdRef = useRef(null);
  const isAnimatingSpinRef = useRef(false);
  const hasLoadedStatus = useRef(false);
  const statusRequestInFlightRef = useRef(false);
  const entryListRef = useRef(null);
  const {
    visibleCount: visibleEntryCount,
    sentinelRef: entryListSentinelRef,
    hasMore: hasMoreEntries,
  } = useScrollLoadedCount(luckyDrawEntries.length, {
    pageSize: 24,
    rootRef: entryListRef,
  });

  useEffect(() => {
    if (!showDuplicatePhonePopup && shouldFocusDuplicatePhoneRef.current) {
      phoneInputRef.current?.focus();
      shouldFocusDuplicatePhoneRef.current = false;
    }
  }, [showDuplicatePhonePopup]);

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

  const isNamesBlinking = isDrawing;
  const drawMonthLabel = formatDrawMonth(drawDate);

  useEffect(() => {
    let isMounted = true;

    // Fast-path: Instantly fetch the latest winner from dedicated endpoint
    getLuckyDrawLatestWinner()
      .then((latest) => {
        if (!isMounted) return;
        const winnerObj = latest?.winner;
        const winnerName = latest?.lastWinnerName;
        if (winnerObj) {
          const formatted = formatLuckyDrawWinner(winnerObj);
          if (formatted) {
            setLuckyDrawWinner(formatted);
            saveWinnerToCache(formatted);
          }
        } else if (winnerName) {
          setLuckyDrawWinner((current) => {
            if (current?.name === winnerName) return current;
            const fallback = {
              id: winnerName,
              name: winnerName,
              phone: "",
              date: "",
              occasion: "Special Celebration",
            };
            saveWinnerToCache(fallback);
            return fallback;
          });
        }
      })
      .catch(() => {});

    const syncStatus = async () => {
      if (statusRequestInFlightRef.current) return;
      statusRequestInFlightRef.current = true;

      try {
        const status = await getLuckyDrawStatus();
        if (!isMounted) return;

        setDrawStatusError("");
        if (status.drawDate) {
          setDrawDate(status.drawDate);
        }
        const configuredOccasions = Array.isArray(status.celebrationOccasions)
          ? status.celebrationOccasions
          : [];
        setCelebrationOccasions((current) =>
          current.length === configuredOccasions.length &&
            current.every((occasion, index) => occasion === configuredOccasions[index])
            ? current
            : configuredOccasions,
        );
        setLuckyDrawForm((current) => {
          if (configuredOccasions.includes(current.occasion)) return current;
          return {
            ...current,
            occasion: configuredOccasions[0] || "",
          };
        });
        const currentSpinId = status.lastSpin?.id || null;
        if (!isAnimatingSpinRef.current) {
          setShowWheel(Boolean(status.wheelEnabled || status.showWheel));
        }
        setLuckyDrawEntries((currentEntries) => {
          const nextEntries = status.entries;
          const hasSameEntries =
            currentEntries.length === nextEntries.length &&
            currentEntries.every(
              (entry, index) =>
                entry.id === nextEntries[index]?.id &&
                entry.name === nextEntries[index]?.name,
            );
          return hasSameEntries ? currentEntries : nextEntries;
        });

        if (!hasLoadedStatus.current) {
          hasLoadedStatus.current = true;
          lastSpinIdRef.current = currentSpinId;
          if (status.lastSpin) {
            completedWinnerSpinIdRef.current = currentSpinId;
            const winnerEntry = formatLuckyDrawWinner(status.lastSpin.winner);
            if (winnerEntry) {
              setLuckyDrawWinner(winnerEntry);
              saveWinnerToCache(winnerEntry, status.drawDate);
            }
          }
          if (status.isDrawing && !isAnimatingSpinRef.current) {
            isAnimatingSpinRef.current = true;
            setIsDrawing(true);
            setShowWheel(true);
            setShowWheelOverlay(true);
            window.setTimeout(() => {
              if (isMounted) {
                setIsDrawing(false);
                setShowWheelOverlay(false);
                setShowWheel(false);
                setShowWinnerPopup(true);
                isAnimatingSpinRef.current = false;
              }
            }, 7000);
          }
          return;
        }

        // Live draw animation triggered when admin spins or a new spin is detected
        const isSpinActive = Boolean(
          status.isDrawing ||
          (currentSpinId && currentSpinId !== lastSpinIdRef.current)
        );

        if (isSpinActive && !isAnimatingSpinRef.current) {
          isAnimatingSpinRef.current = true;
          lastSpinIdRef.current = currentSpinId;
          const winnerObj = status.drawingWinner || status.lastSpin?.winner;
          const winnerEntry = formatLuckyDrawWinner(winnerObj);
          if (winnerEntry) {
            completedWinnerSpinIdRef.current = currentSpinId;
            setLuckyDrawWinner(winnerEntry);
            saveWinnerToCache(winnerEntry, status.drawDate);
          }

          setIsDrawing(true);
          setShowWheel(true);
          setShowWheelOverlay(false);
          setShowWinnerPopup(false);

          // Phase 1: Name capsules blinking (2.5s)
          window.setTimeout(() => {
            if (isMounted) {
              setShowWheelOverlay(true);
            }
          }, 2500);

          // Phase 2: Wheel spinning completes, reveal winner popup and switch back to registration (9s)
          window.setTimeout(() => {
            if (isMounted) {
              setIsDrawing(false);
              setShowWheelOverlay(false);
              setShowWheel(false);
              setShowWinnerPopup(true);
              isAnimatingSpinRef.current = false;
            }
          }, 9000);
        }
      } catch (error) {
        if (isMounted) {
          setDrawStatusError(error.message || "Unable to load lucky draw status.");
        }
      } finally {
        statusRequestInFlightRef.current = false;
      }
    };

    syncStatus();
    const intervalId = window.setInterval(() => {
      if (isMounted && document.visibilityState === "visible") {
        void syncStatus();
      }
    }, 1500);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void syncStatus();
      }
    };
    window.addEventListener("focus", syncStatus);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncStatus);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const openLogin = () => {
    setActiveModal("login");
    setLoginRole("customer");
    setCustomerLoginStep("phone");
    setLoginPhone("");
    setCustomerLoginOtp("");
    setCustomerNeedsRegistration(false);
    setLoginError("");
  };

  const handleOpenProfile = async () => {
    if (!user?.phone) {
      openLogin();
      return;
    }

    if (!user.customerVerified || !user.profile) {
      openLogin();
      return;
    }

    setIsProfileOpen(true);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("bnb-user");
    setUser(null);
    setIsProfileOpen(false);
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
        window.location.href = "/admin";
        return;
      }

      const normalizedPhone = normalizeCustomerPhone(loginPhone);
      if (!validatePhoneNumber(normalizedPhone)) {
        throw new Error(
          "Please enter a valid 10-digit Indian WhatsApp number.",
        );
      }

      if (customerLoginStep === "phone") {
        const lookup = await lookupCustomerRegistration(normalizedPhone);
        if (!lookup.registered) {
          setCustomerNeedsRegistration(true);
          setLoginError(
            "This number is not registered yet. Register to join the lucky draw.",
          );
          return;
        }
        if (!import.meta.env.DEV) {
          setLoginError(
            "This number is registered, but secure OTP sign-in is not enabled in production yet.",
          );
          return;
        }
        setCustomerNeedsRegistration(false);
        setCustomerLoginStep("otp");
        return;
      }

      const result = await verifyCustomerLogin(
        normalizedPhone,
        customerLoginOtp,
      );
      if (!result.profile) {
        throw new Error(
          "Registration details are unavailable. Please try again later.",
        );
      }
      const customerUser = {
        ...result.user,
        profile: result.profile,
        customerVerified: true,
      };
      setUser(customerUser);
      window.localStorage.setItem("bnb-user", JSON.stringify(customerUser));
      setActiveModal(null);
      setIsProfileOpen(true);
    } catch (error) {
      if (error.message.includes("not registered")) {
        setCustomerNeedsRegistration(true);
      }
      setLoginError(error.message || "Unable to sign in");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const updateLuckyDrawField = (field, value) => {
    setLuckyDrawForm((currentForm) => ({ ...currentForm, [field]: value }));
    setSubmitError("");
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
    if (showDuplicatePhonePopup) {
      shouldFocusDuplicatePhoneRef.current = true;
      setShowDuplicatePhonePopup(false);
      setHasAttemptedSubmit(true);
      setPhoneError(
        "This phone number is already registered. Please use a different number.",
      );
      return;
    }

    setLuckyDrawForm({
      name: "",
      phone: "",
      occasion: celebrationOccasions[0] || "",
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
    isFutureCelebrationDate(luckyDrawForm.date) &&
    luckyDrawForm.guests &&
    Number(luckyDrawForm.guests) > 0 &&
    luckyDrawForm.consent,
  );
  const validationErrors = {
    name: luckyDrawForm.name.trim() ? "" : "Please enter your full name.",
    phone: !validatePhoneNumber(cleanPhone)
      ? "Please enter a valid 10-digit Indian WhatsApp number."
      : !isPhoneVerified
        ? "Please verify your WhatsApp number."
        : "",
    occasion: luckyDrawForm.occasion ? "" : "Please select an occasion.",
    date: !luckyDrawForm.date
      ? "Please select a celebration date."
      : isFutureCelebrationDate(luckyDrawForm.date)
        ? ""
        : "Celebration date must be in the future.",
    guests:
      Number(luckyDrawForm.guests) > 0
        ? ""
        : "Please enter at least 1 expected guest.",
    consent: luckyDrawForm.consent
      ? ""
      : "Please agree to the WhatsApp reminders and offers.",
  };

  const handleLuckyDrawSubmit = async (event) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    if (!isFormValid) {
      setSubmitError("Please review the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setHasAttemptedSubmit(false);
    setSubmitSuccess(false);

    try {
      const payload = {
        ...luckyDrawForm,
        phone: cleanPhone,
      };
      const result = await createLuckyDrawEntry(payload);

      const loggedUser = {
        ...(result.user || {
          name: luckyDrawForm.name.trim(),
          phone: cleanPhone,
        }),
        profile: result.profile,
      };
      setUser(loggedUser);
      window.localStorage.setItem("bnb-user", JSON.stringify(loggedUser));

      setSubmitSuccess(true);
      try {
        const status = await getLuckyDrawStatus();
        setLuckyDrawEntries(status.entries);
      } catch (error) {
        setDrawStatusError(error.message || "Unable to refresh draw entries.");
      }
    } catch (error) {
      if (/already registered/i.test(error.message || "")) {
        setPhoneError(
          "This phone number is already registered. Please use a different number.",
        );
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
        {!user?.isAdmin && (
          <button
            className="lucky-draw-profile-btn"
            onClick={handleOpenProfile}
            type="button"
          >
            {user?.phone ? "My profile" : "Sign in"}
          </button>
        )}
      </div>

      <section className="lucky-draw-registration-hero" id="lucky-draw">
        {drawStatusError && (
          <p className="form-error" role="alert">
            {drawStatusError}
          </p>
        )}
        {/* Show live draw entries when wheel is active. */}
        {(showWheel || isDrawing) && (
          <div
            className="lucky-draw-layout"
            style={{
              marginBottom: "36px",
              gridTemplateColumns: "minmax(0, 1fr)",
            }}
          >
            <div className="lucky-draw-wheel-panel">
              <div className="lucky-draw-reveal-panel">
                <span className="draw-reveal-kicker">
                  Live Draw Entries
                  {drawMonthLabel ? ` · ${drawMonthLabel}` : ""}
                </span>
                <strong className={isNamesBlinking ? "is-drawing" : ""}>
                  {isNamesBlinking
                    ? "And the winner is..."
                    : luckyDrawWinner
                      ? `Winner: ${luckyDrawWinner.name}`
                      : "Ready when you are"}
                </strong>
                <div
                  className="name-capsule-grid"
                  aria-label="Lucky draw customers"
                  ref={entryListRef}
                >
                  {luckyDrawEntries.slice(0, visibleEntryCount).map((entry, index) => {
                    const isWinner =
                      !isNamesBlinking &&
                      luckyDrawWinner?.name === entry.name;
                    return (
                      <span
                        className={[
                          "name-capsule",
                          isWinner ? "is-winner" : "",
                          isNamesBlinking ? "is-blinking" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={entry.id}
                        style={{ animationDelay: `${(index * 83) % 900}ms` }}
                      >
                        {entry.name}
                      </span>
                    );
                  })}
                  {hasMoreEntries && (
                    <span
                      aria-hidden="true"
                      className="scroll-load-sentinel"
                      ref={entryListSentinelRef}
                    />
                  )}
                </div>
                <small>
                  Showing {Math.min(visibleEntryCount, luckyDrawEntries.length)} of{" "}
                  {luckyDrawEntries.length} entries in this month&apos;s draw
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Floating Left-Edge Winner Widget when winner exists */}
        {Boolean(luckyDrawWinner) && (
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
                <span className="winner-widget-badge">
                  👑 MONTHLY WINNER{drawMonthLabel ? ` · ${drawMonthLabel}` : ""}
                </span>
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
        {!showWheel && !isDrawing && (
          <div className="lucky-draw-card-wrapper">
            <img
              className="registration-form-mascot"
              src="/lucky_draw_registration/lucky-draw-info.png"
              alt="For next month's winner"
            />
            <form
              className="registration-card-form"
              onSubmit={handleLuckyDrawSubmit}
              noValidate
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
                    aria-invalid={
                      hasAttemptedSubmit && Boolean(validationErrors.name)
                    }
                    aria-describedby={
                      hasAttemptedSubmit && validationErrors.name
                        ? "lucky-draw-name-error"
                        : undefined
                    }
                    className={
                      hasAttemptedSubmit && validationErrors.name
                        ? "is-invalid"
                        : ""
                    }
                    onChange={(event) =>
                      updateLuckyDrawField("name", event.target.value)
                    }
                    placeholder="Your full name"
                    required
                  />
                </div>
                {hasAttemptedSubmit && validationErrors.name && (
                  <p className="field-error-text" id="lucky-draw-name-error">
                    {validationErrors.name}
                  </p>
                )}
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
                    ref={phoneInputRef}
                    type="tel"
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    maxLength={10}
                    value={luckyDrawForm.phone}
                    aria-invalid={
                      Boolean(phoneError) ||
                      (hasAttemptedSubmit && Boolean(validationErrors.phone))
                    }
                    aria-describedby={
                      phoneError || (hasAttemptedSubmit && validationErrors.phone)
                        ? "lucky-draw-phone-error"
                        : undefined
                    }
                    onChange={(event) =>
                      updateLuckyDrawField(
                        "phone",
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="10-digit WhatsApp number"
                    className={[
                      isPhoneVerified
                        ? "has-verified-badge"
                        : "has-verify-btn",
                      hasAttemptedSubmit && validationErrors.phone
                        || phoneError
                        ? "is-invalid"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    required
                  />
                  {isPhoneVerified ? (
                    <span className="phone-verified-badge">✓ Verified</span>
                  ) : (
                    <button
                      type="button"
                      className={`verify-num-btn${luckyDrawForm.phone.length === 10 ? " is-ready" : ""}`}
                      onClick={handleSendOtp}
                    >
                      <span className="verify-button-desktop-label">
                        Verify Number
                      </span>
                      <span className="verify-button-mobile-label">Verify</span>
                    </button>
                  )}
                </div>
                {(phoneError ||
                  (hasAttemptedSubmit && validationErrors.phone)) && (
                    <p
                      className="field-error-text"
                      id="lucky-draw-phone-error"
                    >
                      {phoneError || validationErrors.phone}
                    </p>
                  )}
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
                    disabled={!celebrationOccasions.length}
                    aria-invalid={
                      hasAttemptedSubmit && Boolean(validationErrors.occasion)
                    }
                    aria-describedby={
                      hasAttemptedSubmit && validationErrors.occasion
                        ? "lucky-draw-occasion-error"
                        : undefined
                    }
                    className={
                      hasAttemptedSubmit && validationErrors.occasion
                        ? "is-invalid"
                        : ""
                    }
                    onChange={(event) =>
                      updateLuckyDrawField("occasion", event.target.value)
                    }
                    required
                  >
                    {!celebrationOccasions.length && (
                      <option value="">Loading occasions...</option>
                    )}
                    {celebrationOccasions.map((occasion) => (
                      <option key={occasion} value={occasion}>
                        {occasion}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="select-dropdown-arrow"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                {hasAttemptedSubmit && validationErrors.occasion && (
                  <p
                    className="field-error-text"
                    id="lucky-draw-occasion-error"
                  >
                    {validationErrors.occasion}
                  </p>
                )}
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
                    min={getMinimumCelebrationDate()}
                    value={luckyDrawForm.date}
                    aria-invalid={
                      hasAttemptedSubmit && Boolean(validationErrors.date)
                    }
                    aria-describedby={
                      hasAttemptedSubmit && validationErrors.date
                        ? "lucky-draw-date-error"
                        : undefined
                    }
                    className={
                      hasAttemptedSubmit && validationErrors.date
                        ? "is-invalid"
                        : ""
                    }
                    onChange={(event) =>
                      updateLuckyDrawField("date", event.target.value)
                    }
                    placeholder="dd - mm - yyyy"
                    required
                  />
                </div>
                {hasAttemptedSubmit && validationErrors.date && (
                  <p className="field-error-text" id="lucky-draw-date-error">
                    {validationErrors.date}
                  </p>
                )}
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
                    aria-invalid={
                      hasAttemptedSubmit && Boolean(validationErrors.guests)
                    }
                    aria-describedby={
                      hasAttemptedSubmit && validationErrors.guests
                        ? "lucky-draw-guests-error"
                        : undefined
                    }
                    className={
                      hasAttemptedSubmit && validationErrors.guests
                        ? "is-invalid"
                        : ""
                    }
                    onChange={(event) =>
                      updateLuckyDrawField("guests", event.target.value)
                    }
                    placeholder="2"
                    required
                  />
                </div>
                {hasAttemptedSubmit && validationErrors.guests && (
                  <p
                    className="field-error-text"
                    id="lucky-draw-guests-error"
                  >
                    {validationErrors.guests}
                  </p>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="reg-consent-group">
                <input
                  id="lucky-draw-consent"
                  type="checkbox"
                  checked={luckyDrawForm.consent}
                  className={
                    hasAttemptedSubmit && validationErrors.consent
                      ? "is-invalid"
                      : ""
                  }
                  aria-invalid={
                    hasAttemptedSubmit && Boolean(validationErrors.consent)
                  }
                  aria-describedby={
                    hasAttemptedSubmit && validationErrors.consent
                      ? "lucky-draw-consent-error"
                      : undefined
                  }
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
              {hasAttemptedSubmit && validationErrors.consent && (
                <p
                  className="field-error-text consent-error"
                  id="lucky-draw-consent-error"
                >
                  {validationErrors.consent}
                </p>
              )}

              {/* CTA Button */}
              <button
                className="reg-submit-btn"
                type="submit"
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? "Registering..."
                    : "Register and Enter the Draw"}
                </span>
                <span className="btn-arrow">→</span>
              </button>
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
                ? "You're registered."
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
            className="modal-card login-modal-card"
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
            <div className="login-modal-brand">
              <span aria-hidden="true">B</span>
              <div>
                <p className="eyebrow dark">Binge &amp; Bliss</p>
                <small>MEMBER ACCESS</small>
              </div>
            </div>
            <div className="login-role-toggle" aria-label="Login type">
              <button
                className={loginRole === "customer" ? "is-active" : ""}
                aria-pressed={loginRole === "customer"}
                onClick={() => {
                  setLoginRole("customer");
                  setCustomerLoginStep("phone");
                  setLoginPhone("");
                  setCustomerLoginOtp("");
                  setCustomerNeedsRegistration(false);
                  setLoginError("");
                }}
                type="button"
              >
                Customer
              </button>
              <button
                className={loginRole === "admin" ? "is-active" : ""}
                aria-pressed={loginRole === "admin"}
                onClick={() => {
                  setLoginRole("admin");
                  setCustomerLoginStep("phone");
                  setCustomerLoginOtp("");
                  setLoginError("");
                }}
                type="button"
              >
                Admin
              </button>
            </div>
            <h2>
              {loginRole === "admin"
                ? "Admin access."
                : customerLoginStep === "otp"
                  ? "Verify your number."
                  : "View your registration."}
            </h2>
            <p>
              {loginRole === "admin"
                ? "Sign in to access draw settings."
                : customerLoginStep === "otp"
                  ? `Enter the verification code for ${normalizeCustomerPhone(loginPhone)}.`
                  : "Enter the WhatsApp number you used to register."}
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
                  <button
                    className="login-test-prefill"
                    onClick={() => {
                      if (import.meta.env.DEV) {
                        setAdminEmail(testAdminCredentials.email);
                        setAdminPassword(testAdminCredentials.password);
                      } else {
                        setAdminEmail("admin@bingenbliss.com");
                      }
                      setLoginError("");
                    }}
                    type="button"
                  >
                    {import.meta.env.DEV
                      ? "Fill development admin"
                      : "Prefill admin email"}
                  </button>
                  <p className="login-test-hint">
                    {import.meta.env.DEV
                      ? "Works only with the local development backend."
                      : "Enter your admin password to sign in."}
                  </p>
                </>
              ) : (
                <>
                  {customerLoginStep === "phone" ? (
                    <>
                      <label htmlFor="draw-login-phone">WhatsApp number</label>
                      <input
                        id="draw-login-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={loginPhone}
                        onChange={(event) => {
                          setLoginPhone(
                            event.target.value.replace(/\D/g, "").slice(-12),
                          );
                          setCustomerNeedsRegistration(false);
                          setLoginError("");
                        }}
                        placeholder="10-digit WhatsApp number"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="draw-login-otp">
                        Verification code
                      </label>
                      <input
                        id="draw-login-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={4}
                        value={customerLoginOtp}
                        onChange={(event) =>
                          setCustomerLoginOtp(
                            event.target.value.replace(/\D/g, "").slice(0, 4),
                          )
                        }
                        placeholder="4-digit code"
                        required
                      />
                      <button
                        className="login-test-prefill"
                        onClick={() => {
                          setCustomerLoginStep("phone");
                          setCustomerLoginOtp("");
                          setLoginError("");
                        }}
                        type="button"
                      >
                        Change phone number
                      </button>
                      {import.meta.env.DEV && (
                        <p className="login-test-hint">
                          Development test code: 7374. No real message is sent.
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
              {loginError && <p className="form-error">{loginError}</p>}
              {customerNeedsRegistration && loginRole === "customer" && (
                <a
                  className="login-register-link"
                  href="/lucky-draw#lucky-draw"
                  onClick={() => setActiveModal(null)}
                >
                  Register for the lucky draw <span aria-hidden="true">↗</span>
                </a>
              )}
              <button
                className="dark-button"
                disabled={isLoggingIn}
                type="submit"
              >
                {isLoggingIn
                  ? "Please wait..."
                  : loginRole === "admin"
                    ? "Continue"
                    : customerLoginStep === "phone"
                      ? "Continue"
                      : "Verify code"}{" "}
                <span>↗</span>
              </button>
            </form>
            <p className="login-privacy-note">
              <span aria-hidden="true">✦</span>
              Use your registered number to view its saved entry details.
            </p>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div
          className="modal-backdrop customer-profile-backdrop"
          onClick={() => setIsProfileOpen(false)}
          role="presentation"
        >
          <section
            className="modal-card customer-profile-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-profile-title"
          >
            <button
              className="modal-close"
              onClick={() => setIsProfileOpen(false)}
              type="button"
              aria-label="Close profile"
            >
              ×
            </button>
            <p className="eyebrow dark">Customer account</p>
            <h2 id="customer-profile-title">Your registration</h2>
            <p className="customer-profile-intro">
              Review the details saved with your lucky draw entry.
            </p>
            <dl className="customer-profile-grid">
              <div>
                <dt>Full name</dt>
                <dd>{user?.profile?.name || "Not provided"}</dd>
              </div>
              <div>
                <dt>WhatsApp number</dt>
                <dd>{user?.profile?.phone || "Not provided"}</dd>
              </div>
              <div>
                <dt>Special occasion</dt>
                <dd>{user?.profile?.occasion || "Not provided"}</dd>
              </div>
              <div>
                <dt>Celebration date</dt>
                <dd>
                  {formatCustomerDate(user?.profile?.celebrationDate)}
                </dd>
              </div>
              <div>
                <dt>Expected guests</dt>
                <dd>{user?.profile?.guests || "Not provided"}</dd>
              </div>
              <div>
                <dt>Registered on</dt>
                <dd>
                  {formatRegistrationDateTime(user?.profile?.registeredAt)}
                  {user?.profile?.registeredAt && " IST"}
                </dd>
              </div>
            </dl>
            <div className="customer-profile-actions">
              <button
                className="dark-button"
                onClick={handleLogout}
                type="button"
              >
                Sign out
              </button>
              <button
                className="customer-profile-close"
                onClick={() => setIsProfileOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </section>
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
              <p>Selecting this month's lucky draw winner!</p>
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
                <svg
                  className="overlay-ribbon-text"
                  viewBox="0 0 100 32"
                  role="img"
                  aria-label={`Winner: ${luckyDrawWinner.name}`}
                >
                  <defs>
                    <path
                      id="customer-winner-name-curve"
                      d="M 8 27 Q 50 5 92 27"
                    />
                  </defs>
                  <text>
                    <textPath
                      href="#customer-winner-name-curve"
                      xlinkHref="#customer-winner-name-curve"
                      startOffset="50%"
                      textAnchor="middle"
                      textLength="82"
                      lengthAdjust="spacingAndGlyphs"
                    >
                      {luckyDrawWinner.name}
                    </textPath>
                  </text>
                </svg>

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

          </div>
        </div>
      )}
    </main>
  );
}

export default LuckyDraw;
