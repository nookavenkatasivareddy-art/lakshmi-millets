const express = require('express');
const DeliveryLocation = require('../models/DeliveryLocation');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/delivery-locations - the supported cities/states with charges
router.get('/', async (req, res) => {
  try {
    const locations = await DeliveryLocation.find({ isActive: true }).sort({ city: 1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/delivery-locations/all - admin: all locations including inactive
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const locations = await DeliveryLocation.find({}).sort({ city: 1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/delivery-locations/:id - admin: update delivery location
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { deliveryCharge, freeDeliveryAbove, estimatedDays, isActive } = req.body;
    const loc = await DeliveryLocation.findById(req.params.id);
    if (!loc) return res.status(404).json({ message: 'Delivery location not found' });

    if (deliveryCharge !== undefined) loc.deliveryCharge = deliveryCharge;
    if (freeDeliveryAbove !== undefined) loc.freeDeliveryAbove = freeDeliveryAbove;
    if (estimatedDays !== undefined) loc.estimatedDays = estimatedDays;
    if (isActive !== undefined) loc.isActive = isActive;

    await loc.save();
    res.json(loc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/delivery-locations - admin: create delivery location
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { city, state, deliveryCharge, freeDeliveryAbove, estimatedDays } = req.body;
    const loc = await DeliveryLocation.create({
      city,
      state,
      deliveryCharge: deliveryCharge !== undefined ? deliveryCharge : 0,
      freeDeliveryAbove: freeDeliveryAbove !== undefined ? freeDeliveryAbove : 500,
      estimatedDays: estimatedDays || '1-2 days',
      isActive: true
    });
    res.status(201).json(loc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
