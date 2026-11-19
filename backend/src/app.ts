import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import authRoutes from './routes/authRoutes';
import alertRoutes from './routes/alertRoutes';
import correlationRoutes from './routes/correlationRoutes';
import incidentRoutes from './routes/incidentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import threatIntelRoutes from './routes/threatIntelRoutes';
import demoRoutes from './routes/demoRoutes';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: '*',
      credentials: true,
    })
  );

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Serve sample data directory for one-click downloading in UI
  const sampleDataDir = path.resolve(__dirname, '../../sample-data');
  app.use('/sample-data', express.static(sampleDataDir));

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/correlation', correlationRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/threat-intelligence', threatIntelRoutes);
  app.use('/api/demo', demoRoutes);

  // Health root
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'AlertStormCorrelator', timestamp: new Date() });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
}
