import "./LuckyDrawBanner.css";

function LuckyDrawBanner({ banner }) {
  return (
    <div className="nav-draw-banner">
      <div className="nav-draw-banner-inner">
        <div className="banner-main-row">
          <div className="banner-title-cluster">
            <span className="banner-gift banner-gift-left" aria-hidden="true">
              <span className="banner-gift-bow" />
              <span className="banner-gift-lid" />
              <span className="banner-gift-box" />
            </span>
            <div className="banner-headline" aria-label="Lucky Draw">
              <span className="banner-lucky">LUCKY</span>
              <span className="banner-draw">DRAW</span>
            </div>
            <span className="banner-gift banner-gift-right" aria-hidden="true">
              <span className="banner-gift-bow" />
              <span className="banner-gift-lid" />
              <span className="banner-gift-box" />
            </span>
          </div>
          <div className="banner-announcements" aria-label="Lucky draw announcements">
            <div className="banner-announcement-track">
              <span className="banner-announcement-copy">
                <span>
                  <strong>Latest winner:</strong> {banner?.winnerName || "To be announced"}
                  {banner?.winnerMonth && ` (${banner.winnerMonth})`}
                </span>
                <span className="banner-announcement-star" aria-hidden="true">✦</span>
                <span>
                  <strong>Next month&apos;s draw:</strong> {banner?.nextDrawDate || "Date to be announced"}
                </span>
                <span className="banner-announcement-star" aria-hidden="true">✦</span>
              </span>
              <span className="banner-announcement-copy" aria-hidden="true">
                <span>
                  <strong>Latest winner:</strong> {banner?.winnerName || "To be announced"}
                  {banner?.winnerMonth && ` (${banner.winnerMonth})`}
                </span>
                <span className="banner-announcement-star">✦</span>
                <span>
                  <strong>Next month&apos;s draw:</strong> {banner?.nextDrawDate || "Date to be announced"}
                </span>
                <span className="banner-announcement-star">✦</span>
              </span>
            </div>
          </div>
          <a className="banner-cta" href="/lucky-draw" target="_blank" rel="noopener noreferrer">
            Enter Lucky Draw
          </a>
          <span className="banner-spark banner-spark-left" aria-hidden="true">✦</span>
          <span className="banner-spark banner-spark-mid-left" aria-hidden="true">✦</span>
          <span className="banner-spark banner-spark-mid-right" aria-hidden="true">✦</span>
          <span className="banner-spark banner-spark-right" aria-hidden="true">✦</span>
        </div>
      </div>
    </div>
  );
}

export default LuckyDrawBanner;