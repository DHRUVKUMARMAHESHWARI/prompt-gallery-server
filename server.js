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

// CORS Configuration
const corsOptions = {
  origin: ['https://prompt-gallery-client.vercel.app', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
