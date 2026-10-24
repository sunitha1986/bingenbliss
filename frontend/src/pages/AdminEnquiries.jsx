import { useEffect, useState } from "react";
import {
  getAdminEnquiries,
  updateAdminEnquiryStatus,
} from "../services/api";
import AdminEnquiriesLink from "../components/AdminEnquiriesLink";
import "../App.css";

const enquiryStatuses = ["New", "Contacted", "Converted", "Closed"];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  useEffect(() => {
    let isMounted = true;
    const token = window.localStorage.getItem("bnb-admin-token") || "";

    if (!token) {
      window.location.replace("/admin");
      return () => {
        isMounted = false;
      };
    }

    const loadEnquiries = async () => {
      try {
        const result = await getAdminEnquiries(token);
        if (!Array.isArray(result.enquiries)) {
          throw new Error("The server returned invalid enquiry data.");
        }
        if (isMounted) {
          setEnquiries(result.enquiries);
          setError("");
        }
      } catch (requestError) {
        if (!isMounted) return;
        if (requestError.message === "Admin access is required") {
          window.localStorage.removeItem("bnb-admin-token");
          window.location.replace("/admin");
          return;
        }
        setError(requestError.message || "Unable to load enquiries.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadEnquiries();
    const intervalId = window.setInterval(loadEnquiries, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const changeStatus = async (enquiry, status) => {
    const token = window.localStorage.getItem("bnb-admin-token") || "";
    const enquiryId = String(enquiry.id);
    setUpdatingIds((current) => new Set(current).add(enquiryId));
    setEnquiries((current) =>
      current.map((item) =>
        String(item.id) === enquiryId ? { ...item, status } : item,
      ),
    );
    setError("");

    try {
      await updateAdminEnquiryStatus(token, enquiry.id, status);
    } catch (requestError) {
      setEnquiries((current) =>
        current.map((item) =>
          String(item.id) === enquiryId
            ? { ...item, status: enquiry.status }
            : item,
        ),
      );
      if (requestError.message === "Admin access is required") {
        window.localStorage.removeItem("bnb-admin-token");
        window.location.replace("/admin");
        return;
      }
      setError(requestError.message || "Unable to update enquiry status.");
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(enquiryId);
        return next;
      });
    }
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/" aria-label="Binge N Bliss home">
          <img src="/landing_page/logo.jpg" alt="Binge N Bliss" />
          <span>BNB admin</span>
        </a>
        <nav className="admin-nav">
          <a href="/admin">Spin wheel</a>
          <a href="/admin/occasions">Special occasions</a>
          <a href="/admin/customers">Customers</a>
          <AdminEnquiriesLink active />
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

      <section className="admin-main admin-customers-main">
        <div className="admin-page-heading">
          <div className="admin-customers-heading-copy">
            <p className="eyebrow">Customer enquiries</p>
            <h1>Event enquiries</h1>
            <p>Review event requests submitted through the enquiry form.</p>
          </div>
          {!isLoading && !error && (
            <div
              className="admin-customers-count"
              aria-label={`${enquiries.length} enquiries`}
            >
              <span>Total enquiries</span>
              <strong>{enquiries.length}</strong>
            </div>
          )}
        </div>

        {error ? (
          <div className="admin-customers-error" role="alert">
            <p>{error}</p>
          </div>
        ) : null}
        {isLoading ? (
          <div className="admin-customers-state" role="status">
            <span className="admin-customers-spinner" aria-hidden="true" />
            <p>Loading enquiries...</p>
          </div>
        ) : !error || enquiries.length ? (
          <div className="admin-customer-card">
            <div className="admin-customer-card-heading">
              <div>
                <h2>Submitted enquiries</h2>
                <p>Most recent requests appear first.</p>
              </div>
              <span className="admin-customer-total">
                {enquiries.length} {enquiries.length === 1 ? "enquiry" : "enquiries"}
              </span>
            </div>
            {enquiries.length ? (
              <div className="admin-customer-table-wrap">
                <table className="admin-customer-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Event</th>
                      <th>Event date</th>
                      <th>Guests</th>
                      <th>Requirements</th>
                      <th>Status</th>
                      <th>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enquiry) => (
                      <tr key={enquiry.id}>
                        <td>{enquiry.name}</td>
                        <td>{enquiry.phone}</td>
                        <td>{enquiry.eventType}</td>
                        <td>{formatDate(enquiry.eventDate)}</td>
                        <td>{enquiry.guests || "—"}</td>
                        <td>{enquiry.requirements || "—"}</td>
                        <td>
                          <select
                            className={`admin-enquiry-status status-${String(
                              enquiry.status || "New",
                            ).toLowerCase()}`}
                            aria-label={`Status for ${enquiry.name}`}
                            value={enquiry.status || "New"}
                            disabled={updatingIds.has(String(enquiry.id))}
                            onChange={(event) =>
                              changeStatus(enquiry, event.target.value)
                            }
                          >
                            {enquiryStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{formatDate(enquiry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-customers-state">
                <p>No event enquiries have been submitted yet.</p>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminEnquiries;
