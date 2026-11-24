import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback to workspace root .env if any

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { seedInitialHotlines } from './utils/seedHotlines.js';
import { seedInitialPermissions } from './utils/seedPermissions.js';

import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import formRoutes from './routes/formRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const app = express();
const projectRoot = path.resolve(__dirname, '..');
const clientBuild = path.join(projectRoot, 'frontend', 'dist');

app.use(cors({ origin: (origin, cb) => cb(null, true) }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api', formRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Fallback for any unmatched /api routes - ALWAYS return JSON, never HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

app.use(express.static(clientBuild));
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  }
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.use(errorHandler);

const port = process.env.PORT || 5001;
connectDB().then(async () => {
  await seedInitialPermissions();
  await seedInitialHotlines();
  app.listen(port, () => console.log(`AAP portal running on port ${port}`));
});
