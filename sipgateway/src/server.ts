import express from 'express';
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

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log('Available routes:');
  console.log('- GET /api/sip-config');
  console.log('- GET /api/sip-config/:id');
  console.log('- GET /api/sip-config/available/next');
  console.log('- PUT /api/sip-config/:id/assign');
  console.log('- PUT /api/sip-config/:id/release');
  console.log('- GET /api/sip-config/stats/overview');
}); 