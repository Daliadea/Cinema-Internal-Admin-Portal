const express = require('express');
const router = express.Router();
const Genre = require('../models/Genre');
const Movie = require('../models/Movie');

// List all genres
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    const success = req.query.created ? 'Genre added successfully.' : req.query.updated ? 'Genre updated successfully.' : req.query.deleted ? 'Genre deleted successfully.' : null;
    const error = req.query.error ? decodeURIComponent(req.query.error) : null;
    const showAddAnother = !!req.query.created;
    res.render('genres/index', { genres, success, error, showAddAnother, staff: req.session });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).send('Error fetching genres');
  }
});

// New genre form
router.get('/new', (req, res) => {
  res.render('genres/new', { error: null, staff: req.session });
});

// Create genre
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const trimmedName = name ? name.trim() : '';

    if (!trimmedName) {
      return res.render('genres/new', { error: 'Genre name is required', staff: req.session });
    }

    const existing = await Genre.findOne({ name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (existing) {
      return res.render('genres/new', { error: `Genre "${trimmedName}" already exists`, staff: req.session });
    }

    const genre = new Genre({ name: trimmedName });
    await genre.save();
    res.redirect('/admin/genres?created=1');
  } catch (error) {
    console.error('Error creating genre:', error);
    res.render('genres/new', { error: 'Failed to create genre: ' + error.message, staff: req.session });
  }
});

// Edit genre form
router.get('/:id/edit', async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('Genre not found');
    res.render('genres/edit', { genre, error: null, staff: req.session });
  } catch (error) {
    console.error('Error fetching genre:', error);
    res.status(500).send('Error fetching genre');
  }
});

// Update genre
router.post('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('Genre not found');

    const trimmedName = name ? name.trim() : '';
    if (!trimmedName) {
      return res.render('genres/edit', { genre, error: 'Genre name is required', staff: req.session });
    }

    const existing = await Genre.findOne({ 
      _id: { $ne: genre._id }, 
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });
    if (existing) {
      return res.render('genres/edit', { genre, error: `Genre "${trimmedName}" already exists`, staff: req.session });
    }

    const oldName = genre.name;
    genre.name = trimmedName;
    await genre.save();

    // Update all movies using the old genre name
    await Movie.updateMany({ genre: oldName }, { genre: trimmedName });

    res.redirect('/admin/genres?updated=1');
  } catch (error) {
    console.error('Error updating genre:', error);
    const genre = await Genre.findById(req.params.id);
    res.render('genres/edit', { genre, error: 'Failed to update genre: ' + error.message, staff: req.session });
  }
});

// Delete genre
router.post('/:id/delete', async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('Genre not found');

    const moviesUsingGenre = await Movie.countDocuments({ genre: genre.name });
    if (moviesUsingGenre > 0) {
      return res.redirect('/admin/genres?error=' + encodeURIComponent(`Cannot delete. ${moviesUsingGenre} movie(s) use this genre. Update them first.`));
    }

    await Genre.findByIdAndDelete(req.params.id);
    res.redirect('/admin/genres?deleted=1');
  } catch (error) {
    console.error('Error deleting genre:', error);
    res.status(500).send('Failed to delete genre');
  }
});

module.exports = router;
