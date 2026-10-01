import LandingPage from "./pages/LandingPage";
import AdminLuckyDraw from "./pages/AdminLuckyDraw";
import AdminCustomers from "./pages/AdminCustomers";
import LuckyDraw from "./pages/LuckyDraw";
import WinnerHistory from "./pages/WinnerHistory";

function App() {
  const adminToken = window.localStorage.getItem("bnb-admin-token");

  if (
    window.location.pathname === "/admin/lucky-draw" ||
    window.location.pathname === "/admin/customers" ||
    window.location.pathname === "/admin/winner-history" ||
    (window.location.pathname === "/" && adminToken)
  ) {
    if (window.location.pathname === "/admin/customers") {
      return <AdminCustomers />;
    }
    if (window.location.pathname === "/admin/winner-history") {
      return <WinnerHistory />;
    }
    return <AdminLuckyDraw />;
  }

  if (window.location.pathname === "/lucky-draw") return <LuckyDraw />;
  return <LandingPage />;
}

export default App;
