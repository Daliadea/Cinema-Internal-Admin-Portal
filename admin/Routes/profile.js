const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// Profile page
router.get('/', async (req, res) => {
  try {
    const profile = await Staff.findById(req.session.staffId).select('-password');
    if (!profile) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }
    const success = req.query.updated ? 'Profile updated successfully.' : req.query.pwd ? 'Password changed successfully.' : null;
    res.render('profile/index', { profile, success, error: null, staff: req.session });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).send('Error loading profile');
  }
});

// Update profile (name, email)
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    const staff = await Staff.findById(req.session.staffId);

    if (!staff) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }

    if (!name || !name.trim()) {
      return res.render('profile/index', { profile: staff, success: null, error: 'Name is required', staff: req.session });
    }

    // Check email uniqueness if changed
    if (email && email.trim() !== staff.email) {
      const existing = await Staff.findOne({ email: email.trim(), _id: { $ne: staff._id } });
      if (existing) {
        return res.render('profile/index', { profile: staff, success: null, error: 'Email already in use by another account', staff: req.session });
      }
    }

    staff.name = name.trim();
    staff.email = email ? email.trim() : staff.email;
    await staff.save();

    req.session.staffName = staff.name;
    res.redirect('/profile?updated=1');
  } catch (error) {
    console.error('Error updating profile:', error);
    const profile = await Staff.findById(req.session.staffId).select('-password');
    res.render('profile/index', { profile, success: null, error: 'Failed to update profile', staff: req.session });
  }
});

// Change password
router.post('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const staff = await Staff.findById(req.session.staffId);

    if (!staff) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }

    const isMatch = await staff.comparePassword(currentPassword);
    if (!isMatch) {
      const profile = await Staff.findById(req.session.staffId).select('-password');
      return res.render('profile/index', { profile, success: null, error: 'Current password is incorrect', staff: req.session });
    }

    if (!newPassword || newPassword.length < 6) {
      const profile = await Staff.findById(req.session.staffId).select('-password');
      return res.render('profile/index', { profile, success: null, error: 'New password must be at least 6 characters', staff: req.session });
    }

    if (newPassword !== confirmPassword) {
      const profile = await Staff.findById(req.session.staffId).select('-password');
      return res.render('profile/index', { profile, success: null, error: 'New passwords do not match', staff: req.session });
    }

    staff.password = newPassword;
    await staff.save();
    res.redirect('/profile?pwd=1');
  } catch (error) {
    console.error('Error changing password:', error);
    const profile = await Staff.findById(req.session.staffId).select('-password');
    res.render('profile/index', { profile, success: null, error: 'Failed to change password', staff: req.session });
  }
});

module.exports = router;
