const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Screening = require('../models/Screening');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');

function dedupeHalls(halls) {
  const seen = new Set();
  return halls.filter(h => {
    const key = h.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

//list all screenings get (with filtering)
router.get('/', async (req, res) => {
  try {
    const { dateFrom, dateTo, movieId, hallId, status } = req.query;
    const now = new Date();

    // Build date range conditions
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

    // Build query - use ObjectId for refs when valid
    const query = {};
    if (movieId && mongoose.Types.ObjectId.isValid(movieId)) {
      query.movie = new mongoose.Types.ObjectId(movieId);
    }
    if (hallId && mongoose.Types.ObjectId.isValid(hallId)) {
      query.hall = new mongoose.Types.ObjectId(hallId);
    }

    // Status + date range filter
    if (status === 'upcoming') {
      query.startTime = hasDateRange ? { $gt: now, ...dateRange } : { $gt: now };
    } else if (status === 'ongoing') {
      const startCond = { $lte: now };
      if (hasDateRange) {
        if (dateRange.$gte) startCond.$gte = dateRange.$gte;
        if (dateRange.$lte) {
          startCond.$lte = dateRange.$lte < now ? dateRange.$lte : now;
        }
      }
      query.$and = [
        { startTime: startCond },
        { endTime: { $gte: now } }
      ];
    } else if (status === 'past') {
      const endCond = { $lt: now };
      if (hasDateRange) {
        if (dateRange.$gte) endCond.$gte = dateRange.$gte;
        if (dateRange.$lte) endCond.$lte = dateRange.$lte;
      }
      query.endTime = endCond;
    } else if (hasDateRange) {
      query.startTime = dateRange;
    }

    const screenings = await Screening.find(query)
      .populate('movie')
      .populate('hall')
      .sort({ startTime: -1 });

    // Get movies and halls for filter dropdowns (deduplicate halls by name)
    const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
    const halls = dedupeHalls(await Hall.find().sort({ name: 1 }));

    const success = req.query.created ? 'Screening scheduled successfully.' : req.query.updated ? 'Screening updated successfully.' : req.query.deleted ? 'Screening deleted successfully.' : null;
    res.render('screenings/index', { 
      screenings, 
      success, 
      movies, 
      halls,
      filters: { dateFrom, dateTo, movieId, hallId, status },
      staff: req.session 
    });
  } catch (error) {
    console.error('Error fetching screenings:', error);
    res.status(500).send('Error fetching screenings');
  }
});

//Create new screening form get
router.get('/new', async (req, res) => {
  try {
    const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
    const halls = dedupeHalls(await Hall.find({ isUnderMaintenance: false }).sort({ name: 1 }));
    
    res.render('screenings/new', { 
      movies, 
      halls, 
      error: null, 
      staff: req.session 
    });
  } catch (error) {
    console.error('Error loading screening form:', error);
    res.status(500).send('Error loading screening form');
  }
});

// async function to help check if have screening overlap
async function checkOverlap(hallId, startTime, endTime, excludeScreeningId = null) {
  const query = {
    hall: hallId,
    $or: [
      // New screening starts during an existing screening
      { 
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      // New screening ends during an existing screening
      { 
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      // New screening completely encompasses an existing screening
      { 
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };

  // If updating, exclude the current screening from overlap check
  if (excludeScreeningId) {
    query._id = { $ne: excludeScreeningId };
  }

  const overlappingScreenings = await Screening.find(query)
    .populate('movie')
    .populate('hall');

  return overlappingScreenings;
}

// Create new screening post form
router.post('/', async (req, res) => {
  try {
    const { movieId, hallId, startTime } = req.body;

    // Validate inputs
    if (!movieId || !hallId || !startTime) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find({ isUnderMaintenance: false }).sort({ name: 1 }));
      return res.render('screenings/new', { 
        movies, 
        halls, 
        error: 'All fields are required',
        staff: req.session 
      });
    }

    // Get movie to calculate end time
    const movie = await Movie.findById(movieId);
    if (!movie) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find({ isUnderMaintenance: false }).sort({ name: 1 }));
      return res.render('screenings/new', { 
        movies, 
        halls, 
        error: 'Selected movie not found',
        staff: req.session 
      });
    }

    // Get hall and check if it's under maintenance
    const hall = await Hall.findById(hallId);
    if (!hall) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find({ isUnderMaintenance: false }).sort({ name: 1 }));
      return res.render('screenings/new', { 
        movies, 
        halls, 
        error: 'Selected hall not found',
        staff: req.session 
      });
    }

    if (hall.isUnderMaintenance) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find({ isUnderMaintenance: false }).sort({ name: 1 }));
      return res.render('screenings/new', { 
        movies, 
        halls, 
        error: `Hall "${hall.name}" is currently under maintenance and cannot be scheduled`,
        staff: req.session 
      });
    }

    // Calculate end time (add buffer time of 15 minutes for cleaning)
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (movie.duration + 15) * 60000); // duration in minutes + 15 min buffer

    // Check for overlapping screenings
    const overlapping = await checkOverlap(hallId, start, end);

    if (overlapping.length > 0) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find({ isUnderMaintenance: false }).sort({ name: 1 }));
      
      const overlappingInfo = overlapping.map(s => 
        `"${s.movie.title}" from ${s.startTime.toLocaleString()} to ${s.endTime.toLocaleString()}`
      ).join(', ');

      return res.render('screenings/new', { 
        movies, 
        halls, 
        error: `Screening time conflicts with existing screening(s) in ${hall.name}: ${overlappingInfo}`,
        staff: req.session 
      });
    }

    // Create new screening
    const newScreening = new Screening({
      movie: movieId,
      hall: hallId,
      startTime: start,
      endTime: end
    });

    await newScreening.save();
    res.redirect('/dashboard?created=1');
  } catch (error) {
    console.error('Error creating screening:', error);
    const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
    const halls = dedupeHalls(await Hall.find({ isUnderMaintenance: false }).sort({ name: 1 }));
    res.render('screenings/new', { 
      movies, 
      halls, 
      error: 'Failed to create screening: ' + error.message,
      staff: req.session 
    });
  }
});

// view screening get
router.get('/:id', async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id)
      .populate('movie')
      .populate('hall');
    
    if (!screening) {
      return res.status(404).send('Screening not found');
    }

    const success = req.query.updated ? 'Screening updated successfully.' : null;
    res.render('screenings/view', { screening, success, staff: req.session });
  } catch (error) {
    console.error('Error fetching screening:', error);
    res.status(500).send('Error fetching screening');
  }
});

// edit screening render get
router.get('/:id/edit', async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id)
      .populate('movie')
      .populate('hall');
    
    if (!screening) {
      return res.status(404).send('Screening not found');
    }

    const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
    const halls = dedupeHalls(await Hall.find().sort({ name: 1 })); // Show all halls for editing

    res.render('screenings/edit', { 
      screening, 
      movies, 
      halls, 
      error: null, 
      staff: req.session 
    });
  } catch (error) {
    console.error('Error fetching screening:', error);
    res.status(500).send('Error fetching screening');
  }
});

// POST - Update screening
router.post('/:id', async (req, res) => {
  try {
    const { movieId, hallId, startTime } = req.body;
    const screening = await Screening.findById(req.params.id);

    if (!screening) {
      return res.status(404).send('Screening not found');
    }

    // Get movie to calculate end time
    const movie = await Movie.findById(movieId);
    if (!movie) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find().sort({ name: 1 }));
      const currentScreening = await Screening.findById(req.params.id)
        .populate('movie')
        .populate('hall');
      return res.render('screenings/edit', { 
        screening: currentScreening, 
        movies, 
        halls, 
        error: 'Selected movie not found',
        staff: req.session 
      });
    }

    // Get hall and check if it's under maintenance
    const hall = await Hall.findById(hallId);
    if (!hall) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find().sort({ name: 1 }));
      const currentScreening = await Screening.findById(req.params.id)
        .populate('movie')
        .populate('hall');
      return res.render('screenings/edit', { 
        screening: currentScreening, 
        movies, 
        halls, 
        error: 'Selected hall not found',
        staff: req.session 
      });
    }

    if (hall.isUnderMaintenance) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find().sort({ name: 1 }));
      const currentScreening = await Screening.findById(req.params.id)
        .populate('movie')
        .populate('hall');
      return res.render('screenings/edit', { 
        screening: currentScreening, 
        movies, 
        halls, 
        error: `Hall "${hall.name}" is currently under maintenance`,
        staff: req.session 
      });
    }

    // Calculate new end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (movie.duration + 15) * 60000);

    // Check for overlapping screenings (excluding current screening)
    const overlapping = await checkOverlap(hallId, start, end, screening._id);

    if (overlapping.length > 0) {
      const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
      const halls = dedupeHalls(await Hall.find().sort({ name: 1 }));
      const currentScreening = await Screening.findById(req.params.id)
        .populate('movie')
        .populate('hall');
      
      const overlappingInfo = overlapping.map(s => 
        `"${s.movie.title}" from ${s.startTime.toLocaleString()} to ${s.endTime.toLocaleString()}`
      ).join('; ');

      return res.render('screenings/edit', { 
        screening: currentScreening, 
        movies, 
        halls, 
        error: `Screening time conflicts with existing screening(s): ${overlappingInfo}`,
        staff: req.session 
      });
    }

    // Update screening
    screening.movie = movieId;
    screening.hall = hallId;
    screening.startTime = start;
    screening.endTime = end;

    await screening.save();
    res.redirect('/dashboard?updated=1');
  } catch (error) {
    console.error('Error updating screening:', error);
    const movies = await Movie.find({ isActive: true }).sort({ title: 1 });
    const halls = dedupeHalls(await Hall.find().sort({ name: 1 }));
    const screening = await Screening.findById(req.params.id)
      .populate('movie')
      .populate('hall');
    res.render('screenings/edit', { 
      screening, 
      movies, 
      halls, 
      error: 'Failed to update screening: ' + error.message,
      staff: req.session 
    });
  }
});

// POST - Delete screening
router.post('/:id/delete', async (req, res) => {
  try {
    const screening = await Screening.findById(req.params.id);

    if (!screening) {
      return res.status(404).json({ error: 'Screening not found' });
    }

    await Screening.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard?deleted=1');
  } catch (error) {
    console.error('Error deleting screening:', error);
    res.status(500).json({ error: 'Failed to delete screening' });
  }
});

module.exports = router;
