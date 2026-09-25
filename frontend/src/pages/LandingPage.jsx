import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../App.css";
import heroPhoto from "/landing_page/heroIMG.jpg";

const birthdayImage = "/landing_page/birthdayIMG.jpg";
const theaterImage = "/landing_page/miniTheater.jpg";
const photographyImage = "/landing_page/photoGraphy.jpg";

const celebrationEvents = [
  "Birthday parties",
  "Anniversary days",
  "Kitty parties",
  "Private theatre",
  "Mini theatre",
  "Photography",
];

function LandingPage() {
  const [celebrationIndex, setCelebrationIndex] = useState(0);
  const [user, setUser] = useState(() => {
    const savedUser = window.localStorage.getItem("bnb-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeModal, setActiveModal] = useState(null);
  const [email, setEmail] = useState("");
  const [orderAmount, setOrderAmount] = useState("2500");
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    name: "",
    phone: "",
    event: "Birthday parties",
    date: "",
    guests: "2",
  });
  const [confirmation, setConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const discount = isCouponApplied ? Number(orderAmount || 0) * 0.1 : 0;
  const total = Math.max(Number(orderAmount || 0) - discount, 0);

  const openLogin = (returnToBooking = false) => {
    setPendingBooking(returnToBooking);
    setActiveModal("login");
    setCouponMessage("");
    setFormError("");
  };

  const openBooking = () => {
    if (!user) {
      openLogin(true);
      return;
    }
    setActiveModal("order");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setUser(result.user);
      window.localStorage.setItem("bnb-user", JSON.stringify(result.user));
      setCoupon(result.user.coupon);
      setActiveModal(pendingBooking ? "order" : null);
      setPendingBooking(false);
    } catch (error) {
      setFormError(error.message || "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("bnb-user");
    setUser(null);
    setIsCouponApplied(false);
    setCoupon("");
    setActiveModal(null);
  };

  const handleCoupon = async (event) => {
    event.preventDefault();
    if (!user) {
      setActiveModal("login");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          code: coupon,
          amount: Number(orderAmount),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setIsCouponApplied(true);
      setCouponMessage(
        `10% discount applied (₹${result.discount.toLocaleString("en-IN")})`,
      );
    } catch (error) {
      setIsCouponApplied(false);
      setCouponMessage(
        error.message || "That coupon is not valid for this account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBookingDetail = (field, value) => {
    setBookingDetails((currentDetails) => ({
      ...currentDetails,
      [field]: value,
    }));
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingDetails,
          amount: Number(orderAmount || 0),
          coupon: isCouponApplied ? coupon.trim().toUpperCase() : null,
          email: user.email,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setUser(result.user);
      window.localStorage.setItem("bnb-user", JSON.stringify(result.user));
      window.localStorage.setItem(
        "bnb-last-order",
        JSON.stringify(result.order),
      );
      setConfirmation(result.order);
      setActiveModal("confirmation");
    } catch (error) {
      setFormError(error.message || "Unable to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const featureRows = document.querySelectorAll(".feature-row");
    if (!("IntersectionObserver" in window)) {
      featureRows.forEach((row) => row.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { rootMargin: "-8% 0px -8% 0px", threshold: [0, 0.15] },
    );

    featureRows.forEach((row) => observer.observe(row));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const phraseTimer = window.setInterval(() => {
      setCelebrationIndex(
        (currentIndex) => (currentIndex + 1) % celebrationEvents.length,
      );
    }, 5600);

    return () => window.clearInterval(phraseTimer);
  }, []);

  return (
    <main
      className="site-shell"
      style={{ "--hero-photo": `url(${heroPhoto})` }}
    >
      <Navbar user={user} onLogin={openLogin} onLogout={handleLogout} />

      <section className="hero-section" id="top">
        <div className="snow-drizzle" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="floating-balloons" aria-hidden="true">
          <span className="floating-balloon balloon-pink"></span>
          <span className="floating-balloon balloon-chrome"></span>
          <span className="floating-balloon balloon-lilac"></span>
          <span className="floating-balloon balloon-copper"></span>
          <span className="floating-balloon balloon-silver"></span>
          <span className="floating-balloon balloon-rose"></span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot"></span>Make the moment yours
          </p>
          <h1>
            Let&apos;s Celebrate
            <span className="celebration-window" aria-live="off">
              <span
                className="celebration-typing"
                key={celebrationEvents[celebrationIndex]}
              >
                <span className="celebration-event">
                  {celebrationEvents[celebrationIndex]}
                </span>
                <span className="typing-cursor" aria-hidden="true"></span>
              </span>
            </span>
          </h1>
          <p className="hero-description">
            Beautiful spaces, thoughtful details, and a little more magic for
            every kind of gathering.
          </p>
          <button
            className="booking-button"
            onClick={openBooking}
            type="button"
          >
            Book your celebration <span>↗</span>
          </button>
        </div>
      </section>

      <section className="know-more-section" id="events">
        <div className="know-more-heading">
          <p className="eyebrow dark">Know more</p>
          <h2>
            Celebrate the moments
            <br />
            <em>that matter most.</em>
          </h2>
        </div>
        <div className="feature-row feature-row-text-first">
          <div className="feature-copy">
            <p className="eyebrow dark">Big-screen memories</p>
            <h3>
              Celebrate your precious moments with our unique big screens along
              with your loved ones.
            </h3>
            <p>
              Settle into a private theatre made for birthdays, anniversaries,
              and every gathering that deserves a little more wonder. Your
              people, your movie, your moment.
            </p>
          </div>
          <div className="feature-image-wrap">
            <img
              src={birthdayImage}
              alt="Birthday celebration in a private theatre"
            />
          </div>
        </div>
        <div className="feature-row feature-row-image-first">
          <div className="feature-image-wrap">
            <img
              src={theaterImage}
              alt="Private theatre with comfortable cinema seating"
            />
          </div>
          <div className="feature-copy">
            <p className="eyebrow dark">Your private screen</p>
            <h3>
              More than a venue. A beautiful setting for the people you love.
            </h3>
            <p>
              From warm lighting to immersive sound, every detail is shaped
              around a relaxed, memorable experience that feels completely
              yours.
            </p>
          </div>
        </div>
        <div className="feature-row feature-row-text-first">
          <div className="feature-copy">
            <p className="eyebrow dark">Keep the memory</p>
            <h3>Turn every celebration into a story worth looking back on.</h3>
            <p>
              Bring your best looks, your favorite people, and your biggest
              moments. Our photography experience gives every memory its own
              spotlight.
            </p>
          </div>
          <div className="feature-image-wrap">
            <img
              src={photographyImage}
              alt="Photography session in a bright studio"
            />
          </div>
        </div>
      </section>

      <Footer />

      {activeModal && (
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
            {activeModal === "login" ? (
              <>
                <p className="eyebrow dark">Member access</p>
                <h2>Unlock your BNB coupon.</h2>
                <p>
                  Sign in with your email and we&apos;ll create your personal
                  10% code.
                </p>
                <form className="modal-form" onSubmit={handleLogin}>
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  {formError && <p className="form-error">{formError}</p>}
                  <button
                    className="dark-button"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Signing in..." : "Continue"} <span>↗</span>
                  </button>
                </form>
              </>
            ) : activeModal === "confirmation" ? (
              <div className="confirmation-content">
                <p className="eyebrow dark">Booking received</p>
                <h2>Your celebration is on its way.</h2>
                <p>
                  We&apos;ve saved your request and will contact you at{" "}
                  {confirmation.email} to confirm the details.
                </p>
                <div className="confirmation-details">
                  <span>
                    Reference <strong>{confirmation.reference}</strong>
                  </span>
                  <span>
                    Experience <strong>{confirmation.event}</strong>
                  </span>
                  <span>
                    Date <strong>{confirmation.date}</strong>
                  </span>
                  <span>
                    Total{" "}
                    <strong>
                      ₹
                      {confirmation.total.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                  </span>
                </div>
                <button
                  className="dark-button"
                  onClick={() => setActiveModal(null)}
                  type="button"
                >
                  Done <span>✓</span>
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow dark">Your celebration</p>
                <h2>Make a booking.</h2>
                <p>
                  Enter your order value and apply your member code before
                  checkout.
                </p>
                <form className="modal-form" onSubmit={handleOrderSubmit}>
                  <div className="booking-grid">
                    <div>
                      <label htmlFor="booking-name">Your name</label>
                      <input
                        id="booking-name"
                        type="text"
                        value={bookingDetails.name}
                        onChange={(event) =>
                          updateBookingDetail("name", event.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="booking-phone">Phone number</label>
                      <input
                        id="booking-phone"
                        type="tel"
                        value={bookingDetails.phone}
                        onChange={(event) =>
                          updateBookingDetail("phone", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  <label htmlFor="booking-event">Celebration type</label>
                  <select
                    id="booking-event"
                    value={bookingDetails.event}
                    onChange={(event) =>
                      updateBookingDetail("event", event.target.value)
                    }
                  >
                    {celebrationEvents.map((eventName) => (
                      <option key={eventName}>{eventName}</option>
                    ))}
                  </select>
                  <div className="booking-grid">
                    <div>
                      <label htmlFor="booking-date">Preferred date</label>
                      <input
                        id="booking-date"
                        type="date"
                        value={bookingDetails.date}
                        onChange={(event) =>
                          updateBookingDetail("date", event.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="booking-guests">Guests</label>
                      <input
                        id="booking-guests"
                        min="1"
                        type="number"
                        value={bookingDetails.guests}
                        onChange={(event) =>
                          updateBookingDetail("guests", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  <label htmlFor="order-amount">Order amount</label>
                  <div className="amount-input">
                    <span>₹</span>
                    <input
                      id="order-amount"
                      min="0"
                      type="number"
                      value={orderAmount}
                      onChange={(event) => {
                        setOrderAmount(event.target.value);
                        setIsCouponApplied(false);
                      }}
                    />
                  </div>
                  <label htmlFor="coupon-code">Coupon code</label>
                  <div className="coupon-input">
                    <input
                      id="coupon-code"
                      type="text"
                      value={coupon}
                      onChange={(event) =>
                        setCoupon(event.target.value.toUpperCase())
                      }
                      placeholder="BLISS10"
                    />
                    <button
                      disabled={isSubmitting}
                      onClick={handleCoupon}
                      type="button"
                    >
                      {isSubmitting ? "Checking..." : "Apply"}
                    </button>
                  </div>
                  {couponMessage && (
                    <p
                      className={`coupon-message ${isCouponApplied ? "success" : "error"}`}
                    >
                      {couponMessage}
                    </p>
                  )}
                  {formError && <p className="form-error">{formError}</p>}
                  <div className="order-summary">
                    <span>
                      Subtotal{" "}
                      <strong>
                        ₹{Number(orderAmount || 0).toLocaleString("en-IN")}
                      </strong>
                    </span>
                    <span>
                      Discount{" "}
                      <strong>
                        - ₹
                        {discount.toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}
                      </strong>
                    </span>
                    <span className="order-total">
                      Total{" "}
                      <strong>
                        ₹
                        {total.toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}
                      </strong>
                    </span>
                  </div>
                  <button
                    className="dark-button"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Submitting..." : "Submit booking request"}{" "}
                    <span>↗</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default LandingPage;
