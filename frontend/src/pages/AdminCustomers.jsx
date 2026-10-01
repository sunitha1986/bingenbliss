import { useEffect, useState } from "react";
import {
  deleteAdminCustomer,
  getAdminCustomers,
  updateAdminCustomer,
} from "../services/api";
import "../App.css";

function AdminCustomers() {
  const [adminToken] = useState(
    () => window.localStorage.getItem("bnb-admin-token") || "",
  );
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", dob: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = async () => {
    if (!adminToken) {
      setError("Admin access is required. Sign in from the customer site.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await getAdminCustomers(adminToken);
      setCustomers(result.customers);
    } catch (requestError) {
      if (requestError.message === "Admin access is required") {
        window.localStorage.removeItem("bnb-admin-token");
        window.location.href = "/";
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

  const startEditing = (customer) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.Name,
      phone: String(customer.Phone),
      dob: customer["Date of birth"],
    });
    setError("");
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    try {
      const result = await updateAdminCustomer(adminToken, editingId, editForm);
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === editingId ? result.customer : customer,
        ),
      );
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to update customer");
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

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/" aria-label="Binge N Bliss home">
          <img src="/landing_page/logo.jpg" alt="Binge N Bliss" />
          <span>BNB admin</span>
        </a>
        <nav className="admin-nav">
          <a href="/admin/lucky-draw">Spin wheel</a>
          <a className="is-active" href="/admin/customers">
            Customers
          </a>
          <a href="/admin/winner-history">Winner history</a>
          <a href="/lucky-draw">Customer site</a>
        </nav>
        <button
          className="admin-signout"
          onClick={() => {
            window.localStorage.removeItem("bnb-admin-token");
            window.location.href = "/";
          }}
          type="button"
        >
          Sign out
        </button>
      </aside>
      <section className="admin-main admin-customers-main">
        <div className="admin-page-heading">
          <p className="eyebrow">Customer records</p>
          <h1>Lucky draw entries.</h1>
          <p>
            Review and maintain customer entries stored in the online database.
          </p>
        </div>
        {error && (
          <p className="form-error admin-page-error" role="alert">
            {error}
          </p>
        )}
        {isLoading ? (
          <p className="admin-loading">Loading customer records...</p>
        ) : (
          <div className="admin-customer-table-wrap">
            <table className="admin-customer-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>WhatsApp</th>
                  <th>Occasion</th>
                  <th>Date</th>
                  <th>Guests</th>
                  <th>Consent</th>
                  <th>Submitted at</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    {editingId === customer.id ? (
                      <td colSpan="8">
                        <form
                          className="admin-edit-form"
                          onSubmit={saveCustomer}
                        >
                          <input
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            aria-label="Customer name"
                            required
                          />
                          <input
                            value={editForm.phone}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                phone: event.target.value,
                              }))
                            }
                            aria-label="Customer phone"
                            pattern="[0-9]{10}"
                            required
                          />
                          <input
                            type="date"
                            value={editForm.dob}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                dob: event.target.value,
                              }))
                            }
                            aria-label="Customer date of birth"
                            required
                          />
                          <button className="table-action save" type="submit">
                            Save
                          </button>
                          <button
                            className="table-action"
                            onClick={() => setEditingId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td>{customer.Name}</td>
                        <td>{customer.Phone}</td>
                        <td>{customer.Occasion || "-"}</td>
                        <td>
                          {customer["Celebration date"] ||
                            customer["Date of birth"] ||
                            "-"}
                        </td>
                        <td>{customer.Guests ?? "-"}</td>
                        <td>{customer.Consent || "Yes"}</td>
                        <td>{customer["Submitted at"]}</td>
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
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!customers.length && (
              <p className="admin-loading">No customers found.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminCustomers;
