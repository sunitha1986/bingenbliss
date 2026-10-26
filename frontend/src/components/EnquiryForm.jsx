import { useState } from "react";
import "./Enquiryform.css";

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatEventDate(value) {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function EnquiryForm({
  triggerLabel = "Enquiry Form",
  triggerClassName = "lucky-draw-nav-button",
  onOpen,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const minimumEventDate = getLocalDateValue();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart());
  const [form, setForm] = useState({
    name: "",
    phone: "",
    eventType: "",
    eventDate: "",
    guests: "",
    requirements: "",
  });
  const currentMonth = getMonthStart();
  const daysInVisibleMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstWeekday = visibleMonth.getDay();
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const previousMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1,
  );
  const canGoToPreviousMonth = previousMonth >= currentMonth;
  const calendarDays = Array.from(
    { length: daysInVisibleMonth },
    (_, index) => {
      const day = index + 1;
      const date = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        day,
      );
      return {
        date,
        day,
        dateValue: getLocalDateValue(date),
      };
    },
  );

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "eventDate" && value && value < minimumEventDate) {
      setForm((previous) => ({ ...previous, eventDate: "" }));
      setMessage("Please choose today or a future event date.");
      return;
    }
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
  }

  function closeForm() {
    setIsOpen(false);
    setMessage("");
  }

  async function handleSubmit(event) {
  event.preventDefault();

  if (form.eventDate && form.eventDate < minimumEventDate) {
    setMessage("Please choose today or a future event date.");
    return;
  }

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
          setForm((previous) => ({
            ...previous,
            eventDate:
              previous.eventDate && previous.eventDate < minimumEventDate
                ? ""
                : previous.eventDate,
          }));
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
                <div className="enquiry-date-picker">
                  <button
                    aria-controls="enquiry-event-date-calendar"
                    aria-expanded={isDatePickerOpen}
                    className="enquiry-date-trigger"
                    onClick={() => {
                      const selectedDate =
                        form.eventDate && form.eventDate >= minimumEventDate
                          ? parseLocalDate(form.eventDate)
                          : new Date();
                      setVisibleMonth(getMonthStart(selectedDate));
                      setIsDatePickerOpen((isVisible) => !isVisible);
                    }}
                    type="button"
                  >
                    {form.eventDate
                      ? formatEventDate(form.eventDate)
                      : "Choose an upcoming date"}
                  </button>
                  {isDatePickerOpen && (
                    <div
                      className="enquiry-date-calendar"
                      id="enquiry-event-date-calendar"
                      role="group"
                      aria-label="Choose an event date"
                    >
                      <div className="enquiry-date-calendar-header">
                        <button
                          aria-label="Previous month"
                          disabled={!canGoToPreviousMonth}
                          onClick={() =>
                            setVisibleMonth(previousMonth)
                          }
                          type="button"
                        >
                          ‹
                        </button>
                        <strong>{monthLabel}</strong>
                        <button
                          aria-label="Next month"
                          onClick={() =>
                            setVisibleMonth(
                              new Date(
                                visibleMonth.getFullYear(),
                                visibleMonth.getMonth() + 1,
                                1,
                              ),
                            )
                          }
                          type="button"
                        >
                          ›
                        </button>
                      </div>
                      <div
                        className="enquiry-date-calendar-grid"
                        role="grid"
                        aria-label={monthLabel}
                      >
                        {weekdayLabels.map((weekday) => (
                          <span
                            className="enquiry-date-weekday"
                            key={weekday}
                            role="columnheader"
                          >
                            {weekday}
                          </span>
                        ))}
                        {Array.from({ length: firstWeekday }, (_, index) => (
                          <span
                            aria-hidden="true"
                            className="enquiry-date-empty"
                            key={`empty-${index}`}
                          />
                        ))}
                        {calendarDays.map(({ date, day, dateValue }) => {
                          const isPastDate = dateValue < minimumEventDate;
                          return (
                            <button
                              aria-label={date.toLocaleDateString(undefined, {
                                dateStyle: "full",
                              })}
                              aria-pressed={form.eventDate === dateValue}
                              className={[
                                isPastDate ? "is-disabled" : "",
                                form.eventDate === dateValue ? "is-selected" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              disabled={isPastDate}
                              key={dateValue}
                              onClick={() => {
                                setForm((previous) => ({
                                  ...previous,
                                  eventDate: dateValue,
                                }));
                                setMessage("");
                                setIsDatePickerOpen(false);
                              }}
                              type="button"
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <input
                    name="eventDate"
                    type="hidden"
                    value={form.eventDate}
                  />
                </div>
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