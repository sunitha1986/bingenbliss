function Footer({ standalone = false }) {
  return (
    <footer id={standalone ? undefined : "contact"}>
      <span>BNB / 2024</span>
      <span>Good times, thoughtfully made.</span>
      <a href={standalone ? "/" : "#top"}>
        {standalone ? "Back home" : "Back to top ↑"}
      </a>
    </footer>
  );
}

export default Footer;
