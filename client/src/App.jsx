import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const samples = [
  { _id: 'sample-1', businessName: 'Aarohi Little Nest', location: 'Indiranagar, Bengaluru', hourlyRate: 350, type: 'individual', bio: 'Gentle, play-led care with a warm home routine.', rating: '4.9', reviews: 82, initials: 'AN', color: 'peach' },
  { _id: 'sample-2', businessName: 'Bright Beginnings', location: 'Koramangala, Bengaluru', hourlyRate: 280, type: 'daycare_center', bio: 'A joyful early-learning space for curious little minds.', rating: '4.8', reviews: 126, initials: 'BB', color: 'sun' },
  { _id: 'sample-3', businessName: 'Meera Shah', location: 'HSR Layout, Bengaluru', hourlyRate: 400, type: 'individual', bio: 'Calm, dependable care for babies, toddlers, and school kids.', rating: '5.0', reviews: 47, initials: 'MS', color: 'mint' },
]

const decorateProvider = (provider, index) => ({ ...provider, rating: ['4.9', '4.8', '5.0'][index % 3], reviews: [82, 126, 47][index % 3], initials: provider.businessName.split(' ').map((word) => word[0]).join('').slice(0, 2), color: ['peach', 'sun', 'mint'][index % 3] })

function App() {
  const [providers, setProviders] = useState(samples)
  const [search, setSearch] = useState({ location: '', care: '', date: tomorrow })
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [booking, setBooking] = useState({ childName: '', childAge: '', startTime: '09:00', endTime: '13:00', careType: 'babysitting', notes: '' })
  const [bookingMessage, setBookingMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authMessage, setAuthMessage] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'parent' })
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('littleStepsUser') || 'null'))
  const [providerOpen, setProviderOpen] = useState(false)
  const [providerMessage, setProviderMessage] = useState('')
  const [providerForm, setProviderForm] = useState({ type: 'individual', businessName: '', bio: '', experienceYears: '', hourlyRate: '', location: '', availability: '' })
  const [myBookings, setMyBookings] = useState([])
  const [bookingsOpen, setBookingsOpen] = useState(false)
  const [receivedBookings, setReceivedBookings] = useState([])
  const [requestsOpen, setRequestsOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/providers`).then((response) => response.ok ? response.json() : []).then((data) => { if (data.length) setProviders(data.map(decorateProvider)) }).catch(() => {})
  }, [])

  const visibleProviders = useMemo(() => providers.filter((provider) => {
    const locationMatches = !search.location || provider.location.toLowerCase().includes(search.location.toLowerCase())
    const careMatches = !search.care || (search.care !== 'daycare' || provider.type === 'daycare_center')
    return locationMatches && careMatches
  }), [providers, search])
  const minutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  const hours = Math.max(0, minutes(booking.endTime) - minutes(booking.startTime)) / 60
  const total = selectedProvider ? hours * selectedProvider.hourlyRate : 0
  const openAuth = (mode) => { setAuthMode(mode); setAuthMessage(''); setAuthOpen(true); setMenuOpen(false) }
  const openBooking = (provider) => { setSelectedProvider(provider); setBookingMessage('') }

  const submitAuth = async (event) => {
    event.preventDefault()
    try {
      const payload = authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm
      const response = await fetch(`${API_URL}/auth/${authMode === 'login' ? 'login' : 'signup'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) return setAuthMessage(data.message || 'Please try again.')
      localStorage.setItem('littleStepsToken', data.token)
      localStorage.setItem('littleStepsUser', JSON.stringify(data.user))
      setUser(data.user); setAuthOpen(false)
    } catch { setAuthMessage('Could not reach the server. Please try again.') }
  }

  const submitBooking = async (event) => {
    event.preventDefault()
    if (selectedProvider._id.startsWith('sample-')) return setBookingMessage('This is a design preview. Create a provider in MongoDB to submit a live booking.')
    const token = localStorage.getItem('littleStepsToken')
    if (!token) { setBookingMessage('Please sign in as a parent first.'); openAuth('login'); return }
    try {
      const response = await fetch(`${API_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ providerId: selectedProvider._id, date: search.date, ...booking }) })
      const data = await response.json()
      setBookingMessage(response.ok ? 'Booking request sent. Your carer will confirm shortly.' : data.message || 'Could not send booking.')
    } catch { setBookingMessage('Could not reach the server. Please try again.') }
  }
  const openProvider = () => { setProviderOpen(true); setProviderMessage(''); setMenuOpen(false) } 
  const openMyBookings = async () => {
  const token = localStorage.getItem('littleStepsToken')
  if (!token) return
  try {
    const response = await fetch(`${API_URL}/bookings/my-bookings`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await response.json()
    setMyBookings(response.ok ? data : [])
  } catch { setMyBookings([]) }
  setBookingsOpen(true); setMenuOpen(false)
 }
 const openRequests = async () => {
  const token = localStorage.getItem('littleStepsToken')
  if (!token) return
  try {
    const response = await fetch(`${API_URL}/bookings/received`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await response.json()
    setReceivedBookings(response.ok ? data : [])
  } catch { setReceivedBookings([]) }
  setRequestsOpen(true); setMenuOpen(false)
}

const respondToBooking = async (bookingId, status) => {
  const token = localStorage.getItem('littleStepsToken')
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) })
    if (response.ok) setReceivedBookings((current) => current.map((item) => item._id === bookingId ? { ...item, status } : item))
  } catch {}
}
  const logout = () => { localStorage.removeItem('littleStepsToken'); localStorage.removeItem('littleStepsUser'); setUser(null) }
  const submitProviderProfile = async (event) => {
  event.preventDefault()
  const token = localStorage.getItem('littleStepsToken')
  if (!token) { setProviderMessage('Please log in first.'); return }
  try {
    const response = await fetch(`${API_URL}/providers`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...providerForm, experienceYears: Number(providerForm.experienceYears) || 0, hourlyRate: Number(providerForm.hourlyRate) }) })
    const data = await response.json()
    setProviderMessage(response.ok ? 'Profile saved! Parents can now find and book you.' : data.message || 'Could not save profile.')
    if (response.ok) setTimeout(() => setProviderOpen(false), 1500)
  } catch { setProviderMessage('Could not reach the server. Please try again.') }
}

  return <main>
    <nav className="nav container"><a className="brand" href="#home"><span className="brand-mark">L</span> little steps</a><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">Menu</button><div className={`nav-links ${menuOpen ? 'open' : ''}`}><a href="#find-care">Find care</a><a href="#how-it-works">How it works</a><a href="#trust">Safety</a>{user?.role === 'parent' && <button className="nav-auth" onClick={openMyBookings}>My bookings</button>}{user ? <button className="nav-auth" onClick={logout}>Log out</button> : <button className="nav-auth login" onClick={() => openAuth('login')}>Log in</button>}{!user && <button className="join" onClick={() => openAuth('signup')}>Join Little Steps</button>}{user?.role === 'provider' && <button className="provider-cta" onClick={openProvider}>Set up my profile</button>}{user?.role === 'provider' && <button className="nav-auth" onClick={openRequests}>Requests</button>}</div></nav>
    <section className="hero-section" id="home"><div className="container hero-grid"><div className="hero-copy"><p className="eyebrow">Care that feels like family</p><h1>Every little step,<br /><em>beautifully supported.</em></h1><p className="hero-text">Find trusted, verified childcare for the moments you need it most - whether it is a busy Tuesday or an unexpected night out.</p><a className="primary-button" href="#find-care">Find care near you <span>-&gt;</span></a><div className="mini-trust"><div className="faces"><i>R</i><i>S</i><i>A</i></div><span>Trusted by <strong>2,000+ families</strong><br />in Bengaluru and beyond</span></div></div><div className="hero-art"><div className="sun-shape" /><div className="rainbow"><span /><span /><span /></div><div className="child"><div className="hair" /><div className="face">hi</div><div className="shirt">*</div><div className="block block-one">A</div><div className="block block-two">B</div></div><div className="scribble">*</div></div></div></section>
    <section className="finder-wrap" id="find-care"><div className="container"><form className="finder" onSubmit={(event) => { event.preventDefault(); document.querySelector('#providers').scrollIntoView({ behavior: 'smooth' }) }}><label>Where?<input value={search.location} onChange={(event) => setSearch({ ...search, location: event.target.value })} placeholder="Your area or city" /></label><label>When?<input type="date" min={tomorrow} value={search.date} onChange={(event) => setSearch({ ...search, date: event.target.value })} /></label><label>What kind of care?<select value={search.care} onChange={(event) => setSearch({ ...search, care: event.target.value })}><option value="">Any type of care</option><option value="babysitting">Babysitting</option><option value="daycare">Daycare</option><option value="emergency">Emergency care</option></select></label><button className="search-button">Search care -&gt;</button></form></div></section>
    <section className="providers-section container" id="providers"><div className="section-heading"><div><p className="eyebrow">Meet your village</p><h2>Caregivers families love</h2></div><a href="#providers">View all caregivers -&gt;</a></div><div className="provider-grid">{visibleProviders.map((provider) => <article className="provider-card" key={provider._id}><div className={`provider-photo ${provider.color}`}><span>{provider.initials}</span><b>Available</b></div><div className="provider-body"><div className="rating">Star {provider.rating} <span>({provider.reviews} reviews)</span></div><h3>{provider.businessName}</h3><p className="location">{provider.location}</p><p className="provider-bio">{provider.bio}</p><div className="provider-footer"><span><strong>Rs {provider.hourlyRate}</strong> / hour</span><button onClick={() => openBooking(provider)}>Book now</button></div></div></article>)}</div>{!visibleProviders.length && <p className="empty-state">No carers match this search. Try another area or care type.</p>}</section>
    <section className="how-section" id="how-it-works"><div className="container"><p className="eyebrow centered">Simple, safe, reassuring</p><h2 className="centered-title">Care in three little steps</h2><div className="steps"><div><span>01</span><h3>Tell us what you need</h3><p>Choose the type of care, place, date, and time that works for your family.</p></div><div><span>02</span><h3>Meet your match</h3><p>Explore verified carers, their experience, reviews, and approach to care.</p></div><div><span>03</span><h3>Book with confidence</h3><p>Send your request, get confirmation, and breathe a little easier.</p></div></div></div></section>
    <section className="trust-section" id="trust"><div className="container trust-grid"><div className="trust-art"><div>OK</div><span>Trusted<br />care</span></div><div><p className="eyebrow">Your peace of mind comes first</p><h2>Every caregiver is someone we would trust with our own family.</h2><div className="check-list"><p>Yes - Identity and background checks</p><p>Yes - Verified parent reviews</p><p>Yes - Dedicated support whenever you need us</p></div><a href="#find-care" className="text-link">Learn about our safety promise -&gt;</a></div></div></section>
    <section className="cta-section"><div className="container"><p className="eyebrow centered">It takes a village</p><h2 className="centered-title">Ready to find your<br /><em>trusted care village?</em></h2><a className="primary-button" href="#find-care">Find care near you <span>-&gt;</span></a></div></section><footer><div className="container footer-row"><a className="brand" href="#home"><span className="brand-mark">L</span> little steps</a><p>Made with care for growing families.</p></div></footer>
    {selectedProvider && <div className="modal-backdrop" onMouseDown={() => setSelectedProvider(null)}><section className="booking-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setSelectedProvider(null)}>x</button><p className="eyebrow">Book with confidence</p><h2>Request care with {selectedProvider.businessName}</h2><div className="booking-provider"><span className={`provider-avatar ${selectedProvider.color}`}>{selectedProvider.initials}</span><div><strong>{search.date}</strong><small>{selectedProvider.location} - Rs {selectedProvider.hourlyRate}/hr</small></div></div><form onSubmit={submitBooking} className="booking-form"><div className="form-row"><label>Child name<input required value={booking.childName} onChange={(event) => setBooking({ ...booking, childName: event.target.value })} /></label><label>Child age<input required type="number" min="0" max="18" value={booking.childAge} onChange={(event) => setBooking({ ...booking, childAge: event.target.value })} /></label></div><label>Care type<select value={booking.careType} onChange={(event) => setBooking({ ...booking, careType: event.target.value })}><option value="babysitting">Babysitting</option><option value="daycare">Daycare</option><option value="overnight">Overnight care</option><option value="emergency">Emergency care</option></select></label><div className="form-row"><label>Start time<input required type="time" value={booking.startTime} onChange={(event) => setBooking({ ...booking, startTime: event.target.value })} /></label><label>End time<input required type="time" value={booking.endTime} onChange={(event) => setBooking({ ...booking, endTime: event.target.value })} /></label></div><label>Note for carer<textarea value={booking.notes} onChange={(event) => setBooking({ ...booking, notes: event.target.value })} rows="2" /></label><div className="booking-total"><span>Estimated total <small>{hours} hours x Rs {selectedProvider.hourlyRate}</small></span><strong>Rs {total.toLocaleString('en-IN')}</strong></div>{bookingMessage && <p className="form-message">{bookingMessage}</p>}<button className="primary-button submit-button">Send booking request <span>-&gt;</span></button></form></section></div>}
    {bookingsOpen && <div className="modal-backdrop" onMouseDown={() => setBookingsOpen(false)}><section className="auth-modal booking-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setBookingsOpen(false)}>x</button><p className="eyebrow">Your care requests</p><h2>My bookings</h2>{myBookings.length === 0 ? <p className="auth-intro">No bookings yet. Find a caregiver and send a request.</p> : <div className="booking-list">{myBookings.map((item) => <div key={item._id} className="booking-list-item"><strong>{item.provider?.businessName || 'Caregiver'}</strong><span>{new Date(item.date).toLocaleDateString()} · {item.startTime} - {item.endTime}</span><span className={`status-pill status-${item.status}`}>{item.status}</span></div>)}</div>}</section></div>}
    {authOpen && <div className="modal-backdrop" onMouseDown={() => setAuthOpen(false)}><section className="auth-modal booking-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setAuthOpen(false)}>x</button><p className="eyebrow">Welcome to Little Steps</p><h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="auth-intro">{authMode === 'login' ? 'Sign in to send care requests and manage bookings.' : 'Join families and trusted carers in your neighbourhood.'}</p><form className="booking-form" onSubmit={submitAuth}>{authMode === 'signup' && <><label>Your name<input required value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label><label>I am joining as<select value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}><option value="parent">A parent</option><option value="provider">A childcare provider</option></select></label></>}<label>Email address<input required type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label><label>Password<input required minLength="6" type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>{authMessage && <p className="form-message">{authMessage}</p>}<button className="primary-button submit-button">{authMode === 'login' ? 'Log in' : 'Create account'} <span>-&gt;</span></button></form><p className="auth-switch">{authMode === 'login' ? 'New to Little Steps?' : 'Already have an account?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMessage('') }}>{authMode === 'login' ? 'Create an account' : 'Log in'}</button></p></section></div>}
    {providerOpen && <div className="modal-backdrop" onMouseDown={() => setProviderOpen(false)}><section className="auth-modal booking-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setProviderOpen(false)}>x</button><p className="eyebrow">Set up your listing</p><h2>Your provider profile</h2><form className="booking-form" onSubmit={submitProviderProfile}><label>I am a<select value={providerForm.type} onChange={(event) => setProviderForm({ ...providerForm, type: event.target.value })}><option value="individual">Individual caregiver</option><option value="daycare_center">Daycare center</option></select></label><label>Business / center name<input required value={providerForm.businessName} onChange={(event) => setProviderForm({ ...providerForm, businessName: event.target.value })} /></label><label>Bio<textarea required rows="2" value={providerForm.bio} onChange={(event) => setProviderForm({ ...providerForm, bio: event.target.value })} /></label><div className="form-row"><label>Years of experience<input type="number" min="0" value={providerForm.experienceYears} onChange={(event) => setProviderForm({ ...providerForm, experienceYears: event.target.value })} /></label><label>Hourly rate (Rs)<input required type="number" min="0" value={providerForm.hourlyRate} onChange={(event) => setProviderForm({ ...providerForm, hourlyRate: event.target.value })} /></label></div><label>Location<input required value={providerForm.location} onChange={(event) => setProviderForm({ ...providerForm, location: event.target.value })} /></label><label>Availability<input placeholder="e.g. Mon-Fri, 9am-6pm or 24x7" value={providerForm.availability} onChange={(event) => setProviderForm({ ...providerForm, availability: event.target.value })} /></label>{providerMessage && <p className="form-message">{providerMessage}</p>}<button className="primary-button submit-button">Save profile <span>-&gt;</span></button></form></section></div>}
    {requestsOpen && <div className="modal-backdrop" onMouseDown={() => setRequestsOpen(false)}><section className="auth-modal booking-modal" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setRequestsOpen(false)}>x</button><p className="eyebrow">Incoming requests</p><h2>Booking requests</h2>{receivedBookings.length === 0 ? <p className="auth-intro">No requests yet.</p> : <div className="booking-list">{receivedBookings.map((item) => <div key={item._id} className="booking-list-item"><strong>{item.parent?.name || 'Parent'}</strong><span>{new Date(item.date).toLocaleDateString()} · {item.startTime} - {item.endTime}</span>{item.notes && <span>{item.notes}</span>}{item.status === 'pending' ? <div className="request-actions"><button className="accept-btn" onClick={() => respondToBooking(item._id, 'accepted')}>Accept</button><button className="decline-btn" onClick={() => respondToBooking(item._id, 'rejected')}>Decline</button></div> : <span className={`status-pill status-${item.status}`}>{item.status}</span>}</div>)}</div>}</section></div>}
  </main>
}

export default App
