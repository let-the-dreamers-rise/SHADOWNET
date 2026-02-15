import express, { Express } from 'express';
import cors from 'cors';
import { Config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { errorHandler, requestLogger, notFoundHandler } from './middleware.js';

export function createServer(config: Config): Express {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      service: 'shadownet'
    });
  });

  // API routes will be added here
  // app.use('/api', apiRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export function startServer(app: Express, port: number): void {
  app.listen(port, () => {
    logger.info(`SHADOWNET server started on port ${port}`);
  });
}
