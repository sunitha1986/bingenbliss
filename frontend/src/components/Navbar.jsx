import { useState } from "react";

function Navbar({ user, onLogin, onLogout, standalone = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <a className="brand" href="/" aria-label="Binge N Bliss home">
        <img src="/landing_page/logo.jpg" alt="Binge N Bliss" />
      </a>
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
        aria-expanded={isMenuOpen}
        aria-label={
          isMenuOpen ? "Close navigation menu" : "Open navigation menu"
        }
      >
        {isMenuOpen ? "×" : "☰"}
      </button>
      <div className={`nav-links ${isMenuOpen ? "mobile-open" : ""}`}>
        <a
          href={standalone ? "/" : "#top"}
          onClick={() => setIsMenuOpen(false)}
        >
          Home
        </a>
        {!standalone && <a href="#events">Events</a>}
        {!standalone && <a href="#gallery">Gallery</a>}
        {!standalone && <a href="#contact">Contact</a>}
        <a
          className="lucky-draw-nav-button"
          target="_blank"
          href="/lucky-draw"
          onClick={() => setIsMenuOpen(false)}
        >
          LuckyDraw
        </a>
        {!standalone &&
          (user ? (
            <button
              className="account-button"
              onClick={() => {
                setIsMenuOpen(false);
                onLogout();
              }}
              type="button"
            >
              Sign out
            </button>
          ) : (
            <button
              className="account-button"
              onClick={() => {
                setIsMenuOpen(false);
                onLogin();
              }}
              type="button"
            >
              Log in
            </button>
          ))}
      </div>
    </nav>
  );
}

export default Navbar;
