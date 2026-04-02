const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');

// GET /admin/bookings - list all bookings with optional filters
router.get('/', async (req, res) => {
  try {
    const { email, movieId, dateFrom, dateTo } = req.query;
    const query = {};

    if (email && email.trim()) {
      query.customerEmail = { $regex: email.trim(), $options: 'i' };
    }

    // Build date filter on createdAt (booking date)
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        query.createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    }

    let bookings = await Booking.find(query)
      .populate({
        path: 'screening',
        populate: [{ path: 'movie' }, { path: 'hall' }]
      })
      .sort({ createdAt: -1 });

    // Filter by movie after population
    if (movieId) {
      bookings = bookings.filter(b => b.screening && b.screening.movie && b.screening.movie._id.toString() === movieId);
    }

    const movies = await Movie.find({ isActive: true }).sort({ title: 1 });

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalTickets = bookings.reduce((sum, b) => sum + b.seats.length, 0);

    res.render('bookings/index', {
      bookings,
      movies,
      totalRevenue,
      totalTickets,
      filters: { email, movieId, dateFrom, dateTo },
      staff: req.session
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).send('Error fetching bookings');
  }
});

module.exports = router;
