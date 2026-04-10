// customers.js — Admin view of all registered customer accounts (read-only, EJS).
// Uses MongoDB aggregation to calculate per-customer booking stats in one query
// instead of running individual queries for each customer.

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

// GET /admin/customers — list all customers with search + stats
router.get('/', async (req, res) => {
  try {
    const { search, sort = 'newest' } = req.query;

    const query = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const sortMap = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
      name:    { name:       1 },
    };

    const customers = await Customer.find(query)
      .select('-password')
      .sort(sortMap[sort] || sortMap.newest);

    // Aggregate: group all bookings by customer ID in a single DB query
    // instead of running a separate query per customer.
    // $match limits to only the filtered customers; $group sums up their totals.
    const bookingStats = await Booking.aggregate([
      { $match: { customer: { $in: customers.map(c => c._id) } } },
      {
        $group: {
          _id: '$customer',           // group key: one result per customer
          totalBookings: { $sum: 1 }, // count every booking document
          totalSpent:    { $sum: '$totalAmount' },
          totalTickets:  { $sum: { $size: '$seats' } }, // seats is an array; $size counts it
          lastBooking:   { $max: '$createdAt' },
        }
      }
    ]);

    const statsMap = {};
    bookingStats.forEach(s => { statsMap[s._id.toString()] = s; });

    // Attach stats to each customer object
    const customersWithStats = customers.map(c => ({
      ...c.toObject(),
      stats: statsMap[c._id.toString()] || { totalBookings: 0, totalSpent: 0, totalTickets: 0, lastBooking: null }
    }));

    // Summary totals (based on filtered set)
    const totalRevenue   = bookingStats.reduce((s, b) => s + b.totalSpent, 0);
    const totalBookings  = bookingStats.reduce((s, b) => s + b.totalBookings, 0);
    const startOfMonth   = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth   = customers.filter(c => c.createdAt >= startOfMonth).length;

    res.render('customers/index', {
      customers: customersWithStats,
      totalRevenue,
      totalBookings,
      newThisMonth,
      filters: { search, sort },
      staff: req.session,
      title: 'Customer Accounts'
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).send('Error fetching customers');
  }
});

// GET /admin/customers/:id — individual customer detail
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');
    if (!customer) return res.status(404).render('404');

    const bookings = await Booking.find({ customer: customer._id })
      .populate({ path: 'screening', populate: [{ path: 'movie' }, { path: 'hall' }] })
      .sort({ createdAt: -1 });

    const totalSpent   = bookings.reduce((s, b) => s + b.totalAmount, 0);
    const totalTickets = bookings.reduce((s, b) => s + b.seats.length, 0);
    const now          = new Date();
    const upcomingCount = bookings.filter(b => b.screening && new Date(b.screening.startTime) >= now).length;

    res.render('customers/view', {
      customer,
      bookings,
      totalSpent,
      totalTickets,
      upcomingCount,
      staff: req.session,
      title: customer.name
    });
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).send('Error fetching customer');
  }
});

module.exports = router;
