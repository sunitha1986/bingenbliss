import { useEffect, useRef, useState } from "react";
import { getAdminEnquiries } from "../services/api";

const acknowledgedEnquiriesKey = "bnb-admin-acknowledged-enquiries";

function readAcknowledgedEnquiryIds() {
  const storedIds = window.localStorage.getItem(acknowledgedEnquiriesKey);
  if (!storedIds) return new Set();

  try {
    const parsedIds = JSON.parse(storedIds);
    if (!Array.isArray(parsedIds)) {
      throw new Error("Stored enquiry notification data is invalid.");
    }
    return new Set(parsedIds.map(String));
  } catch (error) {
    console.error("Unable to read acknowledged enquiry notifications:", error);
    return new Set();
  }
}

function AdminEnquiriesLink({ active = false }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const hasLoggedError = useRef(false);
  const currentNewIds = useRef(new Set());

  useEffect(() => {
    let isMounted = true;
    let isLoading = false;

    const loadNewCount = async () => {
      if (isLoading) return;
      const token = window.localStorage.getItem("bnb-admin-token") || "";
      if (!token) return;

      isLoading = true;
      try {
        const result = await getAdminEnquiries(token);
        if (!Array.isArray(result.enquiries)) {
          throw new Error("The server returned invalid enquiry data.");
        }
        if (isMounted) {
          const newIds = new Set(
            result.enquiries
              .filter((enquiry) => enquiry.status === "New")
              .map((enquiry) => String(enquiry.id)),
          );
          currentNewIds.current = newIds;
          const acknowledgedIds = readAcknowledgedEnquiryIds();
          const relevantAcknowledgedIds = new Set(
            [...acknowledgedIds].filter((id) => newIds.has(id)),
          );
          if (relevantAcknowledgedIds.size !== acknowledgedIds.size) {
            window.localStorage.setItem(
              acknowledgedEnquiriesKey,
              JSON.stringify([...relevantAcknowledgedIds]),
            );
          }
          const unreadIds = [...newIds].filter(
            (id) => !relevantAcknowledgedIds.has(id),
          );
          setUnreadCount(unreadIds.length);
          setError("");
          hasLoggedError.current = false;
        }
      } catch (requestError) {
        if (!isMounted) return;
        if (requestError.message === "Admin access is required") {
          window.localStorage.removeItem("bnb-admin-token");
          window.location.replace("/admin");
          return;
        }
        if (!hasLoggedError.current) {
          console.error("Enquiry notification error:", requestError);
          hasLoggedError.current = true;
        }
        setError(requestError.message || "Unable to refresh new enquiries.");
      } finally {
        isLoading = false;
      }
    };

    loadNewCount();
    const intervalId = window.setInterval(loadNewCount, 30000);
    window.addEventListener("focus", loadNewCount);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadNewCount);
    };
  }, []);

  const acknowledgeNewEnquiries = () => {
    try {
      const acknowledgedIds = readAcknowledgedEnquiryIds();
      for (const id of currentNewIds.current) {
        acknowledgedIds.add(id);
      }
      window.localStorage.setItem(
        acknowledgedEnquiriesKey,
        JSON.stringify([...acknowledgedIds]),
      );
      setUnreadCount(0);
    } catch (storageError) {
      console.error("Unable to acknowledge enquiry notifications:", storageError);
      setError("Unable to clear enquiry notifications in this browser.");
    }
  };

  const linkClassName = [
    "admin-enquiries-link",
    active && "is-active",
    unreadCount > 0 && "has-new",
    unreadCount > 0 && "is-ringing",
    error && "has-error",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      className={linkClassName}
      href="/admin/enquiries"
      onClick={acknowledgeNewEnquiries}
      aria-current={active ? "page" : undefined}
      aria-label={
        error
          ? "Enquiries, notification state unavailable"
          : `${unreadCount} unread new enquiries`
      }
      title={error || undefined}
    >
      <span>Enquiries</span>
      {error ? (
        <span className="admin-enquiries-badge" aria-hidden="true">
          !
        </span>
      ) : (
        <span className="admin-enquiries-bell" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && <span className="admin-enquiries-dot" />}
        </span>
      )}
    </a>
  );
}

export default AdminEnquiriesLink;
