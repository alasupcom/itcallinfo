// import { AstExtenUser } from '../schema';
import { AstExtenUser } from '../schema';
import { sipConfigDatabase } from '../storage/database/sipConfig.database';

export interface GetConfigurationsOptions {
  available?: boolean;
  status?: 'enabled' | 'disabled';
  limit?: number;
  offset?: number;
}

class SipConfigService {
  async getAllConfigurations(options: GetConfigurationsOptions = {}): Promise<AstExtenUser[]> {
    return sipConfigDatabase.getAll(options);
  }

  async getConfigurationById(id: number): Promise<AstExtenUser | null> {
    return sipConfigDatabase.getById(id);
  }

  async getNextAvailableConfiguration(): Promise<AstExtenUser | null> {
    const configs = await sipConfigDatabase.getAll({ 
      available: true, 
      status: 'enabled',
      limit: 1 
    });
    return configs.length > 0 ? configs[0] : null;
  }

  async assignConfiguration(id: number, userId: number, username: string, userEmail: string): Promise<AstExtenUser | null> {
    return sipConfigDatabase.assignToUser(id, userId, username, userEmail);
  }

  async releaseConfiguration(id: number): Promise<AstExtenUser | null> {
    return sipConfigDatabase.releaseFromUser(id);
  }

  async getAvailableCount(): Promise<number> {
    return sipConfigDatabase.getAvailableCount();
  }

  async getAssignedCount(): Promise<number> {
    return sipConfigDatabase.getAssignedCount();
  }

  async updateConfiguration(id: number, updateData: Partial<AstExtenUser>): Promise<AstExtenUser | null> {
    return sipConfigDatabase.updateConfiguration(id, updateData);
  }
}

export const sipConfigService = new SipConfigService();