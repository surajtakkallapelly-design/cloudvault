import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

// Connect to Database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Required to serve static uploads from backend to React app
  crossOriginEmbedderPolicy: false,
  frameguard: false, // Allow PDFs and media to be rendered in iframes on client side
  contentSecurityPolicy: false, // Disable default CSP constraints that block iframe embeddings
}));
app.use(cors());
app.use(express.json());

// Create uploads folder if not exists (for local mock storage)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically for local fallback access
app.use('/uploads', express.static(uploadsDir));

// Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Micro-Google Drive API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
