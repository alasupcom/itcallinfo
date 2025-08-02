import { Router, Request, Response, RequestHandler } from "express";
import { isAuthenticated } from "../middleware/auth";
import storage from "../storage";
import { SipConfigAxiosClient } from "../services/sipConfigApi";

const router = Router();
const sipConfigClient = new SipConfigAxiosClient();

interface SipConfigResponse {
  id: number;
  userId: number;
  domain: string;
  username: string;
  password: string;
  server: string;
  port: number;
  transport: string;
  iceServers: { urls: string[] };
}

router.get("/configs", isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const allConfigs = await sipConfigClient.getAllSipConfigs();
    
    res.json({
      data: allConfigs,
      total: allConfigs.length,
      rangeInfo: {
        testRangeEnabled: process.env.TEST_SIP_RANGE === 'true',
        rangeStart: 2400,
        rangeEnd: 2500
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

router.get("/configs/available", isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const availableConfigs = await sipConfigClient.getAllAvailable();
    
    res.json({
      data: availableConfigs,
      total: availableConfigs.length,
      rangeInfo: {
        testRangeEnabled: process.env.TEST_SIP_RANGE === 'true',
        rangeStart: 2400,
        rangeEnd: 2500
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

router.get("/config", isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    let sipConfigRelation = await storage.getSipConfig(userId);
    
    if (!sipConfigRelation) {
      try {
        const gatewayConfig = await sipConfigClient.getUserSipConfig(userId);
        
        if (gatewayConfig) {
          const newSipConfigRelation = await storage.createSipConfig({
            userId: userId,
            sipConfigId: gatewayConfig.id
          });
          
          sipConfigRelation = newSipConfigRelation;
        } else {
          return res.status(404).json({ error: 'SIP configuration not found' });
        }
      } catch (gatewayError) {
        return res.status(404).json({ error: 'SIP configuration not found' });
      }
    }
    
    try {
      const actualSipConfig = await sipConfigClient.getConfigById(sipConfigRelation.sipConfigId);
      
      if (!actualSipConfig) {
        return res.status(404).json({ error: 'SIP configuration not found in gateway' });
      }
      
      const mappedConfig: SipConfigResponse = {
        id: actualSipConfig.id,
        userId: userId,
        domain: actualSipConfig.domain,
        username: actualSipConfig.username,
        password: actualSipConfig.password,
        server: actualSipConfig.server,
        port: actualSipConfig.port,
        transport: actualSipConfig.transport,
        iceServers: actualSipConfig.iceServers
      };
      
      res.json(mappedConfig);
      
    } catch (gatewayError) {
      return res.status(500).json({ error: 'Failed to fetch SIP configuration from gateway' });
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

router.patch("/config", isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const updateData = req.body;
    
    const allowedFields = ['domain', 'username', 'password', 'server', 'port', 'transport', 'iceServers'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);
    
    const updatedConfig = await storage.updateSipConfigByUserId(userId, filteredData);
    
    if (!updatedConfig) {
      return res.status(404).json({ error: 'SIP configuration not found' });
    }
    
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

router.post("/sync", isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const allGatewayConfigs = await sipConfigClient.getAllSipConfigs();
    
    let syncedCount = 0;
    let errors: string[] = [];
    
    for (const gatewayConfig of allGatewayConfigs) {
      if (gatewayConfig.userId) {
        try {
          const existingConfig = await storage.getSipConfig(gatewayConfig.userId);
          
          if (!existingConfig) {
            await storage.createSipConfig({
              userId: gatewayConfig.userId,
              sipConfigId: gatewayConfig.id
            });
            syncedCount++;
          }
        } catch (error) {
          errors.push(`User ${gatewayConfig.userId}: ${error}`);
        }
      }
    }
    
    res.json({
      message: 'SIP configuration synchronization completed',
      syncedCount,
      totalConfigs: allGatewayConfigs.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

export default router; 