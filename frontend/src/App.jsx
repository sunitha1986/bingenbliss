import LandingPage from "./pages/LandingPage";
import LuckyDraw from "./pages/LuckyDraw";

function App() {
  return window.location.pathname === "/lucky-draw" ? (
    <LuckyDraw />
  ) : (
    <LandingPage />
  );
}

export default App;
