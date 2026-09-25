import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../App.css";

const dummyLuckyDrawEntries = [
  {
    id: "dummy-1",
    name: "Aarav Sharma",
    phone: "9876543210",
    dob: "1995-04-12",
  },
  {
    id: "dummy-2",
    name: "Diya Kapoor",
    phone: "9123456780",
    dob: "1998-09-23",
  },
  {
    id: "dummy-3",
    name: "Kabir Mehta",
    phone: "9988776655",
    dob: "1992-01-08",
  },
];

function LuckyDraw() {
  const [luckyDrawEntries, setLuckyDrawEntries] = useState(() => {
    const savedEntries = window.localStorage.getItem("bnb-lucky-draw-entries");
    return savedEntries ? JSON.parse(savedEntries) : dummyLuckyDrawEntries;
  });
  const [luckyDrawForm, setLuckyDrawForm] = useState({
    name: "",
    phone: "",
    dob: "",
  });
  const [luckyDrawWinner, setLuckyDrawWinner] = useState(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawDay = new Date().getDate() === 1;

  const updateLuckyDrawField = (field, value) => {
    setLuckyDrawForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleLuckyDrawSubmit = (event) => {
    event.preventDefault();
    const entry = { id: crypto.randomUUID(), ...luckyDrawForm };
    const updatedEntries = [...luckyDrawEntries, entry];
    setLuckyDrawEntries(updatedEntries);
    window.localStorage.setItem(
      "bnb-lucky-draw-entries",
      JSON.stringify(updatedEntries),
    );
    setLuckyDrawForm({ name: "", phone: "", dob: "" });
  };

  const drawLuckyWinner = () => {
    if (!luckyDrawEntries.length || isDrawing) return;
    const winnerIndex = Math.floor(Math.random() * luckyDrawEntries.length);
    const segmentSize = 360 / luckyDrawEntries.length;
    const targetRotation =
      wheelRotation +
      1440 +
      (360 - winnerIndex * segmentSize - segmentSize / 2);
    setIsDrawing(true);
    setWheelRotation(targetRotation);
    window.setTimeout(() => {
      setLuckyDrawWinner(luckyDrawEntries[winnerIndex]);
      setShowWinnerPopup(true);
      setIsDrawing(false);
    }, 4200);
  };

  return (
    <main className="site-shell">
      <Navbar standalone />
      <section className="lucky-draw-section" id="lucky-draw">
        <div className="lucky-draw-heading">
          <p className="eyebrow dark">Monthly surprise</p>
          <h1>
            One lucky name.
            <br />
            <em>A little extra bliss.</em>
          </h1>
          <p>
            Join our monthly draw by sharing your details. The winner is picked
            on the 1st of every month.
          </p>
        </div>
        <div className="lucky-draw-layout">
          <form className="lucky-draw-form" onSubmit={handleLuckyDrawSubmit}>
            <label htmlFor="lucky-draw-name">Name</label>
            <input
              id="lucky-draw-name"
              type="text"
              value={luckyDrawForm.name}
              onChange={(event) =>
                updateLuckyDrawField("name", event.target.value)
              }
              placeholder="Your full name"
              required
            />
            <label htmlFor="lucky-draw-phone">Phone number</label>
            <input
              id="lucky-draw-phone"
              type="tel"
              pattern="[0-9]{10}"
              value={luckyDrawForm.phone}
              onChange={(event) =>
                updateLuckyDrawField("phone", event.target.value)
              }
              placeholder="10-digit phone number"
              required
            />
            <label htmlFor="lucky-draw-dob">Date of birth</label>
            <input
              id="lucky-draw-dob"
              type="date"
              value={luckyDrawForm.dob}
              onChange={(event) =>
                updateLuckyDrawField("dob", event.target.value)
              }
              required
            />
            <button className="dark-button" type="submit">
              Enter the draw <span>↗</span>
            </button>
          </form>
          <div className="lucky-draw-wheel-panel">
            <div className="lucky-draw-wheel-wrap">
              <span className="wheel-pointer" aria-hidden="true"></span>
              <div
                className="lucky-draw-wheel"
                style={{ transform: `rotate(${wheelRotation}deg)` }}
                aria-label="Lucky draw wheel"
              >
                {luckyDrawEntries.map((entry, index) => (
                  <span
                    className="wheel-label"
                    key={entry.id}
                    style={{
                      "--label-angle": `${index * (360 / luckyDrawEntries.length)}deg`,
                    }}
                  >
                    {entry.name}
                  </span>
                ))}
                <span className="wheel-center">BNB</span>
              </div>
            </div>
            <div className="lucky-draw-result" aria-live="polite">
              <span>
                {isDrawDay ? "Draw day is here" : "Next draw: 1st of the month"}
              </span>
              <strong>
                {luckyDrawWinner ? luckyDrawWinner.name : "Ready when you are"}
              </strong>
            </div>
            <button
              className="draw-button"
              disabled={isDrawing || !luckyDrawEntries.length}
              onClick={drawLuckyWinner}
              type="button"
            >
              {isDrawing ? "Spinning..." : "Spin the wheel"}
            </button>
            <small>
              {luckyDrawEntries.length} entries in this month&apos;s draw
            </small>
          </div>
        </div>
      </section>
      <Footer standalone />
      {showWinnerPopup && luckyDrawWinner && (
        <div
          className="winner-popup-backdrop"
          onClick={() => setShowWinnerPopup(false)}
          role="presentation"
        >
          <div
            className="winner-popup"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-popup-title"
          >
            <button
              className="winner-popup-close"
              onClick={() => setShowWinnerPopup(false)}
              type="button"
              aria-label="Close winner announcement"
            >
              ×
            </button>
            <span className="winner-spark" aria-hidden="true">
              ✦
            </span>
            <p className="eyebrow dark">This month&apos;s lucky winner</p>
            <h2 id="winner-popup-title">Congratulations!</h2>
            <p className="winner-name">{luckyDrawWinner.name}</p>
            <p className="winner-message">
              Your BNB moment just got a little more magical.
            </p>
            <button
              className="dark-button"
              onClick={() => setShowWinnerPopup(false)}
              type="button"
            >
              Lovely <span>✓</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default LuckyDraw;
