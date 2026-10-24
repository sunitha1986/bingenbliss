import { useState } from "react";
import LuckyDrawBanner from "./LuckyDrawBanner";
import EnquiryForm from "./Enquiryform";

function Navbar({
  user,
  onLogin,
  onLogout,
  standalone = false,
  luckyDrawBanner = null,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {luckyDrawBanner && <LuckyDrawBanner banner={luckyDrawBanner} />}
      <nav className="nav-bar" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="Binge N Bliss home">
          <img src="/landing_page/logo.jpg" alt="Binge N Bliss" />
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
          <a href={standalone ? "/" : "#top"} onClick={closeMenu}>
            Home
          </a>

          {!standalone && (
            <a href="#events" onClick={closeMenu}>
              Events
            </a>
          )}

          {!standalone && (
            <a href="#gallery" onClick={closeMenu}>
              Gallery
            </a>
          )}

          {!standalone && (
            <a href="#contact" onClick={closeMenu}>
              Contact
            </a>
          )}

          <EnquiryForm
            triggerLabel="Enquiry Form"
            triggerClassName="lucky-draw-nav-button"
            onOpen={closeMenu}
          />

          {!standalone &&
            (user ? (
              <button
                className="account-button"
                onClick={() => {
                  closeMenu();
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
                  closeMenu();
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
