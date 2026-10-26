import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import LuckyDrawBanner from "./LuckyDrawBanner";
import EnquiryForm from "./EnquiryForm.jsx";
import logoImg from "../assets/landing_page/logo.jpg";

function Navbar({
  user,
  onLogin,
  onLogout,
  standalone = false,
  luckyDrawBanner = null,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    const handleResize = () => {
      if (window.innerWidth > 700) closeMenu();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [menuOpen]);

  const navigationLinks = (
    <div
      className={`nav-links ${menuOpen ? "open" : ""}`}
      id="mobile-navigation"
    >
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
  );

  return (
    <>
      {luckyDrawBanner && <LuckyDrawBanner banner={luckyDrawBanner} />}
      {menuOpen &&
        createPortal(
          <>
            <button
              aria-label="Close navigation menu"
              className="nav-drawer-backdrop"
              onClick={closeMenu}
              tabIndex={-1}
              type="button"
            />
            {navigationLinks}
          </>,
          document.body,
        )}
      <nav
        className={`nav-bar ${menuOpen ? "is-menu-open" : ""}`}
        aria-label="Main navigation"
      >
        <a className="brand" href="/" aria-label="Binge N Bliss home">
          <img src={logoImg} alt="Binge N Bliss" />
          <span className="brand-name">Binge n Bliss</span>
        </a>

        <button
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="nav-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        {!menuOpen && navigationLinks}
      </nav>
    </>
  );
}

export default Navbar;
