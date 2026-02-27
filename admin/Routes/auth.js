const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.staffId) {
    return next();
  }
  //move to login page
  res.redirect('/auth/login');
}

// login page (GET)
router.get('/login', (req, res) => {
  if (req.session && req.session.staffId) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { error: null });
});

// login page (POST)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find staff by username
    const staff = await Staff.findOne({ username });
    
    if (!staff) {
      return res.render('auth/login', { error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await staff.comparePassword(password);
    
    if (!isMatch) {
      return res.render('auth/login', { error: 'Invalid username or password' });
    }

    // Create session
    req.session.staffId = staff._id;
    req.session.staffName = staff.name;
    req.session.staffRole = staff.role;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { error: 'An error occurred during login' });
  }
});

// render my register page (GET)
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null, success: null });
});

// Form registration portion for registering (POST`)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    // Check if username already exists
    const existingStaff = await Staff.findOne({ username });
    //return error if exist
    if (existingStaff) {
      return res.render('auth/register', { 
        error: 'Username or email already exists', 
        success: null 
      });
    }

    // Create new staff if error not found 
    const newStaff = new Staff({
      username,
      password, 
      name,
      email,
      role: role || 'staff' // default to staff
    });

    await newStaff.save();

    res.render('auth/register', { 
      error: null, 
      success: 'Staff account created successfully! You can now login' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', { 
      error: 'An error occurred during registration', 
      success: null 
    });
  }
});

// GET - Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
});

// Export both the router and the middleware to be used outside
module.exports = { router, isAuthenticated };
