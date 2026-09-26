const express = require('express');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Public
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: { $ne: false } }).sort({ name: 1 });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin create
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'name is required' });
    }

    const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);

    const existing = await Brand.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        message: `A brand with slug "${slug}" already exists`
      });
    }

    const type = await Brand.create({
      name: name.trim(),
      slug,
      description
    });

    res.status(201).json(type);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin update
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const type = await Brand.findById(req.params.id);

    if (!type) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const { name, description, slug, isActive } = req.body;

    if (slug) {
      const newSlug = slugify(slug);
      const clash = await Brand.findOne({
        slug: newSlug,
        _id: { $ne: type.id }
      });

      if (clash) {
        return res.status(409).json({
          message: `A brand with slug "${newSlug}" already exists`
        });
      }

      type.slug = newSlug;
    }

    if (name !== undefined) type.name = name.trim();
    if (description !== undefined) type.description = description;
    if (isActive !== undefined) type.isActive = !!isActive;

    await type.save();
    res.json(type);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const type = await Brand.findById(req.params.id);

    if (!type) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const productCount = await Product.countDocuments({
      brandId: type.id
    });

    if (productCount > 0) {
      return res.status(409).json({
        message: `Cannot delete "${type.name}" — ${productCount} product(s) still use this brand.`
      });
    }

    await type.deleteOne();

    res.json({
      message: 'Brand deleted',
      id: req.params.id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
