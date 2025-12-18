import React, { useRef } from 'react'

export default function App() {
  const formRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    const btn = formRef.current && formRef.current.querySelector('button')
    if (!btn) return
    const originalText = btn.innerText
    btn.innerText = 'Sent!'
    btn.style.backgroundColor = '#C06C5D'
    btn.style.color = 'white'

    setTimeout(() => {
      alert('Thank you! This is a demo form.')
      formRef.current && formRef.current.reset()
      btn.innerText = originalText
      btn.style.backgroundColor = 'white'
      btn.style.color = 'var(--slate-blue)'
    }, 500)
  }

  return (
    <>
      <nav>
        <div className="container">
          <div className="logo">S &amp; L</div>
          <div className="menu-toggle">☰</div>
          <div className="nav-links">
            <a href="#story">Our Story</a>
            <a href="#schedule">Schedule</a>
            <a href="#travel">Travel</a>
            <a href="#rsvp">RSVP</a>
          </div>
        </div>
      </nav>

      <header>
        <div className="subtitle">October 18, 2026 &bull; Château de Varennes</div>
        <h1>Sofia &amp; Lucas</h1>
        <div className="hero-date">Une Célébration d’Amor &amp; Liefde</div>
        <a href="#rsvp" className="btn btn-outline">RSVP Now</a>
      </header>

      <section id="story">
        <div className="container">
          <div className="section-header">
            <span>Two Worlds</span>
            <h2>One Heart</h2>
          </div>
          <div className="story-grid">
            <div className="story-text">
              <p><span className="drop-cap">F</span>rom the vibrant streets of Mexico City to the cobbled squares of Brussels, our story is a map of two cultures finding a home in one another. We bonded over a shared love of art, deep conversation, and the debate over who makes the best chocolate (the verdict is still out).</p>
              <p>We chose France as our gathering place—a neutral ground of beauty and wine—to celebrate the blending of our families. We invite you to an intimate weekend where the tequila flows as freely as the champagne.</p>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Signature_sample.svg/1200px-Signature_sample.svg.png" style={{height:40, opacity:0.6, marginTop:20}} alt="Signature" />
            </div>
            <div className="story-img">
              <img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop" alt="Sofia and Lucas in Brussels" />
            </div>
          </div>
        </div>
      </section>

      <section id="schedule" className="bg-white">
        <div className="container">
          <div className="section-header">
            <span>The Weekend</span>
            <h2>Schedule of Events</h2>
          </div>
          <div className="timeline">
            <div className="event">
              <div className="event-time">
                <h4>Friday, Oct 17</h4>
                <span style={{color:'#888'}}>6:00 PM</span>
              </div>
              <div className="event-dot"></div>
              <div className="event-detail">
                <h3>The Welcome Fiesta</h3>
                <p><strong>Dress Code:</strong> Tropical Chic</p>
                <p>Join us in the Courtyard for Tacos, Frites, Mezcal, and Belgian Ale.</p>
              </div>
            </div>

            <div className="event">
              <div className="event-time">
                <h4>Saturday, Oct 18</h4>
                <span style={{color:'#888'}}>4:30 PM</span>
              </div>
              <div className="event-dot"></div>
              <div className="event-detail">
                <h3>Ceremony &amp; Reception</h3>
                <p><strong>Dress Code:</strong> Black Tie Optional</p>
                <p>Vows in the Gardens followed by dinner in the Orangery.</p>
              </div>
            </div>

            <div className="event">
              <div className="event-time">
                <h4>Sunday, Oct 19</h4>
                <span style={{color:'#888'}}>11:00 AM</span>
              </div>
              <div className="event-dot"></div>
              <div className="event-detail">
                <h3>Recovery Brunch</h3>
                <p><strong>Dress Code:</strong> Casual</p>
                <p>Coffee, Croissants, and Chilaquiles before you depart.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="travel">
        <div className="container">
          <div className="section-header">
            <span>The Journey</span>
            <h2>Travel &amp; Stay</h2>
          </div>
          <div className="travel-grid">
            <div className="travel-card">
              <span className="icon">✈️</span>
              <h3>Getting There</h3>
              <p>Fly into <strong>Paris (CDG)</strong> or <strong>Lyon (LYS)</strong>. From there, the Château is a scenic 2-hour train ride or drive.</p>
              <a href="#" style={{color:'var(--terracotta)', borderBottom:'1px solid'}}>View Map</a>
            </div>
            <div className="travel-card">
              <span className="icon">🏰</span>
              <h3>Accommodations</h3>
              <p>We have reserved a block of rooms at the <em>Hôtel de la Poste</em> nearby. Shuttles provided on the wedding night.</p>
              <a href="#" style={{color:'var(--terracotta)', borderBottom:'1px solid'}}>Book Room</a>
            </div>
            <div className="travel-card">
              <span className="icon">💡</span>
              <h3>Good to Know</h3>
              <p>We embrace the Belgian love for long dinners and the Mexican stamina for late parties. Pace yourself!</p>
            </div>
          </div>
        </div>
      </section>

      <section id="rsvp" className="rsvp-section">
        <div className="container">
          <div className="section-header">
            <span>Join Us</span>
            <h2>R.S.V.P.</h2>
            <p>Please respond by August 1st, 2026</p>
          </div>
          <form id="rsvpForm" ref={formRef} onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <input type="text" placeholder="First Name" required />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Last Name" required />
              </div>
            </div>
            <div className="form-group">
              <input type="email" placeholder="Email Address" required />
            </div>
            <div className="form-group">
              <select required defaultValue="">
                <option value="" disabled style={{color:'#555'}}>Will you be attending?</option>
                <option value="yes" style={{color:'#000'}}>Joyfully Accepts</option>
                <option value="no" style={{color:'#000'}}>Regretfully Declines</option>
              </select>
            </div>
            <div className="form-group">
              <textarea rows="4" placeholder="Dietary Restrictions or Song Requests"></textarea>
            </div>
            <button type="submit" className="btn" style={{background:'white', color:'var(--slate-blue)', width:'100%'}}>Send RSVP</button>
          </form>
        </div>
      </section>

      <footer>
        <div className="container">
          <h3 style={{fontSize:'1.5rem', marginBottom:'1rem'}}>S &amp; L</h3>
          <p style={{marginBottom:0}}>Made with Amor &amp; Liefde in France</p>
          <p style={{opacity:0.5}}>&copy; 2026 Sofia &amp; Lucas</p>
        </div>
      </footer>
    </>
  )
}
