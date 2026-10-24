import { useState } from "react";
import LuckyDrawBanner from "./LuckyDrawBanner";
import logoImg from "../assets/landing_page/logo.jpg";

function Navbar({
  user,
  onLogin,
  onLogout,
  standalone = false,
  luckyDrawBanner = null,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {luckyDrawBanner && <LuckyDrawBanner banner={luckyDrawBanner} />}
      <nav className="nav-bar" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="Binge N Bliss home">
          <img src={logoImg} alt="Binge N Bliss" />
          <span className="brand-name">Binge n Bliss</span>
        </a>

        <button
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          className="nav-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href={standalone ? "/" : "#top"} onClick={() => setMenuOpen(false)}>
            Home
          </a>
          {!standalone && (
            <a href="#events" onClick={() => setMenuOpen(false)}>
              Events
            </a>
          )}
          {!standalone && (
            <a href="#gallery" onClick={() => setMenuOpen(false)}>
              Gallery
            </a>
          )}
          {!standalone && (
            <a href="#contact" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
          )}
          <a
            className="lucky-draw-nav-button"
            href="/lucky-draw"
            onClick={() => setMenuOpen(false)}
            rel="noopener noreferrer"
            target="_blank"
          >
            LuckyDraw
          </a>
          {!standalone &&
            (user ? (
              <button
                className="account-button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                type="button"
              >
                Sign out
              </button>
            ) : (
              <button
                className="account-button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogin?.();
                }}
                type="button"
              >
                Log in
              </button>
            ))}
        </div>
      </nav>
    </>

  );
}

export default Navbar;
