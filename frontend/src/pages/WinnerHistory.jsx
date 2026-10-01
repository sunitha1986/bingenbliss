import { useEffect, useState } from "react";
import { getLuckyDrawWinners } from "../services/api";
import "../App.css";
import "./WinnerHistory.css";

function formatAnnouncementDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function WinnerHistory() {
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const adminToken = window.localStorage.getItem("bnb-admin-token");

  useEffect(() => {
    if (!adminToken) {
      window.location.replace("/");
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError("");

    getLuckyDrawWinners(adminToken)
      .then((result) => {
        if (isMounted) setWinners(result.winners || []);
      })
      .catch((loadError) => {
        if (loadError.message === "Admin access is required") {
          window.localStorage.removeItem("bnb-admin-token");
          window.location.replace("/");
          return;
        }
        if (isMounted) {
          setError(loadError.message || "Unable to load winner history.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [adminToken, reloadKey]);

  return (
    <main className="winner-history-admin-shell">
      <aside
        className="winner-history-admin-sidebar"
        aria-label="Admin navigation"
      >
        <a
          className="winner-history-admin-brand"
          href="/"
          aria-label="Binge N Bliss admin home"
        >
          <img src="/landing_page/logo.jpg" alt="" />
          <span>BNB admin</span>
        </a>
        <nav className="winner-history-admin-nav">
          <a href="/admin/lucky-draw">Spin draw</a>
          <a href="/admin/customers">Customers</a>
          <a
            className="is-active"
            href="/admin/winner-history"
            aria-current="page"
          >
            Winner history
          </a>
          <a href="/lucky-draw">Customer site</a>
        </nav>
        <button
          className="winner-history-admin-signout"
          onClick={() => {
            window.localStorage.removeItem("bnb-admin-token");
            window.location.href = "/";
          }}
          type="button"
        >
          Sign out
        </button>
      </aside>
      <section className="winner-history-page">
        <div className="winner-history-content">
          <header className="winner-history-heading">
            <p className="winner-history-kicker">BINGE N BLISS / LUCKY DRAW</p>
            <h1>Winner history</h1>
            <p>Every announced winner, gathered in one place.</p>
          </header>

          <div className="winner-history-summary">
            <span>ANNOUNCED WINNERS</span>
            <strong>{winners.length}</strong>
          </div>

          {isLoading && (
            <p className="winner-history-status" role="status">
              Loading winner history...
            </p>
          )}

          {!isLoading && error && (
            <div className="winner-history-message" role="alert">
              <p>{error}</p>
              <button
                onClick={() => setReloadKey((currentKey) => currentKey + 1)}
                type="button"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && winners.length === 0 && (
            <div className="winner-history-message">
              <h2>No winners announced yet</h2>
              <p>The archive will appear here after the first draw.</p>
              <a href="/admin/lucky-draw">
                Back to draw dashboard <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}

          {!isLoading && !error && winners.length > 0 && (
            <ol
              className="winner-history-list"
              aria-label="Past lucky draw winners"
            >
              {winners.map((winner, index) => (
                <li className="winner-history-item" key={winner.id}>
                  <span className="winner-history-rank" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="winner-history-person">
                    <h2>{winner.name}</h2>
                    <p>{winner.occasion}</p>
                  </div>
                  <time
                    className="winner-history-date"
                    dateTime={winner.announcedAt || undefined}
                  >
                    {formatAnnouncementDate(winner.announcedAt)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </main>
  );
}

export default WinnerHistory;
