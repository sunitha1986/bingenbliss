import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { adminLogin } from "../services/api";
import "../App.css";
import heroPhoto from "/landing_page/heroIMG.jpg";

const services = [
  {
    title: "Birthday Cake",
    description: "Customized cakes for special moments.",
    image: "/landing_page/birthdayCake.jpg",
    imageAlt: "Celebration cake",
    icon: "✿",
  },
  {
    title: "Bouquet",
    description: "Fresh and premium flowers for your loved ones.",
    image: "/landing_page/boquetImg.png",
    imageAlt: "Anniversary flower arrangement",
    icon: "❀",
  },
  {
    title: "Gifts",
    description: "Surprise gifts and personalized gifts for every occasion.",
    image: "/landing_page/gifts.jpg",
    imageAlt: "Wrapped celebration gifts",
    icon: "◇",
  },
  {
    title: "Decoration",
    description: "Beautiful and themed decorations for your celebration.",
    image: "/landing_page/decorationImg.png",
    imageAlt: "Birthday celebration decorations",
    icon: "✧",
  },
  {
    title: "Grand Entry",
    description: "Make your entry special with unique arrangements.",
    image: "/landing_page/grandEntry.png",
    imageAlt: "Decorated grand entrance",
    icon: "☆",
  },
  {
    title: "Photoshoot",
    description: "Professional photography to capture your memories.",
    image: "/landing_page/photoShoot.jpg",
    imageAlt: "Celebration photoshoot",
    icon: "◉",
  },
];
const celebrationExperiences = [
  {
    title: "BirthBliss",
    description: "For birthdays worth remembering.",
    image: "/landing_page/decorationImg.png",
    imageAlt: "Colorful birthday decorations",
    color: "rose",
  },
  {
    title: "AnniversaryBliss",
    description: "Celebrate another beautiful year together.",
    image: "/landing_page/anniversaryDay.jpg",
    imageAlt: "Anniversary celebration setup",
    color: "pink",
  },
  {
    title: "LoveBliss",
    description: "For proposals, surprises and romantic moments.",
    image: "/landing_page/loveBliss.jpg",
    imageAlt: "Romantic celebration decor",
    color: "lavender",
  },
  {
    title: "KidsBliss",
    description: "Big happiness for little celebrations.",
    image: "/landing_page/kidsBliss.jpg",
    imageAlt: "Kids celebration setup",
    color: "mint",
  },
  {
    title: "Private Screening",
    description: "Enjoy a private movie screening with your favorite people.",
    image: "/landing_page/privateMovieScreening.jpg",
    imageAlt: "Friends enjoying a private movie screening",
    color: "violet",
  },
];

function orderExperiencesAroundSelection(selectedTitle) {
  if (!selectedTitle) return celebrationExperiences;

  const selectedIndex = celebrationExperiences.findIndex(
    (experience) => experience.title === selectedTitle,
  );
  const centerPosition = Math.floor(celebrationExperiences.length / 2);

  return celebrationExperiences.map((_, position) => {
    const offset =
      position < centerPosition
        ? position + 1
        : position === centerPosition
          ? 0
          : position;

    return celebrationExperiences[
      (selectedIndex + offset) % celebrationExperiences.length
    ];
  });
}

const celebrationEvents = [
  "Birthday parties",
  "Anniversary days",
  "Kitty parties",
  "Private theatre",
  "Mini theatre",
  "Photography",
];

const galleryItems = [
  {
    title: "Birthday Bash",
    category: "Celebration",
    tagline: "Colourful moments made magical",
    image: "/landing_page/birthday-gallery.webp",
    imageAlt: "Birthday celebration gallery",
  },
  {
    title: "Private Screening",
    category: "Experience",
    tagline: "Movie nights with a premium touch",
    image: "/landing_page/screening-gallery.webp",
    imageAlt: "Private screening gallery",
  },
  {
    title: "Dreamy Decor",
    category: "Styling",
    tagline: "Styled spaces that tell a story",
    image: "/landing_page/gallery-1.webp",
    imageAlt: "Dreamy decor gallery",
  },
  {
    title: "Grand Arrival",
    category: "Entrance",
    tagline: "A dramatic start to the celebration",
    image: "/landing_page/gallery-2.webp",
    imageAlt: "Grand arrival decoration",
  },
  {
    title: "Sweet Surprises",
    category: "Gifts",
    tagline: "Thoughtful details and heartfelt gifting",
    image: "/landing_page/gallery-3.webp",
    imageAlt: "Gift and surprise styling",
  },
  {
    title: "Cinema Glow",
    category: "Mood",
    tagline: "Warm, cinematic ambience for every guest",
    image: "/landing_page/gallery-4.webp",
    imageAlt: "Cinematic ambience gallery",
  },
];

const howItWorksSteps = [
  {
    id: 1,
    icon: "📅",
    title: "Register Your Date",
    description: "Tell us about your upcoming special occasion.",
  },
  {
    id: 2,
    icon: "🎁",
    title: "Enter the Monthly Draw",
    description:
      "Your registration is eligible for the monthly celebration draw.",
  },
  {
    id: 3,
    icon: "📣",
    title: "Winner Announcement",
    description:
      "We announce the selected entrant through our social channels.",
  },
  {
    id: 4,
    icon: "🎉",
    title: "Celebrate at Bingebliss",
    description:
      "The winner receives free celebration hours according to the terms.",
  },
];

function LandingPage() {
  const [celebrationIndex, setCelebrationIndex] = useState(0);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedStep, setSelectedStep] = useState(1);
  const [registrationActive, setRegistrationActive] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = window.localStorage.getItem("bnb-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeModal, setActiveModal] = useState(null);
  const [loginRole, setLoginRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
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
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(
    galleryItems.length,
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragDistance = useRef(0);
  const galleryRef = useRef(null);
  const discount = isCouponApplied ? Number(orderAmount || 0) * 0.1 : 0;
  const total = Math.max(Number(orderAmount || 0) - discount, 0);
  const orderedExperiences =
    orderExperiencesAroundSelection(selectedExperience);
  const repeatedGalleryItems = useMemo(
    () => [...galleryItems, ...galleryItems, ...galleryItems],
    [],
  );

  const openLogin = (returnToBooking = false) => {
    setPendingBooking(returnToBooking);
    setActiveModal("login");
    setLoginRole("customer");
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

  const handleRegistrationClick = () => {
    setRegistrationActive(true);
    openLogin();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      if (loginRole === "admin") {
        const result = await adminLogin({
          email: adminEmail.trim(),
          password: adminPassword,
        });
        window.localStorage.setItem("bnb-admin-token", result.token);
        window.localStorage.removeItem("bnb-user");
        window.location.href = "/admin/lucky-draw";
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return;
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

  const scrollGallery = (direction) => {
    setActiveGalleryIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      if (nextIndex >= galleryItems.length * 2) {
        return galleryItems.length;
      }
      if (nextIndex < galleryItems.length) {
        return galleryItems.length;
      }
      return nextIndex;
    });
  };

  useEffect(() => {
    if (isDragging) return undefined;

    const galleryTimer = window.setInterval(() => {
      setActiveGalleryIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= galleryItems.length * 2) {
          return galleryItems.length;
        }
        return nextIndex;
      });
    }, 2500);

    return () => window.clearInterval(galleryTimer);
  }, [galleryItems.length, isDragging]);

  useEffect(() => {
    if (activeGalleryIndex < galleryItems.length) {
      setActiveGalleryIndex(galleryItems.length);
    }
    if (activeGalleryIndex >= galleryItems.length * 2) {
      setActiveGalleryIndex(galleryItems.length);
    }
  }, [activeGalleryIndex, galleryItems.length]);

  const handlePointerDown = (event) => {
    setIsDragging(true);
    dragStartX.current = event.clientX;
    dragDistance.current = 0;
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    dragDistance.current = event.clientX - dragStartX.current;
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    const threshold = 45;
    if (dragDistance.current > threshold) {
      scrollGallery(-1);
    } else if (dragDistance.current < -threshold) {
      scrollGallery(1);
    }

    setIsDragging(false);
    dragDistance.current = 0;
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
    const phraseTimer = window.setInterval(() => {
      setCelebrationIndex(
        (currentIndex) => (currentIndex + 1) % celebrationEvents.length,
      );
    }, 5600);

    return () => window.clearInterval(phraseTimer);
  }, []);

  useEffect(() => {
    const revealCards = document.querySelectorAll(".service-reveal-card");

    if (!revealCards.length) return;

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
      { threshold: 0.15 },
    );

    revealCards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeModal) {
      setRegistrationActive(false);
    }
  }, [activeModal]);

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

      <section
        className="celebration-experiences"
        id="events"
        aria-labelledby="experiences-title"
      >
        <div className="celebration-experiences-heading">
          <div>
            <p className="experience-eyebrow">What are you celebrating?</p>
            <h2 id="experiences-title">
              Choose <span>Your Bliss</span>
            </h2>
          </div>
        </div>
        <div className="celebration-experiences-grid">
          {orderedExperiences.map((experience, index) => (
            <button
              className={`celebration-experience-card bliss-${experience.color} ${selectedExperience === experience.title ? "selected" : ""} ${index === Math.floor(orderedExperiences.length / 2) ? "center-card" : ""}`}
              key={experience.title}
              onClick={() => setSelectedExperience(experience.title)}
              type="button"
              aria-label={`Select ${experience.title}`}
              aria-pressed={selectedExperience === experience.title}
            >
              <img
                src={experience.image}
                alt={experience.imageAlt}
                loading="lazy"
                decoding="async"
              />
              <div className="bliss-card-copy">
                <h3>{experience.title}</h3>
                <p>{experience.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section
        className="how-it-works-section"
        aria-labelledby="how-it-works-title"
      >
        <div className="how-it-works-header">
          <p className="how-it-works-label">Simple Steps</p>
          <h2 id="how-it-works-title">
            How It <span>Works</span>
          </h2>
          <button
            className={`register-cta ${registrationActive ? "selected" : ""}`}
            onClick={handleRegistrationClick}
            type="button"
            aria-pressed={registrationActive}
          >
            Registration
          </button>
        </div>

        <div className="how-it-works-steps">
          {howItWorksSteps.map((step) => (
            <button
              key={step.id}
              className={`how-it-works-step ${selectedStep === step.id ? "selected" : ""}`}
              onClick={() => {
                setSelectedStep(step.id);
                setRegistrationActive(true);
              }}
              type="button"
              aria-pressed={selectedStep === step.id}
            >
              <div className="step-badge">{step.id}</div>
              <div className="step-icon" aria-hidden="true">
                {step.icon}
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="experience-section" aria-label="Our services">
        <div className="experience-heading-row">
          <p className="experience-eyebrow">Our services</p>
          <h2 className="experience-title">
            Everything you need for your <span>celebration</span>
          </h2>
          <p className="experience-note">
            From beautiful setups to unforgettable moments, we take care of
            every detail to make your special day truly memorable.
          </p>
        </div>

        <div className="experience-grid">
          {services.map((service, index) => (
            <article
              className="experience-card service-reveal-card"
              key={service.title}
              style={{ "--reveal-delay": `${index * 120}ms` }}
            >
              <img
                className="card-image"
                src={service.image}
                alt={service.imageAlt}
              />
              <div className="card-copy">
                <span className="service-icon" aria-hidden="true">
                  {service.icon}
                </span>
                <div className="service-description">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-section" aria-labelledby="gallery-title">
        <div className="gallery-header">
          <h2 id="gallery-title">Gallery</h2>
        </div>

        <div
          className="gallery-slider"
          ref={galleryRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {repeatedGalleryItems.map((item, index) => {
            const relativeIndex = index - activeGalleryIndex;
            const wrappedIndex =
              relativeIndex > galleryItems.length / 2
                ? relativeIndex - galleryItems.length
                : relativeIndex < -galleryItems.length / 2
                  ? relativeIndex + galleryItems.length
                  : relativeIndex;
            const isActive = wrappedIndex === 0;
            const distance = Math.abs(wrappedIndex);

            return (
              <article
                className={`gallery-card ${isActive ? "active" : ""}`}
                key={`${item.title}-${index}`}
                style={{
                  transform: `translate(-50%, -50%) translateX(${wrappedIndex * 150}px) scale(${isActive ? 1 : Math.max(0.76, 1 - distance * 0.08)})`,
                  opacity: isActive ? 1 : Math.max(0.45, 1 - distance * 0.14),
                  zIndex: isActive ? 20 : 10 - distance,
                  filter: isActive
                    ? "brightness(1) saturate(1.02)"
                    : "brightness(0.74) saturate(0.8)",
                }}
              >
                <img src={item.image} alt={item.imageAlt} loading="lazy" />
                <div className="gallery-card-overlay">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.tagline}</p>
                </div>
              </article>
            );
          })}
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
                <div className="login-role-toggle" aria-label="Login type">
                  <button
                    className={loginRole === "customer" ? "is-active" : ""}
                    onClick={() => {
                      setLoginRole("customer");
                      setFormError("");
                    }}
                    type="button"
                  >
                    Customer
                  </button>
                  <button
                    className={loginRole === "admin" ? "is-active" : ""}
                    onClick={() => {
                      setLoginRole("admin");
                      setFormError("");
                    }}
                    type="button"
                  >
                    Admin
                  </button>
                </div>
                <h2>
                  {loginRole === "admin"
                    ? "Admin access."
                    : "Unlock your BNB coupon."}
                </h2>
                <p>
                  {loginRole === "admin"
                    ? "Sign in to manage the lucky draw."
                    : "Sign in with your email and we’ll create your personal 10% code."}
                </p>
                <form className="modal-form" onSubmit={handleLogin}>
                  {loginRole === "admin" ? (
                    <>
                      <label htmlFor="login-admin-email">Admin email</label>
                      <input
                        id="login-admin-email"
                        type="email"
                        value={adminEmail}
                        onChange={(event) => setAdminEmail(event.target.value)}
                        placeholder="admin@bingenbliss.com"
                        required
                      />
                      <label htmlFor="login-admin-password">Password</label>
                      <input
                        id="login-admin-password"
                        type="password"
                        value={adminPassword}
                        onChange={(event) =>
                          setAdminPassword(event.target.value)
                        }
                        placeholder="Admin password"
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="login-email">Email address</label>
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </>
                  )}
                  {formError && <p className="form-error">{formError}</p>}
                  <button
                    className="dark-button"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting
                      ? "Signing in..."
                      : loginRole === "admin"
                        ? "Sign in"
                        : "Continue"}{" "}
                    <span>↗</span>
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
