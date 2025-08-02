import express, { NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorMiddleware } from './utils/errorMiddleware';
import sipConfigRoutes from './routes/sipConfig.routes';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/sip-config', sipConfigRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log('Available routes:');
  console.log('- GET /api/sip-config');
  console.log('- GET /api/sip-config/:id');
  console.log('- GET /api/sip-config/available');
  console.log('- GET /api/sip-config/available/next');
  console.log('- PUT /api/sip-config/:id');
  console.log('- PUT /api/sip-config/:id/assign');
  console.log('- PUT /api/sip-config/:id/release');
  console.log('- GET /api/sip-config/stats/overview');
});

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createApiError = (message: string, statusCode: number = 500) => {
  return new ApiError(message, statusCode);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};