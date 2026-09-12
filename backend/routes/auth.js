const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const notify = require('../services/notify');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  addresses: user.addresses || []
});

// @route  POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: bcrypt.hashSync(password, 10),
      role: 'customer',
      addresses: []
    });

    const token = signToken(newUser);
    res.status(201).json({ token, user: toSafeUser(newUser) });
    // Dashboard notification: new customer registered
    notify.createNotification({
      type: 'new_customer',
      title: 'New customer registered',
      message: `${newUser.name} (${newUser.email}) just created an account.`,
      userId: newUser.id,
      link: '/admin/users'
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    // Admin block / deactivate support
    if (user.blocked) return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
    if (user.status === 'inactive') return res.status(403).json({ message: 'Your account is inactive. Contact support.' });

    const token = signToken(user);
    res.json({ token, user: toSafeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route  PUT /api/auth/change-password  (logged-in user, incl. admin profile)
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = bcrypt.compareSync(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// @route  GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: toSafeUser(req.user) });
});


// GET /api/auth/addresses - saved addresses for the logged-in user
router.get('/addresses', protect, (req, res) => {
  res.json({ addresses: req.user.toJSON().addresses || [] });
});
// @route  POST /api/auth/address  (add a delivery address to profile)
router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.addresses.push(req.body);
    await user.save();

    res.status(201).json({ addresses: user.toJSON().addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
