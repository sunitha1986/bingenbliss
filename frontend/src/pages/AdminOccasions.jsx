import { useEffect, useState } from "react";
import {
  getLuckyDrawStatus,
  updateLuckyDrawOccasions,
} from "../services/api";
import AdminEnquiriesLink from "../components/AdminEnquiriesLink";
import "../App.css";
import "./LuckyDraw.css";
import logoImg from "../assets/landing_page/logo.jpg";

function AdminOccasions() {
  const [adminToken] = useState(
    () => window.localStorage.getItem("bnb-admin-token") || "",
  );
  const [celebrationOccasions, setCelebrationOccasions] = useState([]);
  const [newOccasion, setNewOccasion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyOccasion, setBusyOccasion] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!adminToken) {
      window.location.replace("/admin");
      return undefined;
    }

    let isActive = true;
    getLuckyDrawStatus()
      .then((status) => {
        const occasions = Array.isArray(status.celebrationOccasions)
          ? status.celebrationOccasions
          : [];
        if (isActive) {
          setCelebrationOccasions(occasions);
        }
      })
      .catch((loadError) => {
        if (loadError.message === "Admin access is required") {
          window.localStorage.removeItem("bnb-admin-token");
          window.location.replace("/admin");
          return;
        }
        if (isActive) {
          setError(loadError.message || "Unable to load special occasions.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [adminToken]);

  const handleAddOccasion = async (event) => {
    event.preventDefault();
    const occasion = newOccasion.trim();
    if (!occasion) return;

    if (occasion.length > 40) {
      setError("Occasion name cannot exceed 40 characters.");
      return;
    }

    if (celebrationOccasions.length >= 20) {
      setError("Maximum 20 occasions allowed.");
      return;
    }

    if (
      celebrationOccasions.some(
        (existing) =>
          existing.toLocaleLowerCase() === occasion.toLocaleLowerCase(),
      )
    ) {
      setError(`"${occasion}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setBusyOccasion("__adding__");
    setError("");
    setStatusMessage("");

    const nextOccasions = [...celebrationOccasions, occasion];
    try {
      const result = await updateLuckyDrawOccasions(adminToken, nextOccasions);
      setCelebrationOccasions(result.celebrationOccasions);
      setNewOccasion("");
      setStatusMessage(`Added "${occasion}".`);
    } catch (saveError) {
      if (saveError.message === "Admin access is required") {
        window.localStorage.removeItem("bnb-admin-token");
        window.location.replace("/admin");
        return;
      }
      setError(saveError.message || "Unable to add occasion.");
    } finally {
      setIsSubmitting(false);
      setBusyOccasion("");
    }
  };

  const handleRemoveOccasion = async (occasionToRemove) => {
    if (celebrationOccasions.length <= 1) {
      setError("At least one occasion option is required.");
      return;
    }

    setIsSubmitting(true);
    setBusyOccasion(occasionToRemove);
    setError("");
    setStatusMessage("");

    const nextOccasions = celebrationOccasions.filter(
      (item) => item !== occasionToRemove,
    );
    try {
      const result = await updateLuckyDrawOccasions(adminToken, nextOccasions);
      setCelebrationOccasions(result.celebrationOccasions);
      setStatusMessage(`Removed "${occasionToRemove}".`);
    } catch (saveError) {
      if (saveError.message === "Admin access is required") {
        window.localStorage.removeItem("bnb-admin-token");
        window.location.replace("/admin");
        return;
      }
      setError(saveError.message || "Unable to remove occasion.");
    } finally {
      setIsSubmitting(false);
      setBusyOccasion("");
    }
  };

  if (!adminToken) return null;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/" aria-label="Binge N Bliss home">
          <img src={logoImg} alt="Binge N Bliss" />
          <span>BNB admin</span>
        </a>
        <nav className="admin-nav">
          <a href="/admin">Spin wheel</a>
          <a
            className="is-active"
            href="/admin/occasions"
            aria-current="page"
          >
            Special occasions
          </a>
          <a href="/admin/customers">Customers</a>
          <AdminEnquiriesLink />
          <a href="/admin/winner-history">Winner history</a>
          <a href="/lucky-draw" target="_blank" rel="noopener noreferrer">
            Customer site
          </a>
        </nav>
        <button
          className="admin-signout"
          onClick={() => {
            window.localStorage.removeItem("bnb-admin-token");
            window.location.href = "/admin";
          }}
          type="button"
        >
          Sign out
        </button>
      </aside>
      <section className="admin-main" id="admin-lucky-draw">
        <div className="admin-page-heading">
          <span className="heading-tag">Registration form</span>
          <span className="heading-title">Special occasions</span>
          <span className="heading-divider">•</span>
          <span className="heading-sub">
            Manage the options customers can select when registering for the
            lucky draw.
          </span>
        </div>
        <section
          className="admin-occasion-settings"
          aria-labelledby="admin-occasion-settings-title"
        >
          <div className="admin-occasion-settings-heading">
            <span className="draw-reveal-kicker">Customer registration</span>
            <h2 id="admin-occasion-settings-title">Occasion options</h2>
            <p>
              Add or remove choices in the registration dropdown.
            </p>
          </div>
          {isLoading ? (
            <p role="status">Loading special occasions...</p>
          ) : (
            <>
              <form
                className="admin-occasion-add-form"
                onSubmit={handleAddOccasion}
              >
                <input
                  type="text"
                  value={newOccasion}
                  maxLength={40}
                  placeholder="Add an occasion"
                  aria-label="New special occasion"
                  disabled={isSubmitting || celebrationOccasions.length >= 20}
                  onChange={(event) => {
                    setNewOccasion(event.target.value);
                    if (error) setError("");
                  }}
                />
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !newOccasion.trim() ||
                    celebrationOccasions.length >= 20 ||
                    celebrationOccasions.some(
                      (occasion) =>
                        occasion.toLocaleLowerCase() ===
                        newOccasion.trim().toLocaleLowerCase(),
                    )
                  }
                >
                  {busyOccasion === "__adding__" ? "Adding..." : "Add"}
                </button>
              </form>
              <ul className="admin-occasion-list">
                {celebrationOccasions.map((occasion) => (
                  <li key={occasion}>
                    <span>{occasion}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${occasion}`}
                      disabled={isSubmitting || celebrationOccasions.length <= 1}
                      onClick={() => handleRemoveOccasion(occasion)}
                    >
                      {busyOccasion === occasion ? "Removing..." : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {statusMessage && (
            <p className="admin-draw-setup-status is-ready" role="status">
              {statusMessage}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}

export default AdminOccasions;
