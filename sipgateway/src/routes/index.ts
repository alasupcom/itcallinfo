import { Router } from 'express';
import sipConfigRoutes from './sipConfig.routes';

const router = Router();

router.use('/sip-config', sipConfigRoutes);

export default router;
