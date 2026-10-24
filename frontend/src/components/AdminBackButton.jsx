import { useNavigate } from "react-router-dom";

function AdminBackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (Number(window.history.state?.idx) > 0) {
      navigate(-1);
      return;
    }
    navigate("/admin/spin-wheel");
  };

  return (
    <button
      className="admin-back-button"
      onClick={handleBack}
      type="button"
      aria-label="Go back"
      title="Go back"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 12H5m0 0 7-7m-7 7 7 7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

export default AdminBackButton;
