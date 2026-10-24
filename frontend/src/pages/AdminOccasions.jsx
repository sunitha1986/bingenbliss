import { useEffect, useState } from "react";
import {
  getLuckyDrawStatus,
  updateLuckyDrawOccasions,
} from "../services/api";
import AdminEnquiriesLink from "../components/AdminEnquiriesLink";
import "../App.css";
import "./LuckyDraw.css";

function AdminOccasions() {
  const [adminToken] = useState(
    () => window.localStorage.getItem("bnb-admin-token") || "",
  );
  const [celebrationOccasions, setCelebrationOccasions] = useState([]);
  const [savedOccasions, setSavedOccasions] = useState([]);
  const [newOccasion, setNewOccasion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
          setSavedOccasions(occasions);
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

  const hasUnsavedChanges =
    celebrationOccasions.length !== savedOccasions.length ||
    celebrationOccasions.some(
      (occasion, index) => occasion !== savedOccasions[index],
    );

  const handleAddOccasion = (event) => {
    event.preventDefault();
    const occasion = newOccasion.trim();
    if (
      !occasion ||
      occasion.length > 40 ||
      celebrationOccasions.length >= 20 ||
      celebrationOccasions.some(
        (existing) => existing.toLocaleLowerCase() === occasion.toLocaleLowerCase(),
      )
    ) {
      return;
    }

    setCelebrationOccasions((current) => [...current, occasion]);
    setNewOccasion("");
    setError("");
    setStatusMessage("");
  };

  const handleSaveOccasions = async () => {
    setIsSaving(true);
    setError("");
    setStatusMessage("");
    try {
      const result = await updateLuckyDrawOccasions(
        adminToken,
        celebrationOccasions,
      );
      setCelebrationOccasions(result.celebrationOccasions);
      setSavedOccasions(result.celebrationOccasions);
      setStatusMessage("Special occasions saved.");
    } catch (saveError) {
      if (saveError.message === "Admin access is required") {
        window.localStorage.removeItem("bnb-admin-token");
        window.location.replace("/admin");
        return;
      }
      setError(saveError.message || "Unable to save special occasions.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!adminToken) return null;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/" aria-label="Binge N Bliss home">
          <img src="/landing_page/logo.jpg" alt="Binge N Bliss" />
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
          <a href="/lucky-draw">Customer site</a>
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
              Add or remove choices in the registration dropdown. Changes take
              effect after you save.
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
                  disabled={isSaving || celebrationOccasions.length >= 20}
                  onChange={(event) => setNewOccasion(event.target.value)}
                />
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !newOccasion.trim() ||
                    celebrationOccasions.length >= 20 ||
                    celebrationOccasions.some(
                      (occasion) =>
                        occasion.toLocaleLowerCase() ===
                        newOccasion.trim().toLocaleLowerCase(),
                    )
                  }
                >
                  Add
                </button>
              </form>
              <ul className="admin-occasion-list">
                {celebrationOccasions.map((occasion) => (
                  <li key={occasion}>
                    <span>{occasion}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${occasion}`}
                      disabled={isSaving || celebrationOccasions.length <= 1}
                      onClick={() => {
                        setCelebrationOccasions((current) =>
                          current.filter((item) => item !== occasion),
                        );
                        setError("");
                        setStatusMessage("");
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className="admin-save-occasions"
                type="button"
                disabled={
                  isSaving ||
                  celebrationOccasions.length < 1 ||
                  !hasUnsavedChanges
                }
                onClick={handleSaveOccasions}
              >
                {isSaving ? "Saving occasions..." : "Save occasions"}
              </button>
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
