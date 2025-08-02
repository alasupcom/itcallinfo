import { Router, Request, Response, NextFunction } from "express";
import { sipConfigService } from '../services/sipConfig.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/sip-config - Get all SIP configurations
router.get('/', asyncHandler(async (req: Request, res:Response) => {
  const { available, status, limit, offset } = req.query;
  
  const configs = await sipConfigService.getAllConfigurations({
    available: available === 'true' ? true : available === 'false' ? false : undefined,
    status: status as 'enabled' | 'disabled' | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined
  });

  res.json({
    success: true,
    data: configs,
    total: configs.length
  });
}));

// GET /api/sip-config/available/next - Get next available SIP configuration
router.get('/available/next', asyncHandler(async (req: Request, res:Response) => {
  const config = await sipConfigService.getNextAvailableConfiguration();
  
  if (!config) {
    return res.status(404).json({
      success: false,
      error: 'No available SIP configurations found',
      code: 'NO_AVAILABLE_CONFIGS'
    });
  }

  res.json({
    success: true,
    data: config
  });
}));

// GET /api/sip-config/available - Get all available SIP configurations
router.get('/available', asyncHandler(async (req: Request, res:Response) => {
  const configs = await sipConfigService.getAllConfigurations({ 
    available: true, 
    status: 'enabled' 
  });

  res.json({
    success: true,
    data: configs
  });
}));

// GET /api/sip-config/stats/overview - Get statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res:Response) => {
  const [availableCount, assignedCount] = await Promise.all([
    sipConfigService.getAvailableCount(),
    sipConfigService.getAssignedCount()
  ]);

  const total = availableCount + assignedCount;
  const percentage_used = total > 0 ? Math.round((assignedCount / total) * 100) : 0;

  res.json({
    success: true,
    data: {
      total,
      available: availableCount,
      assigned: assignedCount,
      percentage_used
    }
  });
}));

// GET /api/sip-config/:id - Get SIP configuration by ID
router.get('/:id', asyncHandler(async (req: Request, res:Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }
  
  const config = await sipConfigService.getConfigurationById(id);
  
  if (!config) {
    return res.status(404).json({
      success: false,
      error: 'SIP configuration not found',
      code: 'NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: config
  });
}));

// PUT /api/sip-config/:id/assign - Assign SIP configuration to user
router.put('/:id/assign', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { userId, username, userEmail } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }

  if (!userId || !username) {
    return res.status(400).json({
      success: false,
      error: 'userId and username are required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  const config = await sipConfigService.assignConfiguration(id, userId, username, userEmail);
  
  if (!config) {
    return res.status(409).json({
      success: false,
      error: 'SIP configuration not found or already assigned',
      code: 'ALREADY_ASSIGNED'
    });
  }

  res.json({
    success: true,
    data: config
  });
}));

// PUT /api/sip-config/:id/release - Release SIP configuration
router.put('/:id/release', asyncHandler(async (req: Request, res:Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }

  const config = await sipConfigService.releaseConfiguration(id);
  
  if (!config) {
    return res.status(404).json({
      success: false,
      error: 'SIP configuration not found',
      code: 'NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: config
  });
}));

// PUT /api/sip-config/:id - Update SIP configuration
router.put('/:id', asyncHandler(async (req: Request, res:Response) => {
  const id = parseInt(req.params.id);
  const updateData = req.body;

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }

  // Validate that at least one field is provided
  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one field must be provided for update',
      code: 'MISSING_UPDATE_FIELDS'
    });
  }

  // Allowed fields for update
  const allowedFields = [
    'sipusername', 'sippass', 'sipdomain', 'siptransport', 
    'username', 'userEmail', 'sipaccountStatus', 'status'
  ];

  // Filter out invalid fields
  const validUpdateData: any = {};
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      validUpdateData[key] = value;
    }
  }

  if (Object.keys(validUpdateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid fields provided for update',
      code: 'INVALID_UPDATE_FIELDS'
    });
  }

  const config = await sipConfigService.updateConfiguration(id, validUpdateData);
  
  if (!config) {
    return res.status(404).json({
      success: false,
      error: 'SIP configuration not found',
      code: 'NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: config,
    message: 'SIP configuration updated successfully'
  });
}));

export default router;