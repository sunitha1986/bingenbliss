function Navbar({ user, onLogin, onLogout, standalone = false }) {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <a className="brand" href="/" aria-label="Binge N Bliss home">
        <img src="/landing_page/logo.jpg" alt="Binge N Bliss" />
      </a>
      <div className="nav-links">
        <a href={standalone ? "/" : "#top"}>Home</a>
        {!standalone && <a href="#events">Events</a>}
        {!standalone && <a href="#gallery">Gallery</a>}
        {!standalone && <a href="#contact">Contact</a>}
        <a className="lucky-draw-nav-button" target="_blank" href="/lucky-draw">
          LuckyDraw
        </a>
        {!standalone &&
          (user ? (
            <button className="account-button" onClick={onLogout} type="button">
              Sign out
            </button>
          ) : (
            <button className="account-button" onClick={onLogin} type="button">
              Log in
            </button>
          ))}
      </div>
    </nav>
  );
}

export default Navbar;
