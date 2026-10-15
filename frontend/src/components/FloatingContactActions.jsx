import { contactPhone, whatsappPhone } from "../config/contact";
import "./FloatingContactActions.css";

function FloatingContactActions() {
  return (
    <nav className="floating-contact-actions" aria-label="Contact Binge N Bliss">
      <a
        className="floating-contact-action floating-contact-call"
        href={`tel:${contactPhone}`}
        aria-label="Call Binge N Bliss"
        title="Call us"
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            d="M14.2 7.5c1.5-.7 3.2-.2 4.1 1.2l3.1 4.8c.8 1.2.7 2.8-.2 3.9l-2.6 3.1c2 4.1 5.2 7.3 9.3 9.3l3.1-2.6c1.1-.9 2.7-1 3.9-.2l4.8 3.1c1.4.9 1.9 2.7 1.2 4.1l-1.7 3.5c-.7 1.4-2.2 2.2-3.8 2.1C20.6 38.7 9.3 27.4 8.2 12.6c-.1-1.6.7-3.1 2.1-3.8l3.9-1.3Z"
            fill="currentColor"
          />
          <path
            d="M29 8c5.8 1.1 10 5.3 11 11M29.5 14c2.4.6 4 2.2 4.6 4.6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </a>
      <a
        className="floating-contact-action floating-contact-whatsapp"
        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent("Hi Binge N Bliss, I'd like to know more about your celebration services.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message Binge N Bliss on WhatsApp"
        title="WhatsApp us"
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            d="M24 5.5a18.1 18.1 0 0 0-15.5 27.5L6 42l9.3-2.4A18.2 18.2 0 1 0 24 5.5Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="3.4"
          />
          <path
            d="M18.2 15.2c-.5-1.1-1.1-1.1-1.6-1.1h-1.3c-.5 0-1.3.2-2 1s-2.6 2.6-2.6 6.3 2.7 7.3 3.1 7.8c.4.5 5.2 8.2 12.8 11.2 6.3 2.5 7.6 2 9 1.9 1.4-.1 4.5-1.8 5.1-3.5.6-1.7.6-3.2.4-3.5-.2-.3-.7-.5-1.5-.9-.8-.4-4.5-2.2-5.2-2.5-.7-.3-1.2-.4-1.7.4-.5.8-1.9 2.5-2.4 3-.4.5-.9.6-1.7.2-.8-.4-3.3-1.2-6.2-3.8-2.3-2-3.8-4.5-4.2-5.3-.4-.8 0-1.2.3-1.6.4-.4.8-.9 1.2-1.4.4-.5.5-.8.8-1.3.3-.5.1-1-.1-1.4-.2-.4-1.7-4.1-2.3-5.5Z"
            fill="currentColor"
            transform="translate(5 0) scale(.78)"
          />
        </svg>
      </a>
    </nav>
  );
}

export default FloatingContactActions;
