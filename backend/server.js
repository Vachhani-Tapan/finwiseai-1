import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import netWorthRoutes from './routes/netWorthRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import aiAdvisorRoutes from './routes/aiAdvisorRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import debtRoutes from './routes/debtRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL];
    if (!origin || allowedOrigins.includes(origin) || (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => res.status(200).send('OK'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/networth', netWorthRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/ai-advisor', aiAdvisorRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api', portfolioRoutes);
app.use('/api/debts', debtRoutes);


// Database Connection & Server Start
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finwiseai';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
