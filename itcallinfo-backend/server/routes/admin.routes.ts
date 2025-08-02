import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { isAuthenticated } from "../middleware/auth";
import storage from "../storage";
import { SipConfigAxiosClient } from '../services/sipConfigApi';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();
const sipConfigClient = new SipConfigAxiosClient();

const isAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as any;
  
  if (!user || user.username !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  
  next();
};

router.post("/login", (async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username === 'admin' && password === '123456') {
      let adminUser = await storage.getUserByEmail('admin@itcallinfo.com');
      
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        adminUser = await storage.createUser({
          username: 'admin',
          email: 'admin@itcallinfo.com',
          password: hashedPassword,
          fullName: 'System Administrator',
          status: 'active',
          isVerified: true,
          role: 'admin'
        });
      } else {
        if (adminUser.role !== 'admin') {
          const updatedUser = await storage.updateUser(adminUser.id, { role: 'admin' });
          if (updatedUser) {
            adminUser = updatedUser;
          }
        }
      }

      if (!adminUser) {
        return res.status(500).json({ error: 'Failed to create or update admin user' });
      }

      req.logIn(adminUser, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        
        res.json({ 
          user: { 
            id: adminUser.id, 
            username: adminUser.username, 
            email: adminUser.email,
            fullName: adminUser.fullName,
            role: 'admin'
          } 
        });
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

const getStats: RequestHandler = async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    let sipStats = null;
    let sipRangeStats = null;

    try {
      sipStats = await sipConfigClient.getStats();
    } catch (error) {
    }

    try {
      sipRangeStats = await sipConfigClient.getStatsForRange();
    } catch (error) {
    }

    const stats = {
      users: {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        online: users.filter(u => u.status === 'online').length,
        offline: users.filter(u => u.status === 'offline').length,
        verified: users.filter(u => u.isVerified).length,
        unverified: users.filter(u => !u.isVerified).length
      },
      sip: {
        gateway: sipStats,
        range: sipRangeStats
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUsers: RequestHandler = async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserById: RequestHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const localSipConfig = await storage.getSipConfig(userId);
    
    let sipConfig: any = null;
    if (localSipConfig) {
      sipConfig = await sipConfigClient.getConfigById(localSipConfig.sipConfigId);
    }
    
    res.json({
      user,
      sipConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser: RequestHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { fullName, phoneNumber, email } = req.body;

    const user = await storage.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.email === 'admin@itcallinfo.com' || user.username === 'admin') {
      res.status(403).json({ error: 'Cannot modify admin accounts' });
      return;
    }

    if (email && email !== user.email) {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ error: 'Email already in use' });
        return;
      }
    }

    const updatedUser = await storage.updateUser(userId, {
      fullName: fullName || user.fullName,
      phoneNumber: phoneNumber || user.phoneNumber,
      email: email || user.email
    });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deactivateUser: RequestHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.email === 'admin@itcallinfo.com' || user.username === 'admin') {
      res.status(403).json({ error: 'Cannot deactivate admin accounts' });
      return;
    }

    const deactivatedUser = await storage.deactivateUser(userId);
    
    if (!deactivatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const sipConfig = await storage.getSipConfig(userId);
    if (sipConfig) {
      await sipConfigClient.releaseConfig(sipConfig.sipConfigId);
      await storage.deleteSipConfig(sipConfig.id);
    }

    res.json({ message: 'User deactivated successfully', user: deactivatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const activateUser: RequestHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.email === 'admin@itcallinfo.com' || user.username === 'admin') {
      res.status(403).json({ error: 'Admin accounts are always active' });
      return;
    }

    const activatedUser = await storage.activateUser(userId);
    
    if (!activatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existingConfig = await storage.getSipConfigById(userId);
    if (existingConfig) {
      res.json({ message: 'User activated successfully', user: activatedUser });
      return;
    }

    try {
      const sipConfig = await sipConfigClient.getNextAvailable();
      if (sipConfig) {
        const assignedConfig = await sipConfigClient.assignConfig(sipConfig.id, userId, activatedUser.username, activatedUser.email);
        if (assignedConfig) {
          await storage.createSipConfig({
            userId: user.id,
            sipConfigId: assignedConfig.id
          });

          res.json({ 
            message: 'User activated successfully with SIP configuration',
            user: activatedUser,
            sipConfig: assignedConfig
          });
          return;
        }
      }
    } catch (sipError) {
    }

    res.json({ 
      message: 'User activated successfully (no SIP configuration assigned)',
      user: activatedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSipConfigs: RequestHandler = async (req: Request, res: Response) => {
  try {
    let allSipConfigs: any[] = [];
    
    try {
      allSipConfigs = await sipConfigClient.getAllSipConfigs();
    } catch (error) {
      try {
        const assignedConfigs = await storage.getAllSipConfigs();
        allSipConfigs = assignedConfigs.map(config => ({
          ...config,
          status: 'assigned'
        }));
      } catch (dbError) {
        allSipConfigs = [];
      }
    }
    
    if (req.query.format === 'dashboard') {
      const assigned = allSipConfigs.filter(config => config.userId !== null && config.userId !== undefined);
      const available = allSipConfigs.filter(config => config.userId === null || config.userId === undefined);
      
      res.json({
        available: [],
        assigned: assigned,
        rangeInfo: {
          testRangeEnabled: process.env.TEST_SIP_RANGE === 'true',
          rangeStart: 2400,
          rangeEnd: 2500
        }
      });
    } else {
      const configsWithStatus = allSipConfigs.map(config => ({
        ...config,
        status: config.userId ? 'assigned' : 'available'
      }));
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      const total = configsWithStatus.length;
      const paginatedConfigs = configsWithStatus.slice(offset, offset + limit);
      const totalPages = Math.ceil(total / limit);
      
      res.json({
        configs: paginatedConfigs,
        total,
        page,
        limit,
        totalPages,
        rangeInfo: {
          testRangeEnabled: process.env.TEST_SIP_RANGE === 'true',
          rangeStart: 2400,
          rangeEnd: 2500
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const unassignSipConfig: RequestHandler = async (req: Request, res: Response) => {
  try {
    const configId = parseInt(req.params.id);
    
    const gatewayConfig = await sipConfigClient.getConfigById(configId);
    
    if (!gatewayConfig) {
      res.status(404).json({ error: 'SIP configuration not found in gateway' });
      return;
    }

    const isAssigned = gatewayConfig.userId !== null;
    
    if (!isAssigned) {
      res.status(400).json({ error: 'SIP configuration is not assigned to any user' });
      return;
    }

    const releasedConfig = await sipConfigClient.releaseConfig(configId);
    
    if (!releasedConfig) {
      res.status(500).json({ error: 'Failed to release SIP configuration from gateway' });
      return;
    }

    try {
      const localConfigs = await storage.getAllSipConfigs();
      const localConfig = localConfigs.find(config => config.sipConfigId === configId);
      
      if (localConfig) {
        await storage.deleteSipConfig(localConfig.id);
      }
    } catch (dbError) {
    }

    res.json({ 
      message: 'SIP configuration unassigned successfully',
      configId,
      userId: gatewayConfig.userId
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignSipConfig: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existingConfig = await storage.getSipConfigById(userId);
    if (existingConfig) {
      res.status(400).json({ error: 'User already has a SIP configuration assigned' });
      return;
    }

    const sipConfig = await sipConfigClient.getNextAvailable();
    if (!sipConfig) {
      const rangeMessage = process.env.TEST_SIP_RANGE === 'true' 
        ? 'No SIP configuration available in range 2400-2500'
        : 'No SIP configuration available';
      res.status(400).json({ error: rangeMessage });
      return;
    }

    const assignedConfig = await sipConfigClient.assignConfig(sipConfig.id, user.id, user.username, user.email);
    if (!assignedConfig) {
      res.status(400).json({ error: 'Failed to assign SIP configuration' });
      return;
    }

    await storage.createSipConfig({
      userId: user.id,
      sipConfigId: assignedConfig.id
    });

    res.json({ 
      message: 'SIP configuration assigned successfully',
      sipConfig: assignedConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const assignSpecificSipConfig: RequestHandler = async (req: Request, res: Response) => {
  try {
    const configId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existingConfig = await storage.getSipConfigById(userId);
    if (existingConfig) {
      res.status(400).json({ error: 'User already has a SIP configuration assigned' });
      return;
    }

    const rawConfig = await sipConfigClient.getRawConfigById(configId);
    if (!rawConfig) {
      res.status(404).json({ error: 'SIP configuration not found' });
      return;
    }
    
    if (rawConfig.sipaccountStatus === 'assigned' && rawConfig.userid !== null) {
      await sipConfigClient.releaseConfig(configId);
    }

    const assignedConfig = await sipConfigClient.assignConfig(configId, user.id, user.username, user.email);
    if (!assignedConfig) {
      res.status(400).json({ error: 'Failed to assign SIP configuration - gateway assignment failed' });
      return;
    }

    try {
      const dbConfig = await storage.createSipConfig({
        userId: user.id,
        sipConfigId: assignedConfig.id
      });
    } catch (dbError) {
      try {
        await sipConfigClient.releaseConfig(configId);
      } catch (unassignError) {
      }
      res.status(500).json({ error: 'Failed to save SIP configuration assignment to database' });
      return;
    }

    res.json({ 
      message: 'SIP configuration assigned successfully',
      sipConfig: assignedConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSipConfig: RequestHandler = async (req: Request, res: Response) => {
  try {
    const configId = parseInt(req.params.id);
    
    const gatewayConfig = await sipConfigClient.getConfigById(configId);
    
    if (!gatewayConfig) {
      res.status(404).json({ error: 'SIP configuration not found in gateway' });
      return;
    }

    res.json({ 
      message: 'SIP configuration update not supported in relationship mode',
      config: gatewayConfig,
      note: 'SIP Gateway configurations cannot be updated through this API'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDatabaseTable: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    res.json({
      table,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      data: [],
      total: 0,
      message: 'Database table viewing not yet implemented'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createUser: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName, phoneNumber } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      res.status(400).json({ error: 'Username already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      status: 'active',
      isVerified: true,
    });

    const sipConfig = await sipConfigClient.getNextAvailable();
    if (!sipConfig) {
      await storage.deleteUser(user.id);
      const rangeMessage = process.env.TEST_SIP_RANGE === 'true' 
        ? 'No SIP configuration available in range 2400-2500 for new user'
        : 'No SIP configuration available for new user';
      res.status(400).json({ error: rangeMessage });
      return;
    }

    const assignedConfig = await sipConfigClient.assignConfig(sipConfig.id, user.id, user.username, user.email);
    if (!assignedConfig) {
      await storage.deleteUser(user.id);
      res.status(400).json({ error: 'Failed to assign SIP configuration for new user' });
      return;
    }

    await storage.createSipConfig({
      userId: user.id,
      sipConfigId: assignedConfig.id
    });

    res.status(201).json({ 
      message: 'User created successfully with SIP configuration',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        status: user.status,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      sipConfig: assignedConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSipConfigsFromDatabase: RequestHandler = async (req: Request, res: Response) => {
  try {
    const allConfigs = await storage.getAllSipConfigs();
    
    res.json(allConfigs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAvailableSipConfigs: RequestHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
    const offset = limit ? (page - 1) * limit : 0;

    let allConfigs: any[] = [];
    
    try {
      allConfigs = await sipConfigClient.getAllAvailable();
    } catch (error) {
      res.json({
        configs: [],
        total: 0,
        page,
        limit: limit || 'all',
        totalPages: 0,
        rangeInfo: {
          testRangeEnabled: process.env.TEST_SIP_RANGE === 'true',
          rangeStart: 2400,
          rangeEnd: 2500
        }
      });
      return;
    }

    const total = allConfigs.length;
    let paginatedConfigs = allConfigs;
    let totalPages = 1;

    if (limit) {
      paginatedConfigs = allConfigs.slice(offset, offset + limit);
      totalPages = Math.ceil(total / limit);
    }

    res.json({
      configs: paginatedConfigs,
      total,
      page,
      limit: limit || 'all',
      totalPages,
      rangeInfo: {
        testRangeEnabled: process.env.TEST_SIP_RANGE === 'true',
        rangeStart: 2400,
        rangeEnd: 2500
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get("/stats", isAuthenticated, isAdmin, getStats);
router.get("/users", isAuthenticated, isAdmin, getUsers);
router.get("/users/:id", isAuthenticated, isAdmin, getUserById);
router.put("/users/:id", isAuthenticated, isAdmin, updateUser);
router.post("/users/:id/deactivate", isAuthenticated, isAdmin, deactivateUser);
router.post("/users/:id/activate", isAuthenticated, isAdmin, activateUser);
router.get("/sip-configs", isAuthenticated, isAdmin, getSipConfigs);
router.post("/sip-configs/:id/unassign", isAuthenticated, isAdmin, unassignSipConfig);
router.put("/sip-configs/:id", isAuthenticated, isAdmin, updateSipConfig);
router.post("/sip-configs/assign", isAuthenticated, isAdmin, assignSipConfig);
router.get("/database/:table", isAuthenticated, isAdmin, getDatabaseTable);
router.post("/users", isAuthenticated, isAdmin, createUser);
router.get("/sip-configs/database", isAuthenticated, isAdmin, getSipConfigsFromDatabase);
router.get("/sip-configs/available", isAuthenticated, isAdmin, getAvailableSipConfigs);
router.post("/sip-configs/:id/assign", isAuthenticated, isAdmin, assignSpecificSipConfig);

export default router; 