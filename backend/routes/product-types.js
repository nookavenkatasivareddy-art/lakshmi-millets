const express = require('express');
const ProductType = require('../models/ProductType');
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
    const types = await ProductType.find({ isActive: { $ne: false } }).sort({ name: 1 });
    res.json(types);
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

    const existing = await ProductType.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        message: `A product type with slug "${slug}" already exists`
      });
    }

    const type = await ProductType.create({
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
    const type = await ProductType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({ message: 'Product type not found' });
    }

    const { name, description, slug, isActive } = req.body;

    if (slug) {
      const newSlug = slugify(slug);
      const clash = await ProductType.findOne({
        slug: newSlug,
        _id: { $ne: type.id }
      });

      if (clash) {
        return res.status(409).json({
          message: `A product type with slug "${newSlug}" already exists`
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
    const type = await ProductType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({ message: 'Product type not found' });
    }

    const productCount = await Product.countDocuments({
      productTypeId: type.id
    });

    if (productCount > 0) {
      return res.status(409).json({
        message: `Cannot delete "${type.name}" — ${productCount} product(s) still use this product type.`
      });
    }

    await type.deleteOne();

    res.json({
      message: 'Product type deleted',
      id: req.params.id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
