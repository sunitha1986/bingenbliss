import { useState } from 'react'
import './App.css'

function App() {
  const [activeCategory, setActiveCategory] = useState('All venues')
  const [city, setCity] = useState('Hyderabad')

  const venues = [
    {
      name: 'The Velvet Screen',
      type: 'Private cinema',
      location: 'Jubilee Hills',
      price: 'From ₹2,499',
      image:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85',
      tag: 'Most loved',
    },
    {
      name: 'Neon Social Club',
      type: 'Party lounge',
      location: 'Banjara Hills',
      price: 'From ₹1,999',
      image:
        'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=85',
      tag: 'New',
    },
    {
      name: 'The Garden Reel',
      type: 'Open-air cinema',
      location: 'Gachibowli',
      price: 'From ₹3,499',
      image:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85',
      tag: 'For groups',
    },
  ]

  return (
    <main className="site-shell">
      <nav className="nav-bar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Binge N Bliss home">
          <span className="brand-mark">B</span>
          <span>Binge <i>&</i> Bliss</span>
        </a>
        <div className="nav-links">
          <a href="#venues">Explore venues</a>
          <a href="#how-it-works">How it works</a>
        </div>
        <button className="nav-action" type="button">List your venue <span>↗</span></button>
      </nav>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot"></span> Live the moment</div>
          <h1>Make it a night<br /><em>to remember.</em></h1>
          <p className="hero-description">Private screenings, electric parties, and spaces made for your kind of celebration.</p>
          <div className="search-panel" aria-label="Find a venue">
            <label>
              <span className="field-label">I&apos;m looking for</span>
              <select defaultValue="Movie night">
                <option>Movie night</option>
                <option>Birthday party</option>
                <option>Corporate event</option>
              </select>
            </label>
            <span className="field-divider"></span>
            <label>
              <span className="field-label">Where</span>
              <select value={city} onChange={(event) => setCity(event.target.value)}>
                <option>Hyderabad</option>
                <option>Bengaluru</option>
                <option>Mumbai</option>
              </select>
            </label>
            <button className="search-button" type="button" aria-label="Search venues">⌕</button>
          </div>
          <div className="hero-footnote"><span>✦</span> Curated spaces. Zero ordinary nights.</div>
        </div>
        <div className="hero-side-note"><span>Scroll to explore</span><span className="scroll-line"></span></div>
        <div className="hero-bottom-row">
          <div className="trusted-by"><span className="avatar-stack"><i></i><i></i><i></i></span><strong>2,000+</strong><span>celebrations hosted</span></div>
          <div className="hero-caption">Your people. Your playlist.<br /><span>Your perfect place.</span></div>
        </div>
      </section>

      <section className="venues-section" id="venues">
        <div className="section-heading">
          <div><p className="eyebrow dark">Find your happy place</p><h2>Spaces with a little<br /><em>extra magic.</em></h2></div>
          <a className="text-link" href="#venues">View all venues <span>↗</span></a>
        </div>
        <div className="category-tabs" role="tablist" aria-label="Venue categories">
          {['All venues', 'Movie nights', 'Party spaces', 'Team outings'].map((category) => (
            <button className={activeCategory === category ? 'active' : ''} key={category} onClick={() => setActiveCategory(category)} type="button">{category}</button>
          ))}
        </div>
        <div className="venue-grid">
          {venues.map((venue) => <article className="venue-card" key={venue.name}>
            <div className="venue-image-wrap"><img src={venue.image} alt={venue.name} /><span className="venue-tag">{venue.tag}</span><button className="heart-button" aria-label={`Save ${venue.name}`} type="button">♡</button></div>
            <div className="venue-details"><div><h3>{venue.name}</h3><p>{venue.type} · {venue.location}</p></div><span className="venue-price">{venue.price}</span></div>
          </article>)}
        </div>
      </section>

      <footer id="how-it-works"><span>BNB / 2024</span><span>Good times, thoughtfully made.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  )
}

export default App
