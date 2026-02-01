import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoute.js';
import cors from 'cors';

dotenv.config();
connectDB();

const app = express();

// --- CORS CONFIGURATION ---
// This allows all origins, methods, and headers, preventing any "403" or "Blocked" errors
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Basic Health Check (Useful for Render to see if the app is alive)
app.get('/', (req, res) => {
  res.send('MomFood API is running...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 10000; // Render uses 10000 by default
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));