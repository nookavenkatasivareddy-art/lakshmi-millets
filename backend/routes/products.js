const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Joins the product's categoryId with the full category, the same way
// the old JSON-file version did — just backed by a real query now.
async function attachCategory(product) {
  const category = await Category.findById(product.categoryId);
  const obj = product.toJSON();
  obj.category = category ? { id: category.id, name: category.name, slug: category.slug } : null;
  return obj;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Resolves categoryId from either a categoryId or a categorySlug in the body
async function resolveCategoryId({ categoryId, categorySlug }) {
  if (categoryId) {
    const cat = await Category.findById(categoryId);
    return cat ? cat.id : null;
  }
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug });
    return cat ? cat.id : null;
  }
  return null;
}

// ------------------------------------------------------------------
// Public routes
// ------------------------------------------------------------------

// GET /api/products?category=slug&popular=true&search=foxtail&inStock=true
router.get('/', async (req, res) => {
  try {
    const { category, popular, search, inStock } = req.query;
    const filter = {};

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (!cat) return res.json([]); // unknown category slug -> no results
      filter.categoryId = cat.id;
    }
    if (popular === 'true') {
      filter.isPopular = true;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }
    // Admin can disable a product from the dashboard; hide those on the shop
    filter.isActive = { $ne: false };

    const products = await Product.find(filter);
    const shaped = await Promise.all(products.map(attachCategory));
    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(await attachCategory(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------------------------------------------
// Admin routes (require a valid JWT for a user with role "admin")
// ------------------------------------------------------------------

// POST /api/products - create a new product
// body: { name, categoryId | categorySlug, price, mrp, weight, image, description, stock, isPopular, slug? }
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, mrp, weight, image, description, stock, isPopular } = req.body;

    if (!name || price == null || mrp == null) {
      return res.status(400).json({ message: 'name, price and mrp are required' });
    }

    const categoryId = await resolveCategoryId(req.body);
    if (!categoryId) return res.status(400).json({ message: 'A valid categoryId or categorySlug is required' });

    const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);
    const existing = await Product.findOne({ slug });
    if (existing) return res.status(409).json({ message: `A product with slug "${slug}" already exists` });

    const product = await Product.create({
      name,
      slug,
      categoryId,
      price,
      mrp,
      weight,
      image,
      description,
      stock: stock ?? 0,
      isPopular: !!isPopular
    });

    res.status(201).json(await attachCategory(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id - update any product fields (name, price, mrp, image, category, description, isPopular...)
// Use this for editing prices, swapping images, renaming, recategorizing, etc.
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, price, mrp, weight, image, description, stock, isPopular, slug } = req.body;

    if (req.body.categoryId || req.body.categorySlug) {
      const categoryId = await resolveCategoryId(req.body);
      if (!categoryId) return res.status(400).json({ message: 'categoryId/categorySlug did not match any category' });
      product.categoryId = categoryId;
    }

    if (slug) {
      const newSlug = slugify(slug);
      const clash = await Product.findOne({ slug: newSlug, _id: { $ne: product.id } });
      if (clash) return res.status(409).json({ message: `A product with slug "${newSlug}" already exists` });
      product.slug = newSlug;
    }

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (mrp !== undefined) product.mrp = mrp;
    if (weight !== undefined) product.weight = weight;
    if (image !== undefined) product.image = image;
    if (description !== undefined) product.description = description;
    if (stock !== undefined) product.stock = Math.max(0, stock);
    if (isPopular !== undefined) product.isPopular = !!isPopular;
    if (req.body.isActive !== undefined) product.isActive = !!req.body.isActive;

    await product.save();
    res.json(await attachCategory(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/products/:id/stock - quick, dedicated stock update
// body: { stock: 25 }        -> sets stock to an exact number
// body: { delta: -3 }        -> adjusts stock up/down by an amount (e.g. after a manual sale)
router.patch('/:id/stock', protect, adminOnly, async (req, res) => {
  try {
    const { stock, delta } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (stock !== undefined) {
      if (stock < 0) return res.status(400).json({ message: 'Stock cannot be negative' });
      product.stock = stock;
    } else if (delta !== undefined) {
      product.stock = Math.max(0, product.stock + delta);
    } else {
      return res.status(400).json({ message: 'Provide either "stock" (exact value) or "delta" (adjustment)' });
    }

    await product.save();
    res.json({
      id: product.id,
      name: product.name,
      stock: product.stock,
      inStock: product.stock > 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:slug/reviews - public reviews for a product
router.get('/:slug/reviews', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const reviews = await Review.find({ productId: product.id })
      .sort({ createdAt: -1 })
      .limit(100);
    const total = reviews.length;
    const average = total
      ? Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / total) * 10) / 10
      : 0;
    res.json({ total, average, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products/:slug/reviews - public: leave a review
router.post('/:slug/reviews', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const rating = parseInt(req.body.rating, 10);
    const comment = (req.body.comment || '').trim();
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please choose a rating from 1 to 5 stars' });
    }
    if (!comment) {
      return res.status(400).json({ message: 'Please write a short review' });
    }

    const review = await Review.create({
      productId: product.id,
      productName: product.name,
      userName: (req.body.userName || 'Customer').trim() || 'Customer',
      rating,
      comment
    });

    res.status(201).json({ message: 'Review submitted. Thank you!', review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
