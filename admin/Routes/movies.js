const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Screening = require('../models/Screening');
const Genre = require('../models/Genre');

// List all movies render get (with filtering)
router.get('/', async (req, res) => {
  try {
    const { genre, status, search } = req.query;

    const query = {};

    // Search by title (case-insensitive)
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Genre filter (exact match, case-insensitive)
    if (genre && genre.trim()) {
      const escaped = genre.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.genre = { $regex: new RegExp(`^${escaped}$`, 'i') };
    }

    // Status filter (active/inactive)
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;

    const movies = await Movie.find(query).sort({ createdAt: -1 });

    // Get genres for filter dropdown: combine genres from movies + Genre collection
    const genresFromMovies = (await Movie.distinct('genre')).filter(Boolean).sort();
    const genresFromCollection = (await Genre.find().sort({ name: 1 })).map(g => g.name);
    const genreSet = new Set([...genresFromMovies, ...genresFromCollection]);
    const genreList = Array.from(genreSet).sort();

    const success = req.query.created ? 'Movie created successfully.' : req.query.updated ? 'Movie updated successfully.' : req.query.deleted ? 'Movie deleted successfully.' : null;
    res.render('movies/index', { 
      movies, 
      success, 
      genres: genreList,
      filters: { genre, status, search },
      staff: req.session 
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).send('Error fetching movies');
  }
});

// render for creating new movie
router.get('/new', async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.render('movies/new', { error: null, genres, staff: req.session });
  } catch (error) {
    console.error('Error loading movie form:', error);
    res.status(500).send('Error loading form');
  }
});

// form for creating new movie post
router.post('/', async (req, res) => {
  try {
    const { title, duration, description, genre, rating, isActive } = req.body;

    const newMovie = new Movie({
      title,
      duration: parseInt(duration), // in minutes
      description,
      genre,
      rating: parseFloat(rating),
      isActive: isActive === 'on' || isActive === true
    });

    await newMovie.save();
    res.redirect('/admin/movies?created=1');
  } catch (error) {
    console.error('Error creating movie:', error);
    const genres = await Genre.find().sort({ name: 1 });
    res.render('movies/new', { 
      error: 'Failed to create movie: ' + error.message,
      genres,
      staff: req.session 
    });
  }
});

//view movie by ID get render
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    const success = req.query.updated ? 'Movie updated successfully.' : null;
    const error = req.query.error ? decodeURIComponent(req.query.error) : null;

    if (!movie) {
      return res.status(404).send('Movie not found');
    }

    // Get upcoming screenings for this movie
    const upcomingScreenings = await Screening.find({ 
      movie: movie._id,
      startTime: { $gte: new Date() }
    })
    .populate('hall')
    .sort({ startTime: 1 });

    res.render('movies/view', { movie, upcomingScreenings, success, error, staff: req.session });
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).send('Error fetching movie');
  }
});

// Edit movie form get
router.get('/:id/edit', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).send('Movie not found');
    }

    const genres = await Genre.find().sort({ name: 1 });
    res.render('movies/edit', { movie, genres, error: null, staff: req.session });
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).send('Error fetching movie');
  }
});

// update movie form post
router.post('/:id', async (req, res) => {
  try {
    const { title, duration, description, genre, rating, isActive } = req.body;
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).send('Movie not found');
    }

    // Update movie fields
    movie.title = title;
    movie.duration = parseInt(duration);
    movie.description = description;
    movie.genre = genre;
    movie.rating = parseFloat(rating);
    movie.isActive = isActive === 'on' || isActive === true;

    await movie.save();
    res.redirect('/admin/movies/' + movie._id + '?updated=1');
  } catch (error) {
    console.error('Error updating movie:', error);
    const movie = await Movie.findById(req.params.id);
    const genres = await Genre.find().sort({ name: 1 });
    res.render('movies/edit', { 
      movie,
      genres,
      error: 'Failed to update movie: ' + error.message,
      staff: req.session 
    });
  }
});

// Delete movie post
router.post('/:id/delete', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).send('Movie not found');
    }

    // Check if movie has future screenings
    const futureScreenings = await Screening.countDocuments({
      movie: movie._id,
      startTime: { $gte: new Date() }
    });

    if (futureScreenings > 0) {
      return res.redirect('/admin/movies/' + movie._id + '?error=' + encodeURIComponent(`Cannot delete movie. There are ${futureScreenings} future screening(s) scheduled. Please cancel them first.`));
    }

    await Movie.findByIdAndDelete(req.params.id);
    res.redirect('/admin/movies?deleted=1');
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.redirect('/admin/movies?error=' + encodeURIComponent('Failed to delete movie.'));
  }
});

module.exports = router;