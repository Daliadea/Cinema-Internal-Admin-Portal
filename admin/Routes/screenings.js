const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Screening = require('../models/Screening');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');
const Booking = require('../models/Booking');

// Remove duplicate hall names (same name, different documents)
function dedupeHalls(halls) {
  const seen = new Set();
  return halls.filter(h => {
    const key = h.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Fetch the movies and halls needed to render the screening form
async function getFormData(excludeMaintenance = false) {
  const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
  const hallFilter = excludeMaintenance ? { isUnderMaintenance: false } : {};
  const halls = dedupeHalls(await Hall.find(hallFilter).sort({ name: 1 }));
  return { movies, halls };
}

// Calculate end time: movie duration + 15-minute cleaning buffer
function calcEndTime(start, movieDurationMinutes) {
  return new Date(start.getTime() + (movieDurationMinutes + 15) * 60000);
}

// Check if a hall already has a screening during the given time window.
// Pass excludeId when editing so the current screening doesn't conflict with itself.
async function checkOverlap(hallId, startTime, endTime, excludeId = null) {
  const query = {
    hall: hallId,
    $or: [
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },  // existing starts before and ends after new start
      { startTime: { $lt: endTime },   endTime: { $gte: endTime } },     // existing starts before and ends after new end
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }     // existing is completely inside new window
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Screening.find(query).populate('movie').populate('hall');
}

// GET - List all screenings (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { dateFrom, dateTo, movieId, hallId, status } = req.query;
    const now = new Date();

    // Build date range object from query params
    const dateRange = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      dateRange.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dateRange.$lte = to;
    }
    const hasDateRange = Object.keys(dateRange).length > 0;

    // Build the MongoDB query
    const query = {};
    if (movieId && mongoose.Types.ObjectId.isValid(movieId)) query.movie = new mongoose.Types.ObjectId(movieId);
    if (hallId  && mongoose.Types.ObjectId.isValid(hallId))  query.hall  = new mongoose.Types.ObjectId(hallId);

    // Filter by status: upcoming = not started, ongoing = currently playing, past = already ended
    if (status === 'upcoming') {
      query.startTime = { $gt: now };
    } else if (status === 'ongoing') {
      query.startTime = { $lte: now }; // started already
      query.endTime   = { $gte: now }; // not finished yet
    } else if (status === 'past') {
      query.endTime = { $lt: now };
    }

    // If the user also set a date range, merge it into the startTime condition
    if (hasDateRange) {
      query.startTime = { ...query.startTime, ...dateRange };
    }

    const screenings = await Screening.find(query).populate('movie').populate('hall').sort({ startTime: -1 });
    const { movies, halls } = await getFormData();

    let success = null;
    if (req.query.created) success = 'Screening scheduled successfully.';
    else if (req.query.updated) success = 'Screening updated successfully.';
    else if (req.query.deleted !== undefined) {
      success = req.query.deleted === '0'
        ? 'No past screenings to delete.'
        : `${req.query.deleted} past screening(s) deleted successfully.`;
    }
    const error = req.query.error ? decodeURIComponent(req.query.error) : null;

    res.render('screenings/index', {
      screenings, success, error, movies, halls,
      filters: { dateFrom, dateTo, movieId, hallId, status },
      staff: req.session
    });
  } catch (error) {
    console.error('Error fetching screenings:', error);
    res.status(500).send('Error fetching screenings');
  }
});

// POST - Delete all past screenings
router.post('/delete-past', async (req, res) => {
  try {
    const result = await Screening.deleteMany({ endTime: { $lt: new Date() } });
    res.redirect('/admin/screenings?deleted=' + result.deletedCount);
  } catch (error) {
    console.error('Error deleting past screenings:', error);
    res.redirect('/admin/screenings?error=' + encodeURIComponent('Failed to delete past screenings.'));
  }
});

// GET - New screening form
router.get('/new', async (req, res) => {
  try {
    const { movies, halls } = await getFormData(true);
    res.render('screenings/new', { movies, halls, error: null, staff: req.session });
  } catch (error) {
    console.error('Error loading screening form:', error);
    res.status(500).send('Error loading screening form');
  }
});

// POST - Create new screening
router.post('/', async (req, res) => {
  const renderNew = async (error) => {
    const { movies, halls } = await getFormData(true);
    res.render('screenings/new', { movies, halls, error, staff: req.session });
  };

  try {
    const { movieId, hallId, startTime } = req.body;

    if (!movieId || !hallId || !startTime) return renderNew('All fields are required.');

    const movie = await Movie.findById(movieId);
    if (!movie) return renderNew('Selected movie not found.');

    const hall = await Hall.findById(hallId);
    if (!hall) return renderNew('Selected hall not found.');
    if (hall.isUnderMaintenance) return renderNew(`Hall "${hall.name}" is currently under maintenance.`);

    const start = new Date(startTime);
    const end = calcEndTime(start, movie.duration);
    const overlapping = await checkOverlap(hallId, start, end);

    if (overlapping.length > 0) {
      const info = overlapping.map(s => `"${s.movie.title}" at ${s.startTime.toLocaleString()}`).join(', ');
      return renderNew(`Time conflicts with: ${info}`);
    }

    await new Screening({ movie: movieId, hall: hallId, startTime: start, endTime: end }).save();
    res.redirect('/dashboard?created=1');
  } catch (error) {
    console.error('Error creating screening:', error);
    renderNew('Failed to create screening: ' + error.message);
  }
});

// GET - View a single screening
router.get('/:id', async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id).populate('movie').populate('hall');
    if (!screening) return res.status(404).send('Screening not found');
    const success = req.query.updated ? 'Screening updated successfully.' : null;
    const error = req.query.error ? decodeURIComponent(req.query.error) : null;
    res.render('screenings/view', { screening, success, error, staff: req.session });
  } catch (error) {
    console.error('Error fetching screening:', error);
    res.status(500).send('Error fetching screening');
  }
});

// GET - Edit screening form
router.get('/:id/edit', async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id).populate('movie').populate('hall');
    if (!screening) return res.status(404).send('Screening not found');
    const { movies, halls } = await getFormData();
    res.render('screenings/edit', { screening, movies, halls, error: null, staff: req.session });
  } catch (error) {
    console.error('Error fetching screening:', error);
    res.status(500).send('Error fetching screening');
  }
});

// POST - Update screening
router.post('/:id', async (req, res) => {
  const renderEdit = async (error) => {
    const screening = await Screening.findById(req.params.id).populate('movie').populate('hall');
    const { movies, halls } = await getFormData();
    res.render('screenings/edit', { screening, movies, halls, error, staff: req.session });
  };

  try {
    const { movieId, hallId, startTime } = req.body;
    const screening = await Screening.findById(req.params.id);
    if (!screening) return res.status(404).send('Screening not found');

    const movie = await Movie.findById(movieId);
    if (!movie) return renderEdit('Selected movie not found.');

    const hall = await Hall.findById(hallId);
    if (!hall) return renderEdit('Selected hall not found.');
    if (hall.isUnderMaintenance) return renderEdit(`Hall "${hall.name}" is currently under maintenance.`);

    const start = new Date(startTime);
    const end = calcEndTime(start, movie.duration);
    const overlapping = await checkOverlap(hallId, start, end, screening._id);

    if (overlapping.length > 0) {
      const info = overlapping.map(s => `"${s.movie.title}" at ${s.startTime.toLocaleString()}`).join('; ');
      return renderEdit(`Time conflicts with: ${info}`);
    }

    screening.movie = movieId;
    screening.hall = hallId;
    screening.startTime = start;
    screening.endTime = end;
    await screening.save();
    res.redirect('/dashboard?updated=1');
  } catch (error) {
    console.error('Error updating screening:', error);
    renderEdit('Failed to update screening: ' + error.message);
  }
});

// POST - Delete a screening
router.post('/:id/delete', async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id);
    if (!screening) return res.status(404).send('Screening not found');

    // Block deletion if customers have already booked seats for this screening
    const bookingCount = await Booking.countDocuments({ screening: screening._id });
    if (bookingCount > 0) {
      return res.redirect(
        `/admin/screenings/${screening._id}?error=` +
        encodeURIComponent(`Cannot delete screening. There are ${bookingCount} booking(s) for this screening. Cancel the bookings first.`)
      );
    }

    await Screening.findByIdAndDelete(req.params.id);
    res.redirect('/admin/screenings?deleted=1');
  } catch (error) {
    console.error('Error deleting screening:', error);
    res.redirect('/admin/screenings');
  }
});

module.exports = router;
