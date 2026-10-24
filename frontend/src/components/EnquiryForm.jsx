import { useState } from "react";
import "./Enquiryform.css";

function EnquiryForm({
  triggerLabel = "Enquiry Form",
  triggerClassName = "lucky-draw-nav-button",
  onOpen,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    eventType: "",
    eventDate: "",
    guests: "",
    requirements: "",
  });

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function closeForm() {
    setIsOpen(false);
    setMessage("");
  }

  async function handleSubmit(event) {
  event.preventDefault();

  try {
    setMessage("Submitting enquiry...");

    const response = await fetch(
  "http://localhost:4000/api/enquiries",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  }
 );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to submit enquiry."
      );
    }

setIsOpen(false);
setIsSuccessOpen(true);

setForm({
  name: "",
  phone: "",
  eventType: "",
  eventDate: "",
  guests: "",
  requirements: "",
});

setMessage("");

  } catch (error) {
    console.error("Enquiry submission error:", error);
    setMessage(
      error.message || "Unable to submit enquiry. Please try again."
    );
  }
}

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          setIsOpen(true);
          onOpen?.();
        }}
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="enquiry-overlay" onClick={closeForm}>
          <div
            className="enquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="enquiry-close"
              onClick={closeForm}
              aria-label="Close enquiry form"
            >
              ×
            </button>

            <h2 id="enquiry-title">Plan Your Event</h2>
            <p>Tell us about your event. We'd love to help!</p>

            <form onSubmit={handleSubmit}>
              <label>
                Your Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  placeholder="Enter your name"
                />
              </label>

              <label>
                Phone Number *
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField}
                  required
                  placeholder="Enter your phone number"
                />
              </label>

              <label>
                Event Type *
                <select
                  name="eventType"
                  value={form.eventType}
                  onChange={updateField}
                  required
                >
                  <option value="">Select event type</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Event Date
                <input
                  name="eventDate"
                  type="date"
                  value={form.eventDate}
                  onChange={updateField}
                />
              </label>

              <label>
                Number of Guests
                <input
                  name="guests"
                  type="number"
                  min="1"
                  value={form.guests}
                  onChange={updateField}
                  placeholder="Expected guest count"
                />
              </label>


              <label>
                Additional Requirements
                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={updateField}
                  placeholder="Tell us what you need..."
                  rows="3"
                />
              </label>

              <button type="submit" className="enquiry-submit">
                Submit Enquiry
              </button>

              {message && <p role="status">{message}</p>}
            </form>
          </div>
                </div>
      )}

      {isSuccessOpen && (
        <div
          className="success-overlay"
          onClick={() => setIsSuccessOpen(false)}
        >
          <div
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="success-icon">✓</div>

            <h2 id="success-title">Enquiry Submitted!</h2>

            <p>
              Thank you for choosing Bling N Bliss.
              Your enquiry details have been submitted successfully.
            </p>

            <button
              type="button"
              className="success-button"
              onClick={() => setIsSuccessOpen(false)}
            >
              OK, Thank You
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export default EnquiryForm;