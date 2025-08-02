import { SipConfigStorageInterface } from '../interfaces/sip-config.interface';
import { SipConfig, InsertSipConfig } from '../../../shared/schema';

export class SipConfigMemoryStorage implements SipConfigStorageInterface {
  private configs = new Map<number, SipConfig>();
  private nextId = 1;

  async getSipConfig(userId: number): Promise<SipConfig | undefined> {
    return Array.from(this.configs.values()).find(config => config.userId === userId);
  }

  async createSipConfig(config: InsertSipConfig): Promise<SipConfig> {
    const newConfig: SipConfig = {
      id: this.nextId++,
      userId: config.userId,
      sipConfigId: config.sipConfigId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.configs.set(newConfig.id, newConfig);
    return newConfig;
  }

  async getSipConfigById(id: number): Promise<SipConfig | undefined> {
    return this.configs.get(id);
  }

  async getAllSipConfigs(): Promise<SipConfig[]> {
    return Array.from(this.configs.values());
  }

  async updateSipConfig(id: number, data: Partial<SipConfig>): Promise<SipConfig | undefined> {
    const config = this.configs.get(id);
    if (!config) return undefined;

    const updatedConfig = { ...config, ...data };
    this.configs.set(id, updatedConfig);
    return updatedConfig;
  }

  async updateSipConfigByUserId(userId: number, data: Partial<SipConfig>): Promise<SipConfig | undefined> {
    const config = Array.from(this.configs.values()).find(config => config.userId === userId);
    if (!config) return undefined;

    const updatedConfig = { ...config, ...data };
    this.configs.set(config.id, updatedConfig);
    return updatedConfig;
  }

  async deleteSipConfig(id: number): Promise<boolean> {
    return this.configs.delete(id);
  }

  async deleteSipConfigByUserId(userId: number): Promise<boolean> {
    const config = Array.from(this.configs.values()).find(config => config.userId === userId);
    if (config) {
      return this.configs.delete(config.id);
    }
    return false;
  }

  async assignSipConfigToUser(userId: number, sipConfigId: number): Promise<SipConfig> {
    // First, unassign any existing config for this user
    await this.unassignSipConfigFromUser(userId);
    
    // Then assign the new config
    const newConfig = await this.createSipConfig({
      userId,
      sipConfigId
    });
    
    return newConfig;
  }

  async unassignSipConfigFromUser(userId: number): Promise<boolean> {
    return await this.deleteSipConfigByUserId(userId);
  }
}