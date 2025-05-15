import { SipConfigStorageInterface } from '../interfaces/sip-config.interface';
import { SipConfig, InsertSipConfig } from '../../../shared/schema';

export class SipConfigMemoryStorage implements SipConfigStorageInterface {
  private sipConfigs: Map<number, SipConfig>;
  private sipConfigId: number;

  constructor() {
    this.sipConfigs = new Map();
    this.sipConfigId = 1;
  }

  async getSipConfig(userId: number): Promise<SipConfig | undefined> {
    return Array.from(this.sipConfigs.values()).find(
      (config) => config.userId === userId,
    );
  }

  async createSipConfig(config: InsertSipConfig): Promise<SipConfig> {
    const id = this.sipConfigId++;
    const now = new Date();
    const sipConfig: SipConfig = { 
      ...config, 
      id, 
      transport: config.transport ?? "wss", 
      createdAt: now, 
      updatedAt: now 
    };
    this.sipConfigs.set(id, sipConfig);
    return sipConfig;
  }

  async updateSipConfig(id: number, data: Partial<SipConfig>): Promise<SipConfig | undefined> {
    const config = this.sipConfigs.get(id);
    if (!config) return undefined;

    const updatedConfig = { ...config, ...data, updatedAt: new Date() };
    this.sipConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
}