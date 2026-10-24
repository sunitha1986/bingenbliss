import "./LuckyDrawBanner.css";

function LuckyDrawBanner({
  titleFirst = "LUCKY",
  titleSecond = "DRAW",
  ctaText = "Enter Lucky Draw",
  ctaLink = "/lucky-draw",
  latestWinner,
  nextDrawDate,
  banner,
}) {
  const winner = latestWinner || banner?.winnerName || "To be announced";
  const winnerMonth = banner?.winnerMonth ? ` (${banner.winnerMonth})` : "";
  const drawDate =
    nextDrawDate || banner?.nextDrawDate || "Date to be announced";

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
            <div
              className="banner-headline"
              aria-label={`${titleFirst} ${titleSecond}`}
            >
              <span className="banner-lucky-sparkle" aria-hidden="true">
                ✦
              </span>
              <span className="banner-lucky">{titleFirst}</span>
              <span className="banner-draw">{titleSecond}</span>
            </div>
            <span className="banner-gift banner-gift-right" aria-hidden="true">
              <span className="banner-gift-bow" />
              <span className="banner-gift-lid" />
              <span className="banner-gift-box" />
            </span>
          </div>

          <div className="banner-announcements" aria-label="Announcements">
            <div className="banner-announcement-track">
              {[0, 1].map((copy) => (
                <span
                  className="banner-announcement-copy"
                  aria-hidden={copy === 1 ? "true" : undefined}
                  key={copy}
                >
                  <span>
                    <strong>Latest winner:</strong> {winner}
                    {winnerMonth}
                  </span>
                  <span
                    className="banner-star"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                  <span>
                    <strong>Next month's draw:</strong> {drawDate}
                  </span>
                  <span
                    className="banner-star"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                </span>

              ))}

                <span className="banner-announcement-star" aria-hidden="true">✦</span>
                <span>
                  <strong>Next draw date:</strong> {banner?.nextDrawDate || "Date to be announced"}
                </span>
                <span className="banner-announcement-star" aria-hidden="true">✦</span>
             
              <span className="banner-announcement-copy" aria-hidden="true">
                <span>
                  <strong>Latest winner:</strong> {banner?.winnerName || "To be announced"}
                  {banner?.winnerMonth && ` (${banner.winnerMonth})`}
                </span>
                <span className="banner-announcement-star">✦</span>
                <span>
                  <strong>Next draw date:</strong> {banner?.nextDrawDate || "Date to be announced"}
                </span>
                <span className="banner-announcement-star">✦</span>
              </span>

            </div>
          </div>

          <a
            className="banner-cta"
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ctaText === "Enter Lucky Draw" ? (
              <>
                ENTER LUCKY <span className="cta-sparkle" aria-hidden="true">✦</span> DRAW
              </>
            ) : (
              ctaText
            )}
          </a>

          <span className="ambient-sparkle spark-1" aria-hidden="true">
            ✦
          </span>
          <span className="ambient-sparkle spark-2" aria-hidden="true">
            ✦
          </span>
        </div>
      </div>
    </div>
  );
}

export default LuckyDrawBanner;
