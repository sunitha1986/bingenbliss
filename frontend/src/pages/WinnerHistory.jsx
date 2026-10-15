import { useEffect, useMemo, useState } from "react";
import { useScrollLoadedCount } from "../hooks/useScrollLoadedCount";
import { getLuckyDrawStatus, getLuckyDrawWinners } from "../services/api";
import "../App.css";
import "./WinnerHistory.css";

function formatAnnouncementDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAnnouncementMonth(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  const date =
    Number.isInteger(year) && Number.isInteger(month)
      ? new Date(year, month - 1, 1)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getAnnouncementMonthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatEventDate(value) {
  if (!value) return "Not provided";
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function WinnerHistory() {
  const [winners, setWinners] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [occasionFilter, setOccasionFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const adminToken = window.localStorage.getItem("bnb-admin-token");

  const drawMonths = useMemo(
    () =>
      [
        ...new Set(
          winners
            .map((winner) => getAnnouncementMonthKey(winner.announcedAt))
            .filter(Boolean),
        ),
      ]
        .sort((first, second) => second.localeCompare(first)),
    [winners],
  );
  const filteredWinners = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    return winners.filter((winner) => {
      const matchesSearch =
        !normalizedSearch ||
        [winner.name, winner.occasion, winner.eventDate].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(normalizedSearch),
        );
      return (
        matchesSearch &&
        (!occasionFilter || winner.occasion === occasionFilter) &&
        (!monthFilter ||
          getAnnouncementMonthKey(winner.announcedAt) === monthFilter)
      );
    });
  }, [monthFilter, occasionFilter, searchTerm, winners]);
  const {
    visibleCount: visibleWinnerCount,
    sentinelRef: winnerListSentinelRef,
    hasMore: hasMoreWinners,
  } = useScrollLoadedCount(filteredWinners.length, {
    pageSize: 20,
    resetKey: `${searchTerm}\u0000${occasionFilter}\u0000${monthFilter}`,
  });
  const latestWinner = winners[0];

  useEffect(() => {
    if (!adminToken) {
      window.location.replace("/admin");
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError("");

    Promise.all([getLuckyDrawWinners(adminToken), getLuckyDrawStatus()])
      .then(([winnerResult, status]) => {
        if (isMounted) {
          const winnerList = winnerResult.winners || [];
          setWinners(winnerList);
          if (status.lastSpin?.winner) {
            const w = status.lastSpin.winner;
            try {
              window.localStorage.setItem(
                "bnb-lucky-draw-latest-winner",
                JSON.stringify({
                  id: `${w.Name || w.name}-${w.Phone || w.phone || ""}`,
                  name: w.Name || w.name || "Lucky Winner",
                  phone: w.Phone || w.phone || "",
                  date: w.date || w.dob || w["Date of birth"] || "",
                  occasion: w.occasion || w.Occasion || "Special Celebration",
                }),
              );
            } catch {}
          }
          setOccasions(
            Array.isArray(status.celebrationOccasions)
              ? status.celebrationOccasions
              : [],
          );
        }
      })
      .catch((loadError) => {
        if (loadError.message === "Admin access is required") {
          window.localStorage.removeItem("bnb-admin-token");
          window.location.replace("/admin");
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
          <a href="/admin">Spin draw</a>
          <a href="/admin/occasions">Special occasions</a>
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
            window.location.href = "/admin";
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
              <a href="/admin">
                Back to draw dashboard <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}

          {!isLoading && !error && winners.length > 0 && (
            <>
              <section className="winner-history-overview" aria-label="Winner history overview">
                <div className="winner-history-stat">
                  <span>Total winners</span>
                  <strong>{winners.length}</strong>
                </div>
                <div className="winner-history-stat">
                  <span>Active occasions</span>
                  <strong>{occasions.length}</strong>
                </div>
                <div className="winner-history-stat winner-history-latest-stat">
                  <span>Most recent winner</span>
                  <strong>{latestWinner?.name || "—"}</strong>
                  <small>{formatAnnouncementDate(latestWinner?.announcedAt)}</small>
                </div>
              </section>

              <div className="winner-history-tools">
                <label className="winner-history-search">
                  <span className="winner-history-visually-hidden">Search winners</span>
                  <span aria-hidden="true">⌕</span>
                  <input
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search winner, occasion or event date"
                    type="search"
                    value={searchTerm}
                  />
                </label>
                <label className="winner-history-filter">
                  <span className="winner-history-visually-hidden">Filter by draw month</span>
                  <select
                    onChange={(event) => setMonthFilter(event.target.value)}
                    value={monthFilter}
                  >
                    <option value="">All draw months</option>
                    {drawMonths.map((month) => (
                      <option key={month} value={month}>
                        {formatAnnouncementMonth(`${month}-01`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="winner-history-filter">
                  <span className="winner-history-visually-hidden">Filter by occasion</span>
                  <select
                    onChange={(event) => setOccasionFilter(event.target.value)}
                    value={occasionFilter}
                  >
                    <option value="">All occasions</option>
                    {occasions.map((occasion) => (
                      <option key={occasion} value={occasion}>
                        {occasion}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="winner-history-results" aria-live="polite">
                Showing {Math.min(visibleWinnerCount, filteredWinners.length)} of{" "}
                {filteredWinners.length} matching winners
              </p>

              {filteredWinners.length > 0 ? (
                <ol
                  className="winner-history-list"
                  aria-label="Past lucky draw winners"
                >
                  {filteredWinners.slice(0, visibleWinnerCount).map((winner, index) => (
                    <li className="winner-history-item" key={winner.id}>
                      <span className="winner-history-rank" aria-hidden="true">
                        <span>WINNER</span>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="winner-history-person">
                        <h2>{winner.name}</h2>
                        <p>{winner.occasion}</p>
                        <p className="winner-history-event-date">
                          <span>Event date</span>
                          {formatEventDate(winner.eventDate)}
                        </p>
                      </div>
                      <time
                        className="winner-history-date"
                        dateTime={winner.announcedAt || undefined}
                      >
                        <span>{formatAnnouncementMonth(winner.announcedAt)}</span>
                        {formatAnnouncementDate(winner.announcedAt)}
                      </time>
                    </li>
                  ))}
                  {hasMoreWinners && (
                    <li
                      aria-hidden="true"
                      className="winner-history-load-sentinel"
                      ref={winnerListSentinelRef}
                    />
                  )}
                </ol>
              ) : (
                <div className="winner-history-message winner-history-filter-empty">
                  <h2>No matching winners</h2>
                  <p>Try a different name or occasion.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setOccasionFilter("");
                      setMonthFilter("");
                    }}
                    type="button"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default WinnerHistory;
