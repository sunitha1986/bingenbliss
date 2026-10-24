import { contactPhone } from "../config/contact";
import logoImg from "../assets/landing_page/logo.jpg";

const footerAddress =
  "Door No 13-43, HIG-18, Main Rd, opposite Vedanta Hospital, Anand Nagar, SBI Colony, Pothinamallayya Palem, Potinamallayyapalem, Andhra Pradesh 530041";
const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=Door+No+13-43%2C+HIG-18%2C+Main+Rd%2C+opposite+Vedanta+Hospital%2C+Anand+Nagar%2C+SBI+Colony%2C+Pothinamallayya+Palem%2C+Potinamallayyapalem%2C+Andhra+Pradesh+530041";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/bingenblissvsp/",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61594497062301",
  },
  { name: "YouTube", href: "https://www.youtube.com/@Binge%C3%B1Bliss-l7o" },
];

function SocialIcon({ name }) {
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
      </svg>
    );
  }

  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.6 1.6-1.6h1.7V3.6c-.8-.1-1.7-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.4v2.1H7.3V13h2.8v8h3.4z"
        />
      </svg>
    );
  }

  if (name === "Twitter") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          className="footer-twitter-icon"
          fill="currentColor"
          d="M18.9 1.2h3.7l-8.1 9.2L24 22.9h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9zm-1.3 19.6h2.1L6.5 3.2H4.2l13.4 17.6z"
        />
      </svg>
    );
  }

  if (name === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5.2 7.8a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM3.4 9.4H7v11.2H3.4V9.4Zm5.8 0h3.5v1.5h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v6.1h-3.7v-5.4c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9v5.5H9.2V9.4Z"
      />
    </svg>
  );
}

function Footer({ standalone = false }) {
  const homeSection = (section) =>
    standalone ? `/#${section}` : `#${section}`;

  return (
    <footer className="site-footer" id={standalone ? undefined : "contact"}>
      <div className="footer-main">
        <a
          className="footer-brand"
          href={standalone ? "/" : "#top"}
          aria-label="Binge N Bliss home"
        >
          <img src={logoImg} alt="Binge N Bliss" />
        </a>
        <nav className="footer-navigation" aria-label="Footer navigation">
          <h2>Company</h2>
          <a href={homeSection("services")}>Our Services</a>
          <a href={homeSection("gallery")}>Gallery</a>
        </nav>
        <section className="footer-contact" aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title">Reach Us</h2>
          <a
            className="footer-address"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">⌖</span>
            <span>{footerAddress}</span>
          </a>
          <a className="footer-contact-link" href={`tel:${contactPhone}`}>
            <span aria-hidden="true">☎</span>
            <span>+91 81259 82825</span>
          </a>
        </section>
        <section className="footer-social" aria-labelledby="footer-social-title">
          <h2 id="footer-social-title">Social Media</h2>
          <div className="footer-social-links">
            {socialLinks.map(({ name, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                title={name}
              >
                <SocialIcon name={name} />
              </a>
            ))}
          </div>
        </section>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Binge N Bliss</span>
        <span className="footer-credit">
          Developed by <strong>VasmiGroup</strong>
        </span>
        <a href={standalone ? "/" : "#top"}>
          {standalone ? "Back home" : "Back to top ↑"}
        </a>
      </div>
    </footer>
  );
}

export default Footer;
