import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GetTheAppButton from "../components/GetTheAppButton";
import { testAdminCredentials } from "../testCredentials";
import {useNavigate} from "react-router-dom"
import {
  adminLogin,
  createOrder,
  getLuckyDrawLatestWinner,
  lookupCustomerRegistration,
  validateCoupon,
  verifyCustomerLogin,
} from "../services/api";
import "../App.css";
import "./LandingPage.css";
import heroPhoto from "../assets/landing_page/heroIMG.jpg";
import birthdayCakeImg from "../assets/landing_page/birthdayCake.jpg";
import bouquetImg from "../assets/landing_page/boquetImg.png";
import giftsImg from "../assets/landing_page/gifts.jpg";
import decorationImg from "../assets/landing_page/decorationImg.png";
import grandEntryImg from "../assets/landing_page/grandEntry.png";
import photoShootImg from "../assets/landing_page/photoShoot.jpg";
import anniversaryDayImg from "../assets/landing_page/anniversaryDay.jpg";
import loveBlissImg from "../assets/landing_page/loveBliss.jpg";
import kidsBlissImg from "../assets/landing_page/kidsBliss.jpg";
import privateMovieScreeningImg from "../assets/landing_page/privateMovieScreening.jpg";
import birthdayGalleryImg from "../assets/landing_page/birthday-gallery.webp";
import screeningGalleryImg from "../assets/landing_page/screening-gallery.webp";
import gallery1Img from "../assets/landing_page/gallery-1.webp";
import gallery2Img from "../assets/landing_page/gallery-2.webp";
import gallery3Img from "../assets/landing_page/gallery-3.webp";
import gallery4Img from "../assets/landing_page/gallery-4.webp";

const services = [
  {
    title: "Birthday Cake",
    description: "Customized cakes for special moments.",
    image: birthdayCakeImg,
    imageAlt: "Celebration cake",
    icon: "✿",
  },
  {
    title: "Bouquet",
    description: "Fresh and premium flowers for your loved ones.",
    image: bouquetImg,
    imageAlt: "Anniversary flower arrangement",
    icon: "❀",
  },
  {
    title: "Gifts",
    description: "Surprise gifts and personalized gifts for every occasion.",
    image: giftsImg,
    imageAlt: "Wrapped celebration gifts",
    icon: "◇",
  },
  {
    title: "Decoration",
    description: "Beautiful and themed decorations for your celebration.",
    image: decorationImg,
    imageAlt: "Birthday celebration decorations",
    icon: "✧",
  },
  {
    title: "Grand Entry",
    description: "Make your entry special with unique arrangements.",
    image: grandEntryImg,
    imageAlt: "Decorated grand entrance",
    icon: "☆",
  },
  {
    title: "Photoshoot",
    description: "Professional photography to capture your memories.",
    image: photoShootImg,
    imageAlt: "Celebration photoshoot",
    icon: "◉",
  },
];
const sampleReviews = [
  {
    text: "Beautiful decorations and thoughtful details made our celebration feel truly special. The team was helpful from start to finish.",
  },
  {
    text: "Everything was well organised and the setup looked amazing. Our family had a wonderful time celebrating together.",
  },
  {
    text: "Friendly service and lovely arrangements. They made planning our special occasion easy and memorable.",
  },
];
const celebrationExperiences = [
  {
    title: "BirthBliss",
    description: "For birthdays worth remembering.",
    image: decorationImg,
    imageAlt: "Colorful birthday decorations",
    color: "rose",
  },
  {
    title: "AnniversaryBliss",
    description: "Celebrate another beautiful year together.",
    image: anniversaryDayImg,
    imageAlt: "Anniversary celebration setup",
    color: "pink",
  },
  {
    title: "LoveBliss",
    description: "For proposals, surprises and romantic moments.",
    image: loveBlissImg,
    imageAlt: "Romantic celebration decor",
    color: "lavender",
  },
  {
    title: "KidsBliss",
    description: "Big happiness for little celebrations.",
    image: kidsBlissImg,
    imageAlt: "Kids celebration setup",
    color: "mint",
  },
  {
    title: "Private Screening",
    description: "Enjoy a private movie screening with your favorite people.",
    image: privateMovieScreeningImg,
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

  return Array.from({ length: celebrationExperiences.length }, (_, offset) => {
    const nextIndex =
      (selectedIndex +
        offset -
        centerPosition +
        celebrationExperiences.length) %
      celebrationExperiences.length;

    return celebrationExperiences[nextIndex];
  });
}

function formatDrawDate(drawDate) {
  if (!drawDate || !/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) return "";
  const [year, month, day] = drawDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString(
    "en-IN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    },
  );
}



function formatCustomerProfileDate(date) {
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

function formatCustomerRegistrationTime(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? `${date.toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    })} IST`
    : "Not available";
}

function normalizeCustomerPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
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
    image: birthdayGalleryImg,
    imageAlt: "Birthday celebration gallery",
  },
  {
    title: "Private Screening",
    category: "Experience",
    tagline: "Movie nights with a premium touch",
    image: screeningGalleryImg,
    imageAlt: "Private screening gallery",
  },
  {
    title: "Dreamy Decor",
    category: "Styling",
    tagline: "Styled spaces that tell a story",
    image: gallery1Img,
    imageAlt: "Dreamy decor gallery",
  },
  {
    title: "Grand Arrival",
    category: "Entrance",
    tagline: "A dramatic start to the celebration",
    image: gallery2Img,
    imageAlt: "Grand arrival decoration",
  },
  {
    title: "Sweet Surprises",
    category: "Gifts",
    tagline: "Thoughtful details and heartfelt gifting",
    image: gallery3Img,
    imageAlt: "Gift and surprise styling",
  },
  {
    title: "Cinema Glow",
    category: "Mood",
    tagline: "Warm, cinematic ambience for every guest",
    image: gallery4Img,
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
  
  const navigate = useNavigate()
  const [celebrationIndex, setCelebrationIndex] = useState(0);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedStep, setSelectedStep] = useState(1);
  const [stepChangeGlow, setStepChangeGlow] = useState(false);
  const hasStepChanged = useRef(false);
  const experienceCardRefs = useRef({});
  const [registrationActive, setRegistrationActive] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = window.localStorage.getItem("bnb-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeModal, setActiveModal] = useState(null);
  const [loginRole, setLoginRole] = useState("customer");
  const [customerLoginStep, setCustomerLoginStep] = useState("phone");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerOtp, setCustomerOtp] = useState("");
  const [customerProfile, setCustomerProfile] = useState(null);
  const [customerNeedsRegistration, setCustomerNeedsRegistration] =
    useState(false);
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
  const [monthlyDraw, setMonthlyDraw] = useState(null);
  const [monthlyDrawSlide, setMonthlyDrawSlide] = useState(0);
  const nextDrawDate =
    monthlyDraw?.nextDrawDate || monthlyDraw?.drawDate
      ? formatDrawDate(monthlyDraw.nextDrawDate || monthlyDraw.drawDate)
      : "Date to be announced";
  const isMobileGallery =
    typeof window !== "undefined" && window.innerWidth <= 480;
  const monthlyDrawSlideCount = monthlyDraw?.lastWinnerName ? 2 : 1;

  useEffect(() => {
    if (monthlyDrawSlideCount < 2) return undefined;

    const slideTimer = window.setTimeout(() => {
      setMonthlyDrawSlide(
        (currentSlide) => (currentSlide + 1) % monthlyDrawSlideCount,
      );
    }, 2000);

    return () => window.clearTimeout(slideTimer);
  }, [monthlyDrawSlide, monthlyDrawSlideCount]);
  useEffect(() => {
    let isActive = true;

    const refreshMonthlyDraw = async () => {
      try {
        const status = await getLuckyDrawLatestWinner();
        if (isActive) {
          setMonthlyDraw({
            wheelEnabled: status.wheelEnabled === true,
            lastWinnerName: status.lastWinnerName || "",
            lastWinnerMonth: status.lastWinnerMonth || "",
            nextDrawDate: status.nextDrawDate || status.drawDate || "",
          });
          if (status?.winner) {
            const w = status.winner;
            try {
              window.localStorage.setItem(
                "bnb-lucky-draw-latest-winner",
                JSON.stringify({
                  id: `${w.Name || w.name}-${w.Phone || w.phone || ""}`,
                  name: w.Name || w.name || status.lastWinnerName || "Lucky Winner",
                  phone: w.Phone || w.phone || "",
                  date: w.date || w.dob || w["Date of birth"] || "",
                  occasion: w.occasion || w.Occasion || "Special Celebration",
                }),
              );
            } catch { }
          }
        }
      } catch { }
    };

    refreshMonthlyDraw();
    window.addEventListener("focus", refreshMonthlyDraw);

    return () => {
      isActive = false;
      window.removeEventListener("focus", refreshMonthlyDraw);
    };
  }, []);

  const openLogin = (returnToBooking = false) => {
    setPendingBooking(returnToBooking);
    setActiveModal("login");
    setLoginRole("customer");
    setCustomerLoginStep("phone");
    setCustomerPhone("");
    setCustomerOtp("");
    setCustomerNeedsRegistration(false);
    setCouponMessage("");
    setFormError("");
  };

  const handleExperienceSelection = (title) => {
    setSelectedExperience(title);
    requestAnimationFrame(() => {
      experienceCardRefs.current[title]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  };

  const handleRegistrationClick = () => {
    setRegistrationActive(true);
    // openLogin();
    console.log('inside the handle click')
    navigate("/lucky-draw")
    
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
        window.location.href = "/admin";
        return;
      }

      const normalizedPhone = normalizeCustomerPhone(customerPhone);
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        throw new Error("Enter a valid 10-digit Indian WhatsApp number.");
      }

      if (customerLoginStep === "phone") {
        const result = await lookupCustomerRegistration(normalizedPhone);
        if (!result.registered) {
          setCustomerNeedsRegistration(true);
          setFormError(
            "This number is not registered yet. Register to join the lucky draw.",
          );
          return;
        }
        if (!import.meta.env.DEV) {
          setFormError(
            "This number is registered, but secure OTP sign-in is not enabled in production yet.",
          );
          return;
        }
        setCustomerNeedsRegistration(false);
        setCustomerLoginStep("otp");
        setFormError("");
        return;
      }

      const result = await verifyCustomerLogin(
        normalizedPhone,
        customerOtp,
      );
      if (!result.profile) {
        throw new Error("Your registration details could not be loaded.");
      }
      const customerUser = {
        ...result.user,
        profile: result.profile,
        customerVerified: true,
      };
      setUser(customerUser);
      window.localStorage.setItem("bnb-user", JSON.stringify(customerUser));
      setCoupon(result.user.coupon || "");
      setCustomerProfile(result.profile);
      setActiveModal("customer-profile");
    } catch (error) {
      if (error.message.includes("not registered")) {
        setCustomerNeedsRegistration(true);
      }
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
      const result = await validateCoupon({
        email: user.email,
        code: coupon,
        amount: Number(orderAmount),
      });
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
      const result = await createOrder({
        ...bookingDetails,
        amount: Number(orderAmount || 0),
        coupon: isCouponApplied ? coupon.trim().toUpperCase() : null,
        email: user.email,
      });
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
    const stepTimer = window.setInterval(() => {
      setSelectedStep(
        (currentStep) => (currentStep % howItWorksSteps.length) + 1,
      );
    }, 2500);

    return () => window.clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    if (!hasStepChanged.current) {
      hasStepChanged.current = true;
      return;
    }

    setStepChangeGlow(true);
    const glowTimer = window.setTimeout(() => setStepChangeGlow(false), 900);

    return () => window.clearTimeout(glowTimer);
  }, [selectedStep]);

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

      <Navbar
        user={user}
        onLogin={openLogin}
        onLogout={handleLogout}
        luckyDrawBanner={{
          winnerName: monthlyDraw?.lastWinnerName || "",
          winnerMonth: monthlyDraw?.lastWinnerMonth || "",
          nextDrawDate,
          slide: monthlyDrawSlide,
          slideCount: monthlyDrawSlideCount,
        }}
      />

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

          <GetTheAppButton variant="hero" />
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
              ref={(element) => {
                if (element)
                  experienceCardRefs.current[experience.title] = element;
              }}
              className={`celebration-experience-card bliss-${experience.color} ${selectedExperience === experience.title ? "selected" : ""} ${index === Math.floor(orderedExperiences.length / 2) ? "center-card" : ""}`}
              key={experience.title}
              onClick={() => handleExperienceSelection(experience.title)}
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
            Lucky Draw - How It <span>Works</span>
          </h2>
          <button
            className={`register-cta ${registrationActive ? "selected" : ""} ${stepChangeGlow ? "step-change-glow" : ""}`}
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

      <section
        className="experience-section"
        id="services"
        aria-label="Our services"
      >
        <div className="experience-heading-row">
          <p className="experience-eyebrow">Our services</p>
          <h2 className="experience-title">
            Everything you need for your <span>celebration</span>
          </h2>
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

      <section
        className="gallery-section"
        id="gallery"
        aria-labelledby="gallery-title"
      >
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
                  transform: `translate(-50%, -50%) translateX(${wrappedIndex * (isMobileGallery ? 95 : 150)}px) scale(${isActive ? 1 : Math.max(0.76, 1 - distance * 0.08)})`,
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

      <section
        className="customer-reviews-section"
        aria-labelledby="customer-reviews-title"
      >
        <div className="customer-reviews-heading">
          <p className="experience-eyebrow">Kind words</p>
          <h2 id="customer-reviews-title">
            What our customers <span>say</span>
          </h2>
          <p className="customer-reviews-intro">
            Sample testimonials for preview. Replace these with verified
            customer reviews before publishing.
          </p>
        </div>
        <div className="customer-reviews-grid">
          {sampleReviews.map((review, index) => (
            <article className="customer-review-card" key={review.text}>
              <div className="customer-review-card-top">
                <span className="customer-review-avatar" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="customer-review-author">
                  <strong>Sample customer</strong>
                  <span>Preview only</span>
                </div>
              </div>
              <div
                className="customer-review-stars"
                aria-label="5 out of 5 stars"
              >
                {"★★★★★"}
              </div>
              <p className="customer-review-text">“{review.text}”</p>
            </article>
          ))}
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
            className={
              activeModal === "login"
                ? "modal-card login-modal-card"
                : "modal-card"
            }
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
                      setCustomerOtp("");
                      setCustomerNeedsRegistration(false);
                      setFormError("");
                    }}
                    type="button"
                  >
                    Customer
                  </button>
                  <button
                    className={loginRole === "admin" ? "is-active" : ""}
                    aria-pressed={loginRole === "admin"}
                    onClick={() => {
                      setActiveModal(null);
                      navigate("/admin");
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
                    ? "Sign in to manage the lucky draw."
                    : customerLoginStep === "otp"
                      ? `Enter the verification code for ${normalizeCustomerPhone(customerPhone)}.`
                      : "Enter the WhatsApp number you used to register."}
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
                      <button
                        className="login-test-prefill"
                        onClick={() => {
                          if (import.meta.env.DEV) {
                            setAdminEmail(testAdminCredentials.email);
                            setAdminPassword(testAdminCredentials.password);
                          } else {
                            setAdminEmail("admin@bingenbliss.com");
                          }
                          setFormError("");
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
                          <label htmlFor="login-customer-phone">
                            WhatsApp number
                          </label>
                          <input
                            id="login-customer-phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            value={customerPhone}
                            onChange={(event) => {
                              setCustomerPhone(
                                event.target.value
                                  .replace(/\D/g, "")
                                  .slice(-12),
                              );
                              setCustomerNeedsRegistration(false);
                              setFormError("");
                            }}
                            placeholder="10-digit WhatsApp number"
                            required
                          />
                        </>
                      ) : (
                        <>
                          <label htmlFor="login-customer-otp">
                            Verification code
                          </label>
                          <input
                            id="login-customer-otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={4}
                            value={customerOtp}
                            onChange={(event) =>
                              setCustomerOtp(
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
                              setCustomerOtp("");
                              setFormError("");
                            }}
                            type="button"
                          >
                            Change phone number
                          </button>
                          {import.meta.env.DEV && (
                            <p className="login-test-hint">
                              Development test code: 7374. No real message is
                              sent.
                            </p>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {formError && <p className="form-error">{formError}</p>}
                  {customerNeedsRegistration && loginRole === "customer" && (
                    <a className="login-register-link" href="/lucky-draw">
                      Register for the lucky draw <span aria-hidden="true">↗</span>
                    </a>
                  )}
                  <button
                    className="dark-button"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting
                      ? "Please wait..."
                      : loginRole === "admin"
                        ? "Sign in"
                        : customerLoginStep === "phone"
                          ? "Continue"
                          : "Verify code"}{" "}
                    <span>↗</span>
                  </button>
                </form>
                <p className="login-privacy-note">
                  <span aria-hidden="true">✦</span>
                  Customer sign-in uses your registered WhatsApp number.
                </p>
              </>
            ) : activeModal === "customer-profile" ? (
              <div className="customer-profile-content">
                <p className="eyebrow dark">Customer account</p>
                <h2>Your registration</h2>
                <p>These are the details saved with your lucky draw entry.</p>
                <dl className="customer-profile-grid">
                  <div>
                    <dt>Full name</dt>
                    <dd>{customerProfile?.name || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>WhatsApp number</dt>
                    <dd>{customerProfile?.phone || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Special occasion</dt>
                    <dd>{customerProfile?.occasion || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Celebration date</dt>
                    <dd>
                      {formatCustomerProfileDate(
                        customerProfile?.celebrationDate,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Expected guests</dt>
                    <dd>{customerProfile?.guests || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt>Registered on</dt>
                    <dd>
                      {formatCustomerRegistrationTime(
                        customerProfile?.registeredAt,
                      )}
                    </dd>
                  </div>
                </dl>
                <button
                  className="dark-button"
                  onClick={() => {
                    if (pendingBooking) {
                      setActiveModal("order");
                      setPendingBooking(false);
                    } else {
                      setActiveModal(null);
                    }
                  }}
                  type="button"
                >
                  {pendingBooking ? "Continue to booking" : "Done"}{" "}
                  <span>↗</span>
                </button>
              </div>
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
