import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteAdminCustomer,
  getAdminCustomers,
  getLuckyDrawStatus,
  updateAdminCustomer,
} from "../services/api";
import AdminEnquiriesLink from "../components/AdminEnquiriesLink";
import { createCustomerWorkbook } from "../utils/customerWorkbook.js";
import logoImg from "../assets/landing_page/logo.jpg";
import "../App.css";

function getCurrentMonthValue() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    })
      .formatToParts(new Date())
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}`;
}

function getCelebrationMonth(customer) {
  const celebrationDate =
    customer["Celebration date"] || customer["Date of birth"] || "";
  return String(celebrationDate).match(/^\d{4}-\d{2}/)?.[0] || "";
}

function getRegistrationMonth(customer) {
  const submittedAt = customer["Submitted at"] || customer.submittedAt || "";
  return String(submittedAt).match(/^\d{4}-\d{2}/)?.[0] || "";
}

function getRecentMonthValues(count = 12) {
  const [year, month] = getCurrentMonthValue().split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - count + index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

function normalizeCustomerPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function formatMonth(value) {
  if (!value) return "all months";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function toLocalDateTimeInput(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AdminCustomers() {
  const [adminToken] = useState(
    () => window.localStorage.getItem("bnb-admin-token") || "",
  );
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [configuredOccasions, setConfiguredOccasions] = useState([]);
  const [occasionLoadError, setOccasionLoadError] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const editDialogRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [occasionFilter, setOccasionFilter] = useState("");
  const [celebrationMonth, setCelebrationMonth] =
    useState(getCurrentMonthValue);
  const [showMonthlyChart, setShowMonthlyChart] = useState(false);
  const [monthlyChartType, setMonthlyChartType] = useState("events");

  const occasions = useMemo(
    () =>
      [...new Set(customers.map((customer) => customer.Occasion).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second)),
    [customers],
  );
  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    return customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        [customer.Name, customer.Phone, customer.Occasion].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(normalizedSearch),
        );
      const matchesOccasion =
        !occasionFilter || customer.Occasion === occasionFilter;
      return (
        matchesSearch &&
        matchesOccasion &&
        (!celebrationMonth ||
          getCelebrationMonth(customer) === celebrationMonth)
      );
    });
  }, [celebrationMonth, customers, occasionFilter, searchTerm]);
  const matchingPeopleCount = useMemo(() => {
    const phoneNumbers = new Set();
    let customersWithoutPhone = 0;
    for (const customer of filteredCustomers) {
      const phone = normalizeCustomerPhone(customer.Phone || customer.phone);
      if (phone) {
        phoneNumbers.add(phone);
      } else {
        customersWithoutPhone += 1;
      }
    }
    return phoneNumbers.size + customersWithoutPhone;
  }, [filteredCustomers]);
  const monthlyChartCounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    const chartCustomers = customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        [customer.Name, customer.Phone, customer.Occasion].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(normalizedSearch),
        );
      return matchesSearch && (!occasionFilter || customer.Occasion === occasionFilter);
    });
    const counts = new Map();
    for (const customer of chartCustomers) {
      const category =
        monthlyChartType === "occasions"
          ? String(customer.Occasion || "").trim() || "Unspecified"
          : monthlyChartType === "registrations"
            ? getRegistrationMonth(customer)
            : getCelebrationMonth(customer);
      if (category) counts.set(category, (counts.get(category) || 0) + 1);
    }
    if (monthlyChartType === "occasions") {
      return [...counts.entries()]
        .sort(([firstLabel], [secondLabel]) =>
          firstLabel.localeCompare(secondLabel),
        )
        .map(([occasion, count]) => ({
          key: occasion,
          label: occasion,
          count,
        }));
    }
    return getRecentMonthValues().map((month) => ({
      key: month,
      label: formatMonth(month),
      count: counts.get(month) || 0,
    }));
  }, [customers, monthlyChartType, occasionFilter, searchTerm]);
  const maxMonthlyChartCount = Math.max(
    1,
    ...monthlyChartCounts.map(({ count }) => count),
  );

  const loadCustomers = async () => {
    if (!adminToken) {
      window.location.replace("/admin");
      return;
    }

    try {
      const result = await getAdminCustomers(adminToken);
      setCustomers(result.customers);
      try {
        const status = await getLuckyDrawStatus();
        setConfiguredOccasions(
          Array.isArray(status.celebrationOccasions)
            ? status.celebrationOccasions
            : [],
        );
        setOccasionLoadError("");
      } catch (occasionError) {
        setOccasionLoadError(
          `Occasions could not be loaded: ${
            occasionError.message || "Unknown error"
          }`,
        );
      }
    } catch (requestError) {
      if (requestError.message === "Admin access is required") {
        window.localStorage.removeItem("bnb-admin-token");
        window.location.replace("/admin");
        return;
      }
      setError(requestError.message || "Unable to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;
    if (editingId && !dialog.open) dialog.showModal();
    if (!editingId && dialog.open) dialog.close();
  }, [editingId]);

  const startEditing = (customer) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.Name,
      phone: String(customer.Phone),
      occasion: customer.Occasion || "",
      celebrationDate:
        customer["Celebration date"] || customer["Date of birth"] || "",
      guests: String(customer.Guests ?? 1),
      consent: customer.Consent || "Yes",
      submittedAt: toLocalDateTimeInput(
        customer["Submitted at"] || customer.submittedAt,
      ),
    });
    setError("");
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    setIsSavingCustomer(true);
    setError("");
    try {
      const result = await updateAdminCustomer(adminToken, editingId, {
        ...editForm,
        dob: editForm.celebrationDate,
        submittedAt: new Date(editForm.submittedAt).toISOString(),
      });
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === editingId ? result.customer : customer,
        ),
      );
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to update customer");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const removeCustomer = async (customerId) => {
    if (!window.confirm("Delete this customer from the lucky draw?")) return;
    try {
      await deleteAdminCustomer(adminToken, customerId);
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete customer");
    }
  };

  const exportCustomers = () => {
    try {
      const workbook = createCustomerWorkbook(filteredCustomers);
      const url = URL.createObjectURL(
        new Blob([workbook], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `customer-records-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError) {
      setError(exportError.message || "Unable to export customer records");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setOccasionFilter("");
    setCelebrationMonth("");
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/" aria-label="Binge N Bliss home">
          <img src={logoImg} alt="Binge N Bliss" />
          <span>BNB admin</span>
        </a>
        <nav className="admin-nav">
          <a href="/admin">Spin wheel</a>
          <a href="/admin/occasions">Special occasions</a>
          <a className="is-active" href="/admin/customers">
            Customers
          </a>
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
      <section className="admin-main admin-customers-main">
        <div className="admin-page-heading">
          <div className="admin-customers-heading-copy">
            <p className="eyebrow">Customer management</p>
            <h1>Customer records</h1>
            <p>
              Review and maintain customer entries stored in the online
              database.
            </p>
          </div>
          {!isLoading && !error && (
            <div
              className="admin-customers-count"
              aria-label={`${customers.length} customer entries`}
            >
              <span>Total entries</span>
              <strong>{customers.length}</strong>
            </div>
          )}
        </div>
        {error && (
          <div className="admin-customers-error" role="alert">
            <p>{error}</p>
            {!adminToken && (
              <a href="/lucky-draw">
                Go to customer sign-in <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="admin-customers-state" role="status">
            <span className="admin-customers-spinner" aria-hidden="true" />
            <p>Loading customer records...</p>
          </div>
        ) : !error ? (
          <div className="admin-customer-card">
            <div className="admin-customer-card-heading">
              <div>
                <h2>Lucky draw entries</h2>
                <p>Customer details and registration information</p>
              </div>
              <span className="admin-customer-total">
                Showing {filteredCustomers.length} of {customers.length}
              </span>
            </div>
            {customers.length ? (
              <>
                <div className="admin-customer-filters">
                  <label>
                    Search
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Name, phone, or occasion"
                    />
                  </label>
                  <label>
                    Occasion
                    <select
                      value={occasionFilter}
                      onChange={(event) => setOccasionFilter(event.target.value)}
                    >
                      <option value="">All occasions</option>
                      {occasions.map((occasion) => (
                        <option key={occasion} value={occasion}>
                          {occasion}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Celebration month
                    <input
                      type="month"
                      value={celebrationMonth}
                      onChange={(event) =>
                        setCelebrationMonth(event.target.value)
                      }
                    />
                  </label>
                  <div className="admin-customer-filter-actions">
                    <button
                      className="admin-customer-export"
                      disabled={!filteredCustomers.length}
                      onClick={exportCustomers}
                      type="button"
                    >
                      Download Excel
                    </button>
                    <button
                      className="admin-customer-clear-filters"
                      disabled={
                        !searchTerm &&
                        !occasionFilter &&
                        !celebrationMonth
                      }
                      onClick={clearFilters}
                      type="button"
                    >
                      Clear filters
                    </button>
                    <button
                      className="admin-customer-clear-filters"
                      aria-expanded={showMonthlyChart}
                      aria-controls="admin-customer-monthly-chart"
                      onClick={() => setShowMonthlyChart((shown) => !shown)}
                      type="button"
                    >
                      {showMonthlyChart
                        ? "Hide monthly chart"
                        : "Show monthly chart"}
                    </button>
                  </div>
                </div>
                {showMonthlyChart && (
                  <figure
                    className="admin-customer-monthly-chart"
                    id="admin-customer-monthly-chart"
                    aria-label="Monthly customer activity for the last 12 months"
                  >
                    <figcaption>
                      {monthlyChartType === "registrations"
                        ? "Registrations per month"
                        : monthlyChartType === "occasions"
                          ? "Entries per occasion"
                          : "Events per month"}
                      <span>
                        {monthlyChartType === "occasions"
                          ? "Grouped by occasion"
                          : `Based on ${
                              monthlyChartType === "registrations"
                                ? "registration date"
                                : "celebration date"
                            }`}
                        {searchTerm || occasionFilter
                          ? " and current search/occasion filters."
                          : "."}
                      </span>
                    </figcaption>
                    <label className="admin-customer-chart-type">
                      Chart data
                      <select
                        value={monthlyChartType}
                        onChange={(event) =>
                          setMonthlyChartType(event.target.value)
                        }
                      >
                        <option value="events">Events by celebration month</option>
                        <option value="registrations">
                          Registrations by registration month
                        </option>
                        <option value="occasions">Entries by occasion</option>
                      </select>
                    </label>
                    <div
                      className="admin-customer-monthly-chart-bars"
                      style={{
                        gridTemplateColumns: `repeat(${monthlyChartCounts.length}, minmax(64px, 1fr))`,
                      }}
                    >
                      {monthlyChartCounts.map(({ key, label, count }) => (
                        <div
                          className="admin-customer-monthly-chart-column"
                          key={key}
                          aria-label={`${label}: ${count} ${
                            monthlyChartType === "registrations"
                              ? "registrations"
                              : "events"
                          }`}
                        >
                          <strong>{count}</strong>
                          <div className="admin-customer-monthly-chart-track">
                            <span
                              style={{
                                height: `${(count / maxMonthlyChartCount) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="admin-customer-monthly-chart-label">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </figure>
                )}
                <p className="admin-customer-month-count" role="status">
                  {celebrationMonth ? (
                    <>
                      <strong>{matchingPeopleCount}</strong>{" "}
                      {matchingPeopleCount === 1
                        ? "customer has"
                        : "customers have"}{" "}
                      a celebration date in{" "}
                      <strong>{formatMonth(celebrationMonth)}</strong>
                      {searchTerm || occasionFilter
                        ? " matching the other filters."
                        : "."}
                    </>
                  ) : (
                    <>
                      <strong>{matchingPeopleCount}</strong>{" "}
                      {matchingPeopleCount === 1
                        ? "unique customer matches"
                        : "unique customers match"}{" "}
                      the current filters.
                    </>
                  )}
                </p>
                {filteredCustomers.length ? (
              <div className="admin-customer-table-wrap">
                  <table className="admin-customer-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>WhatsApp</th>
                        <th>Occasion</th>
                        <th>Occasion Date</th>
                        <th>Guests</th>
                        <th>Consent</th>
                        <th>Submitted at</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.Name}</td>
                          <td>{customer.Phone}</td>
                          <td>{customer.Occasion || "-"}</td>
                          <td>
                            {customer["Celebration date"] ||
                              customer["Date of birth"] ||
                              "-"}
                          </td>
                          <td>
                            <span className="admin-customer-guests">
                              {customer.Guests ?? "-"}
                            </span>
                          </td>
                          <td>
                            <span className="admin-consent-status">
                              {customer.Consent || "Yes"}
                            </span>
                          </td>
                          <td className="admin-submitted-at">
                            {customer["Submitted at"] || "-"}
                          </td>
                          <td className="table-actions">
                            <button
                              className="table-action"
                              onClick={() => startEditing(customer)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="table-action delete"
                              onClick={() => removeCustomer(customer.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
                ) : (
                  <div className="admin-customers-state admin-customers-empty">
                    <h3>No matching customers</h3>
                    <p>Change or clear the filters to see more records.</p>
                  </div>
                )}
                <dialog
                  className="admin-customer-edit-dialog"
                  onClose={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                  ref={editDialogRef}
                  aria-labelledby="admin-customer-edit-title"
                >
                  <form className="admin-edit-form" onSubmit={saveCustomer}>
                    <h2 id="admin-customer-edit-title">Edit customer entry</h2>
                    {error && <p className="admin-customers-error">{error}</p>}
                    {occasionLoadError && (
                      <p className="admin-customers-error" role="alert">
                        {occasionLoadError}
                      </p>
                    )}
                    <label>
                      Name
                      <input
                        value={editForm.name || ""}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      WhatsApp phone
                      <input
                        value={editForm.phone || ""}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        required
                      />
                    </label>
                    <label>
                      Occasion
                      <select
                        value={editForm.occasion || ""}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            occasion: event.target.value,
                          }))
                        }
                        required
                      >
                        <option value="" disabled>
                          Select an occasion
                        </option>
                        {editForm.occasion &&
                          !configuredOccasions.includes(editForm.occasion) && (
                            <option value={editForm.occasion}>
                              {editForm.occasion} (legacy)
                            </option>
                          )}
                        {configuredOccasions.map((occasion) => (
                          <option key={occasion} value={occasion}>
                            {occasion}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Occasion Date
                      <input
                        type="date"
                        value={editForm.celebrationDate || ""}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            celebrationDate: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Guests
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={editForm.guests || ""}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            guests: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Consent
                      <select
                        value={editForm.consent || ""}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            consent: event.target.value,
                          }))
                        }
                        required
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </label>
                    <label>
                      Registered at
                      <input
                        type="datetime-local"
                        value={editForm.submittedAt || ""}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            submittedAt: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <div className="admin-edit-dialog-actions">
                      <button
                        className="admin-customer-clear-filters"
                        onClick={() => setEditingId(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className="admin-customer-export"
                        disabled={isSavingCustomer}
                        type="submit"
                      >
                        {isSavingCustomer ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </form>
                </dialog>
              </>
            ) : (
              <div className="admin-customers-state admin-customers-empty">
                <span className="admin-customers-empty-icon" aria-hidden="true">
                  ✦
                </span>
                <h3>No customer entries yet</h3>
                <p>New lucky draw registrations will appear here.</p>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminCustomers;
