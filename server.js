import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import spaceRoutes from './routes/spaceRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

// CORS Configuration (dynamic origin + explicit OPTIONS handling)
const allowedOrigins = [
  'https://prompt-gallery-client.vercel.app',
  'http://localhost:3000'
  // you can add your Render app URL here if needed (or use env var)
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Ensure Vary header so caches respect origin-specific responses
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

app.use(cors(corsOptions));
// handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Connect Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', spaceRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('PromptOS API is running...');
});

// JSON error handler to avoid HTML error pages
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS error' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
