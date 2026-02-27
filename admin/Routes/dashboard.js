const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');
const Screening = require('../models/Screening');

// Render everything on the dashboard
router.get('/', async (req, res) => {
  try {
    const { viewDate, movieId, hallId, upcomingLimit } = req.query;

    // Get total active movies
    const totalActiveMovies = await Movie.countDocuments({ isActive: true });

    // Date for "Today's Schedule" - default to today, or use filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let scheduleDate = today;
    if (viewDate) {
      const d = new Date(viewDate);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        scheduleDate = d;
      }
    }
    const scheduleEnd = new Date(scheduleDate);
    scheduleEnd.setDate(scheduleEnd.getDate() + 1);

    // Build query for today's/schedule date screenings
    const scheduleQuery = {
      startTime: { $gte: scheduleDate, $lt: scheduleEnd }
    };
    if (movieId && mongoose.Types.ObjectId.isValid(movieId)) {
      scheduleQuery.movie = new mongoose.Types.ObjectId(movieId);
    }
    if (hallId && mongoose.Types.ObjectId.isValid(hallId)) {
      scheduleQuery.hall = new mongoose.Types.ObjectId(hallId);
    }

    // Get total screenings for schedule date
    const todayScreeningsCount = await Screening.countDocuments(scheduleQuery);

    // Get schedule date screenings with details
    const todayScreenings = await Screening.find(scheduleQuery)
      .populate('movie')
      .populate('hall')
      .sort({ startTime: 1 });

    // Upcoming screenings - apply movie/hall filters
    const upcomingQuery = { startTime: { $gte: new Date() } };
    if (movieId && mongoose.Types.ObjectId.isValid(movieId)) {
      upcomingQuery.movie = new mongoose.Types.ObjectId(movieId);
    }
    if (hallId && mongoose.Types.ObjectId.isValid(hallId)) {
      upcomingQuery.hall = new mongoose.Types.ObjectId(hallId);
    }
    const limit = Math.min(parseInt(upcomingLimit) || 10, 50);

    const upcomingScreenings = await Screening.find(upcomingQuery)
      .populate('movie')
      .populate('hall')
      .sort({ startTime: 1 })
      .limit(limit);

    // Get total halls number and maintenance number
    const totalHalls = await Hall.countDocuments();
    const hallsUnderMaintenance = await Hall.countDocuments({ isUnderMaintenance: true });

    // Get total movies
    const totalMovies = await Movie.countDocuments();

    // Get total upcoming screenings (unfiltered for stat)
    const totalUpcomingScreenings = await Screening.countDocuments({
      startTime: { $gte: new Date() }
    });

    // Get movies and halls for filter dropdowns (deduplicate halls by name)
    const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
    const allHalls = await Hall.find().sort({ name: 1 });
    const seenNames = new Set();
    const halls = allHalls.filter(h => {
      const key = h.name.toLowerCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    // Success message from redirects
    const success = req.query.created ? 'Screening scheduled successfully.' 
      : req.query.updated ? 'Screening updated successfully.' 
      : req.query.deleted ? 'Screening deleted successfully.' 
      : null;

    res.render('dashboard/index', {
      totalActiveMovies,
      todayScreeningsCount,
      todayScreenings,
      upcomingScreenings,
      totalHalls,
      hallsUnderMaintenance,
      totalMovies,
      totalUpcomingScreenings,
      success,
      movies,
      halls,
      filters: { viewDate, movieId, hallId, upcomingLimit: upcomingLimit || '10' },
      staff: req.session
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

module.exports = router;
