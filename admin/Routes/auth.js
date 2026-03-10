const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Staff = require('../models/Staff');

// Create the email transporter.
// If real Gmail credentials are set in .env, use Gmail.
// Otherwise create a free Ethereal test account — emails are captured locally
// and a preview URL is printed to the terminal instead of being sent for real.
async function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  // Ethereal: auto-creates a throwaway test account
  const testAccount = await nodemailer.createTestAccount();
  console.log('Using Ethereal test email account:', testAccount.user);
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

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

    // Server-side validation
    if (!password || password.length < 6) {
      return res.render('auth/register', { error: 'Password must be at least 6 characters long.', success: null });
    }

    // Check if the username or email is already taken
    const existingStaff = await Staff.findOne({ $or: [{ username }, { email }] });
    if (existingStaff) {
      const error = existingStaff.username === username
        ? 'Username already exists.'
        : 'Email is already registered.';
      return res.render('auth/register', { error, success: null });
    }

    // Create new staff — role is always 'staff' for self-registration
    const newStaff = new Staff({
      username,
      password, 
      name,
      email,
      role: 'staff'
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

// GET - Forgot password form
router.get('/forgot-password', (req, res) => {
  if (req.session && req.session.staffId) return res.redirect('/dashboard');
  res.render('auth/forgot-password', { error: null, success: null, devResetURL: null, etherealURL: null });
});

// POST - Send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const staff = await Staff.findOne({ email });

    // Always show the same success message to avoid user enumeration
    const successMsg = 'If an account with that email exists, a password reset link has been sent.';

    if (!staff) {
      return res.render('auth/forgot-password', { error: null, success: successMsg, devResetURL: null, etherealURL: null });
    }

    // Generate a secure random token (1-hour expiry)
    const token = crypto.randomBytes(32).toString('hex');
    staff.resetPasswordToken = token;
    staff.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await staff.save();

    const resetURL = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;

    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@cinevillage.local',
      to: staff.email,
      subject: 'Password Reset — CineVillage Admin Portal',
      text: `Hi ${staff.name},\n\nClick the link below to reset your password. It expires in 1 hour.\n\n${resetURL}\n\nIf you did not request this, ignore this email.`
    });

    // If using Ethereal (local testing), print both URLs to the terminal
    const etherealURL = nodemailer.getTestMessageUrl(info) || null;
    if (etherealURL) {
      console.log('-------------------------------------------');
      console.log('RESET LINK:   ', resetURL);
      console.log('EMAIL PREVIEW:', etherealURL);
      console.log('-------------------------------------------');
    }

    res.render('auth/forgot-password', { error: null, success: successMsg, devResetURL: null, etherealURL });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('auth/forgot-password', { error: 'Something went wrong. Please try again.', success: null, devResetURL: null, etherealURL: null });
  }
});

// GET - Reset password form
router.get('/reset-password/:token', async (req, res) => {
  try {
    const staff = await Staff.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!staff) {
      return res.render('auth/reset-password', {
        token: null,
        error: 'This password reset link is invalid or has expired.',
        success: null
      });
    }

    res.render('auth/reset-password', { token: req.params.token, error: null, success: null });
  } catch (err) {
    console.error('Reset password GET error:', err);
    res.render('auth/reset-password', { token: null, error: 'Something went wrong. Please try again.', success: null });
  }
});

// POST - Process new password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 6) {
      return res.render('auth/reset-password', {
        token: req.params.token,
        error: 'Password must be at least 6 characters long.',
        success: null
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/reset-password', {
        token: req.params.token,
        error: 'Passwords do not match.',
        success: null
      });
    }

    const staff = await Staff.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!staff) {
      return res.render('auth/reset-password', {
        token: null,
        error: 'This password reset link is invalid or has expired.',
        success: null
      });
    }

    staff.password = password;
    staff.resetPasswordToken = null;
    staff.resetPasswordExpires = null;
    await staff.save();

    res.render('auth/reset-password', {
      token: null,
      error: null,
      success: 'Your password has been reset successfully. You can now log in.'
    });
  } catch (err) {
    console.error('Reset password POST error:', err);
    res.render('auth/reset-password', {
      token: req.params.token,
      error: 'Something went wrong. Please try again.',
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
