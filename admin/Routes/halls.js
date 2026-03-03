const express = require('express');
const router = express.Router();
const Hall = require('../models/Hall');
const Screening = require('../models/Screening');

// List all halls (GET) with filtering
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};

    // Search by hall name (case-insensitive)
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // Status filter (operational/maintenance)
    if (status === 'operational') query.isUnderMaintenance = false;
    else if (status === 'maintenance') query.isUnderMaintenance = true;

    const halls = await Hall.find(query).sort({ name: 1 });

    const success = req.query.created ? 'Hall created successfully.' : req.query.updated ? 'Hall updated successfully.' : req.query.deleted ? 'Hall deleted successfully.' : null;
    res.render('halls/index', { 
      halls, 
      success, 
      filters: { status, search },
      staff: req.session 
    });
  } catch (error) {
    console.error('Error fetching halls:', error);
    res.status(500).send('Error fetching halls');
  }
});

// render creating new hall page (get)
router.get('/new', (req, res) => {
  res.render('halls/new', { error: null, staff: req.session });
});

// form for new hall (post)
router.post('/', async (req, res) => {
  try {
    const { name, rows, columns, wheelchairSeats, isUnderMaintenance } = req.body;
    const trimmedName = (name || '').trim();

    // Check for duplicate hall name (case-insensitive)
    const existing = await Hall.findOne({
      name: { $regex: new RegExp('^' + trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
    });
    if (existing) {
      return res.render('halls/new', {
        error: 'A hall with this name already exists.',
        staff: req.session
      });
    }

    // Parse wheelchair seats to array
    const wheelchairSeatsArray = wheelchairSeats 
      ? wheelchairSeats.split(',').map(seat => seat.trim()).filter(seat => seat)
      : [];

    const newHall = new Hall({
      name: trimmedName,
      rows: parseInt(rows), //form inputs are always in string so need parseint to database
      columns: parseInt(columns),
      wheelchairSeats: wheelchairSeatsArray,
      isUnderMaintenance: isUnderMaintenance === 'on' || isUnderMaintenance === true
    });

    await newHall.save();
    res.redirect('/admin/halls?created=1');
  } catch (error) {
    console.error('Error creating hall:', error);
    res.render('halls/new', { 
      error: 'Failed to create hall: ' + error.message,
      staff: req.session 
    });
  }
});

// View a single hall (Get)
router.get('/:id', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    
    if (!hall) {
      return res.status(404).send('Hall not found');
    }

    const success = req.query.updated ? 'Hall updated successfully.' : null;
    const error = req.query.error ? decodeURIComponent(req.query.error) : null;

    // Get upcoming screenings for this hall
    const upcomingScreenings = await Screening.find({ 
      hall: hall._id,
      startTime: { $gte: new Date() } //find only screenings that have date gte to current date
    })
    .populate('movie')
    .sort({ startTime: 1 })
    .limit(10);

    res.render('halls/view', { hall, upcomingScreenings, success, error, staff: req.session });
  } catch (error) {
    console.error('Error fetching hall:', error);
    res.status(500).send('Error fetching hall');
  }
});

// edit hall form res GET
router.get('/:id/edit', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    
    if (!hall) {
      return res.status(404).send('Hall not found');
    }

    res.render('halls/edit', { hall, error: null, staff: req.session });
  } catch (error) {
    console.error('Error fetching hall:', error);
    res.status(500).send('Error fetching hall');
  }
});

// form portion for editing hall POST
router.post('/:id', async (req, res) => {
  try {
    const { name, rows, columns, wheelchairSeats, isUnderMaintenance } = req.body;
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).send('Hall not found');
    }

    const trimmedName = (name || '').trim();

    // Check for duplicate hall name (case-insensitive), excluding current hall
    const existing = await Hall.findOne({
      _id: { $ne: hall._id },
      name: { $regex: new RegExp('^' + trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
    });
    if (existing) {
      const hallWithUpdates = {
        ...hall.toObject(),
        name: trimmedName,
        rows: parseInt(rows) || hall.rows,
        columns: parseInt(columns) || hall.columns,
        wheelchairSeats: wheelchairSeats
          ? wheelchairSeats.split(',').map(seat => seat.trim()).filter(seat => seat)
          : hall.wheelchairSeats,
        isUnderMaintenance: isUnderMaintenance === 'on' || isUnderMaintenance === true
      };
      return res.render('halls/edit', {
        hall: hallWithUpdates,
        error: 'A hall with this name already exists.',
        staff: req.session
      });
    }

    // Check if hall is being set to maintenance and has future screenings
    if (isUnderMaintenance === 'on' && !hall.isUnderMaintenance) {
      const futureScreenings = await Screening.countDocuments({
        hall: hall._id,
        startTime: { $gte: new Date() }
      });

      if (futureScreenings > 0) {
        return res.render('halls/edit', {
          hall,
          error: `Cannot set hall to maintenance. There are ${futureScreenings} future screening(s) scheduled. Please cancel or reschedule them first.`,
          staff: req.session
        });
      }
    }

    // Parse wheelchair seats
    const wheelchairSeatsArray = wheelchairSeats 
      ? wheelchairSeats.split(',').map(seat => seat.trim()).filter(seat => seat)
      : [];

    // Update hall
    hall.name = trimmedName;
    hall.rows = parseInt(rows);
    hall.columns = parseInt(columns);
    hall.wheelchairSeats = wheelchairSeatsArray;
    hall.isUnderMaintenance = isUnderMaintenance === 'on' || isUnderMaintenance === true;

    await hall.save();
    res.redirect('/admin/halls/' + hall._id + '?updated=1');
  } catch (error) {
    console.error('Error updating hall:', error);
    const hall = await Hall.findById(req.params.id);
    res.render('halls/edit', { 
      hall,
      error: 'Failed to update hall: ' + error.message,
      staff: req.session 
    });
  }
});

//delete hall post
router.post('/:id/delete', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).send('Hall not found');
    }

    // Block delete only if there are future screenings (past screenings are ignored)
    const futureScreeningsCount = await Screening.countDocuments({
      hall: hall._id,
      startTime: { $gte: new Date() }
    });

    if (futureScreeningsCount > 0) {
      const errorMsg = `Cannot delete hall. There are ${futureScreeningsCount} upcoming screening(s) for this hall. Please cancel or reschedule them first.`;
      return res.redirect(`/admin/halls/${hall._id}?error=${encodeURIComponent(errorMsg)}`);
    }

    await Hall.findByIdAndDelete(req.params.id);
    res.redirect('/admin/halls?deleted=1');
  } catch (error) {
    console.error('Error deleting hall:', error);
    res.status(500).json({ error: 'Failed to delete hall' });
  }
});

module.exports = router;
