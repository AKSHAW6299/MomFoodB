import express from 'express';
import { Product } from '../models/Product.js'; // MUST have .js and match case
import { protect, adminOnly } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;