import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import FloatingContactActions from "./components/FloatingContactActions";
import AdminLuckyDraw from "./pages/AdminLuckyDraw";
import AdminCustomers from "./pages/AdminCustomers";
import AdminEnquiries from "./pages/AdminEnquiries";
import AdminOccasions from "./pages/AdminOccasions";
import LuckyDraw from "./pages/LuckyDraw";
import WinnerHistory from "./pages/WinnerHistory";
import { useLocation  } from "react-router-dom";

function App() {
  // const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    const { pathname: currentPath } = useLocation();
   const pathname = currentPath.replace(/\/+$/, "") || "/";
   
  const isAdminRoute =
    pathname === "/admin" ||
    pathname === "/admin/lucky-draw" ||
    pathname === "/admin/occasions" ||
    pathname === "/admin/customers" ||
    pathname === "/admin/enquiries" ||
    pathname === "/admin/winner-history";

  useEffect(() => {
    document.title = isAdminRoute
      ? "Binge & Bliss | Admin"
      : "Binge & Bliss | Party & Celebration Venues";
  }, [isAdminRoute]);

  if (isAdminRoute) {
    if (!window.localStorage.getItem("bnb-admin-token")) {
      return <AdminLuckyDraw />;
    }
    if (pathname === "/admin/customers") {
      return <AdminCustomers />;
    }
    if (pathname === "/admin/enquiries") {
      return <AdminEnquiries />;
    }
    if (pathname === "/admin/occasions") {
      return <AdminOccasions />;
    }
    if (pathname === "/admin/winner-history") {
      return <WinnerHistory />;
    }
    return <AdminLuckyDraw />;
  }

  if (pathname === "/lucky-draw") return <LuckyDraw />;
  return (
    <>
      <LandingPage />
      <FloatingContactActions />
    </>
  );
}

export default App;
