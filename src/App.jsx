import { useEffect } from 'react'
import './App.css'
import logo from '../BING-N-BISS-Img/logo.jpg'
import heroPhoto from '../heroIMG.jpg'
import birthdayImage from '../BING-N-BISS-Img/birthdayIMG.jpg'
import theaterImage from '../BING-N-BISS-Img/miniTheater.jph.jpg'
import photographyImage from '../BING-N-BISS-Img/photoGraphy.jpg'

function App() {
  useEffect(() => {
    const featureRows = document.querySelectorAll('.feature-row')
    if (!('IntersectionObserver' in window)) {
      featureRows.forEach((row) => row.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        } else {
          entry.target.classList.remove('is-visible')
        }
      })
    }, { rootMargin: '-8% 0px -8% 0px', threshold: [0, 0.15] })

    featureRows.forEach((row) => observer.observe(row))

    return () => {
      observer.disconnect()
    }
  }, [])


  return (
    <main className="site-shell" style={{ '--hero-photo': `url(${heroPhoto})` }}>
      <nav className="nav-bar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Binge N Bliss home">
          <img src={logo} alt="Binge N Bliss" />
        </a>
        <div className="nav-links">
          <a href="#top">Home</a>
          <a href="#events">Events</a>
          <a href="#gallery">Gallery</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero-section" id="top">
        <div className="snow-drizzle" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="floating-balloons" aria-hidden="true">
          <span className="floating-balloon balloon-pink"></span>
          <span className="floating-balloon balloon-chrome"></span>
          <span className="floating-balloon balloon-lilac"></span>
          <span className="floating-balloon balloon-copper"></span>
          <span className="floating-balloon balloon-silver"></span>
          <span className="floating-balloon balloon-rose"></span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot"></span>Make the moment yours</p>
          <h1>
            Let&apos;s Celebrate
            <span className="celebration-window" aria-live="off">
              <span className="celebration-track">
                {['Birthday parties', 'Anniversary days', 'Kitty parties', 'Private theatre', 'Mini theatre', 'Photography'].map((event) => (
                  <span className="celebration-event" key={event}>{event}</span>
                ))}
              </span>
            </span>
          </h1>
          <p className="hero-description">Beautiful spaces, thoughtful details, and a little more magic for every kind of gathering.</p>
        </div>
      </section>

      <section className="know-more-section" id="events">
        <div className="know-more-heading">
          <p className="eyebrow dark">Know more</p>
          <h2>Celebrate the moments<br /><em>that matter most.</em></h2>
        </div>
        <div className="feature-row feature-row-text-first">
          <div className="feature-copy">
            <p className="eyebrow dark">Big-screen memories</p>
            <h3>Celebrate your precious moments with our unique big screens along with your loved ones.</h3>
            <p>Settle into a private theatre made for birthdays, anniversaries, and every gathering that deserves a little more wonder. Your people, your movie, your moment.</p>
          </div>
          <div className="feature-image-wrap"><img src={birthdayImage} alt="Birthday celebration in a private theatre" /></div>
        </div>
        <div className="feature-row feature-row-image-first">
          <div className="feature-image-wrap"><img src={theaterImage} alt="Private theatre with comfortable cinema seating" /></div>
          <div className="feature-copy">
            <p className="eyebrow dark">Your private screen</p>
            <h3>More than a venue. A beautiful setting for the people you love.</h3>
            <p>From warm lighting to immersive sound, every detail is shaped around a relaxed, memorable experience that feels completely yours.</p>
          </div>
        </div>
        <div className="feature-row feature-row-text-first">
          <div className="feature-copy">
            <p className="eyebrow dark">Keep the memory</p>
            <h3>Turn every celebration into a story worth looking back on.</h3>
            <p>Bring your best looks, your favorite people, and your biggest moments. Our photography experience gives every memory its own spotlight.</p>
          </div>
          <div className="feature-image-wrap"><img src={photographyImage} alt="Photography session in a bright studio" /></div>
        </div>
      </section>

      <footer id="contact"><span>BNB / 2024</span><span>Good times, thoughtfully made.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  )
}

export default App
