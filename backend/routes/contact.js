const express = require('express');
const Message = require('../models/Message');
const { createNotification } = require('../services/notify');
const router = express.Router();

// POST /api/contact - public contact form endpoint (customer website).
// Saves the message to MongoDB and raises a new_message notification
// for the admin dashboard.
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: 'Name and message are required' });
    }

    const msg = await Message.create({
      name: String(name).trim(),
      email: email ? String(email).trim() : '',
      phone: phone ? String(phone).trim() : '',
      subject: subject ? String(subject).trim() : 'General enquiry',
      message: String(message).trim()
    });

    await createNotification({
      type: 'new_message',
      title: 'New contact message',
      message: `${msg.name} sent a message: "${(msg.subject || msg.message).slice(0, 80)}"`,
      link: '/admin/messages'
    });

    res.status(201).json({ message: 'Message received! We will get back to you soon.', id: msg.id });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to send message' });
  }
});

module.exports = router;
