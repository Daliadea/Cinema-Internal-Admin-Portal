// api.js — Public JSON endpoints for the React customer-facing app.
// These are separate from the EJS admin routes and return JSON, not HTML.
// Routes:
//   GET  /api/screenings           — browse all upcoming screenings
//   GET  /api/screenings/:id       — single screening detail (with seat map)
//   GET  /api/movies/:id           — single movie detail page
//   POST /api/auth/register        — create customer account, returns JWT
//   POST /api/auth/login           — login, returns JWT
//   GET  /api/auth/me              — verify JWT, return customer profile
//   GET  /api/my-tickets           — customer's own booking history (requires JWT)
//   POST /api/bookings             — create a booking with atomic seat lock (requires JWT)

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Movie = require('../models/Movie');
const Screening = require('../models/Screening');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'cinevillage-jwt-secret-2026';
const MAX_SEATS_PER_BOOKING = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

// MongoDB ObjectId must be exactly 24 hex chars; reject bad IDs early
function isValidObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

// JWT middleware: reads "Authorization: Bearer <token>" header,
// verifies the token, and attaches customerId to req for downstream handlers
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.customerId = decoded.customerId;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}


// ── Customer Auth ─────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const customer = new Customer({ name: name.trim(), email, password });
    await customer.save();
    const token = jwt.sign({ customerId: customer._id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ customerId: customer._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId).select('-password');
    if (!customer) return res.status(404).json({ error: 'Account not found' });
    res.json({ id: customer._id, name: customer.name, email: customer.email });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// ── Movies ────────────────────────────────────────────────────────────────────

// GET /api/movies
router.get('/movies', async (req, res) => {
  try {
    const { status, genre } = req.query;
    const query = { isActive: true };
    if (status && ['now_showing', 'coming_soon'].includes(status)) query.status = status;
    if (genre) query.genre = genre;
    const movies = await Movie.find(query).sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// GET /api/movies/:id
router.get('/movies/:id', async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    const screenings = await Screening.find({
      movie: movie._id,
      startTime: { $gte: new Date() }
    }).populate('hall').sort({ startTime: 1 });
    res.json({ movie, screenings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// ── Screenings ────────────────────────────────────────────────────────────────

// GET /api/screenings/:id
router.get('/screenings/:id', async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Screening not found' });
  }
  try {
    const screening = await Screening.findById(req.params.id)
      .populate('movie')
      .populate('hall');
    if (!screening) return res.status(404).json({ error: 'Screening not found' });
    res.json(screening);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch screening' });
  }
});

// ── Bookings ──────────────────────────────────────────────────────────────────

// POST /api/bookings — requires a logged-in customer (JWT)
// Flow: validate input → check hall/timing/movie → atomic seat lock → save booking
router.post('/bookings', requireAuth, async (req, res) => {
  try {
    const { customerName, customerEmail, screeningId, seats } = req.body;

    // Step 1: Basic input validation
    if (!customerName || !customerEmail || !screeningId || !seats || !seats.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!isValidObjectId(screeningId)) {
      return res.status(404).json({ error: 'Screening not found' });
    }
    if (seats.length > MAX_SEATS_PER_BOOKING) {
      return res.status(400).json({
        error: `You can book a maximum of ${MAX_SEATS_PER_BOOKING} seats per transaction`
      });
    }
    // Reject if the same seat appears twice in the request
    const uniqueSeats = [...new Set(seats)];
    if (uniqueSeats.length !== seats.length) {
      return res.status(400).json({ error: 'Duplicate seats in request' });
    }

    // Step 2: Load screening with hall and movie
    const screening = await Screening.findById(screeningId).populate('hall').populate('movie');
    if (!screening) return res.status(404).json({ error: 'Screening not found' });

    const hall = screening.hall;
    if (!hall) {
      return res.status(400).json({ error: 'This screening no longer has a valid hall assigned. Please contact support.' });
    }

    // Step 3: Business rule checks
    if (new Date(screening.startTime) < new Date()) {
      return res.status(400).json({ error: 'This screening has already started and can no longer be booked' });
    }
    if (screening.movie && !screening.movie.isActive) {
      return res.status(400).json({ error: 'This movie is no longer available for booking' });
    }

    // Step 4: Validate seat codes are within hall grid (e.g. A1 to E8)
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, hall.rows);
    const validSeats = [];
    for (let r = 0; r < hall.rows; r++) {
      for (let c = 1; c <= hall.columns; c++) {
        validSeats.push(`${rowLetters[r]}${c}`);
      }
    }
    const invalidSeat = seats.find(s => !validSeats.includes(s));
    if (invalidSeat) return res.status(400).json({ error: `Invalid seat: ${invalidSeat}` });

    // Step 5: Atomic seat reservation — race condition guard
    // findOneAndUpdate only succeeds if NONE of the requested seats are already in bookedSeats.
    // If two users try the same seat at the same time, only one update succeeds; the other gets null.
    const updated = await Screening.findOneAndUpdate(
      { _id: screeningId, bookedSeats: { $not: { $elemMatch: { $in: seats } } } },
      { $push: { bookedSeats: { $each: seats } } },
      { new: true }
    );

    if (!updated) {
      // Fetch the current bookedSeats to find exactly which requested seats are already taken
      const current = await Screening.findById(screeningId).select('bookedSeats');
      const contestedSeats = seats.filter(s => current && current.bookedSeats.includes(s));
      // 409 = conflict; front-end shows "seat just taken" message
      return res.status(409).json({
        error: 'One or more seats you selected were just taken. Please choose different seats.',
        contestedSeats,
      });
    }

    // Step 6: Save booking record; rollback seat lock if save fails
    const totalAmount = seats.length * (screening.price || 12);
    let booking;
    try {
      booking = new Booking({
        customerName,
        customerEmail,
        customer: req.customerId || null,
        screening: screeningId,
        seats,
        totalAmount
      });
      await booking.save();
    } catch (saveErr) {
      // Something went wrong saving — undo the seat reservation so they're free again
      console.error('Booking record save failed, rolling back seat reservation:', saveErr.message);
      await Screening.findByIdAndUpdate(screeningId, {
        $pull: { bookedSeats: { $in: seats } }
      });
      return res.status(500).json({
        error: 'Booking could not be saved. Your seats have been released — please try again.'
      });
    }

    // Step 7: Return booking confirmation to React app
    res.status(201).json({
      success: true,
      bookingRef: booking.bookingRef,
      totalAmount,
      seats,
      customerName
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});


// GET /api/customer/bookings — account-linked bookings (requires auth)
router.get('/customer/bookings', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.customerId })
      .populate({ path: 'screening', populate: [{ path: 'movie' }, { path: 'hall' }] })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
