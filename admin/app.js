const express = require("express");
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

// Connect to MongoDB 
const Genre = require('./models/Genre');
mongoose.connect('mongodb://127.0.0.1:27017/cinema_admin')
  .then(async () => {
    console.log('Connected to MongoDB!');
    // Seed default genres if none exist
    const count = await Genre.countDocuments();
    if (count === 0) {
      const defaults = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'];
      await Genre.insertMany(defaults.map(name => ({ name })));
      console.log('Seeded default genres');
    }
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'aikensSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Import routes
const { router: authRouter, isAuthenticated } = require('./Routes/auth');
const dashboardRouter = require('./Routes/dashboard');
const moviesRouter = require('./Routes/movies');
const hallsRouter = require('./Routes/halls');
const screeningsRouter = require('./Routes/screenings');
const genresRouter = require('./Routes/genres');
const profileRouter = require('./Routes/profile');

// Public routes 
app.use('/auth', authRouter);

// Root redirect
app.get('/', (req, res) => {
  if (req.session && req.session.staffId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// Protect /admin base path: redirect to dashboard if logged in, else to login
app.get('/admin', isAuthenticated, (req, res) => res.redirect('/dashboard'));

// Protected routes
app.use('/dashboard', isAuthenticated, dashboardRouter);
app.use('/profile', isAuthenticated, profileRouter);
app.use('/admin/movies', isAuthenticated, moviesRouter);
app.use('/admin/halls', isAuthenticated, hallsRouter);
app.use('/admin/screenings', isAuthenticated, screeningsRouter);
app.use('/admin/genres', isAuthenticated, genresRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { errorMessage: err.message });
});

app.listen(port, () => {
  console.log(`Cinema Admin Portal running on http://localhost:${port}`);
});