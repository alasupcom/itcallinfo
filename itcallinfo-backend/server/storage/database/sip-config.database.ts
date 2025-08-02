import { SipConfigStorageInterface } from '../interfaces/sip-config.interface';
import { SipConfig, InsertSipConfig, sipConfigs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../db';

export class SipConfigDatabaseStorage implements SipConfigStorageInterface {
  async getSipConfig(userId: number): Promise<SipConfig | undefined> {
    const result = await db.select().from(sipConfigs).where(eq(sipConfigs.userId, userId)).limit(1);
    return result[0];
  }

  async createSipConfig(config: InsertSipConfig): Promise<SipConfig> {
    await db.insert(sipConfigs).values(config);
    const newConfig = await this.getSipConfig(config.userId);
    return newConfig!;
  }

  async getSipConfigById(id: number): Promise<SipConfig | undefined> {
    const result = await db.select().from(sipConfigs).where(eq(sipConfigs.id, id)).limit(1);
    return result[0];
  }

  async getAllSipConfigs(): Promise<SipConfig[]> {
    return await db.select().from(sipConfigs);
  }

  async updateSipConfig(id: number, data: Partial<SipConfig>): Promise<SipConfig | undefined> {
    await db.update(sipConfigs).set(data).where(eq(sipConfigs.id, id));
    return this.getSipConfigById(id);
  }

  async updateSipConfigByUserId(userId: number, data: Partial<SipConfig>): Promise<SipConfig | undefined> {
    await db.update(sipConfigs).set(data).where(eq(sipConfigs.userId, userId));
    return this.getSipConfig(userId);
  }

  async deleteSipConfig(id: number): Promise<boolean> {
    try {
      await db.delete(sipConfigs).where(eq(sipConfigs.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteSipConfigByUserId(userId: number): Promise<boolean> {
    try {
      await db.delete(sipConfigs).where(eq(sipConfigs.userId, userId));
      return true;
    } catch (error) {
      return false;
    }
  }

  async assignSipConfigToUser(userId: number, sipConfigId: number): Promise<SipConfig> {
    const existingConfig = await this.getSipConfig(userId);
    if (existingConfig) {
      const updatedConfig = await this.updateSipConfig(existingConfig.id, { sipConfigId });
      return updatedConfig!;
    }
    return this.createSipConfig({ userId, sipConfigId });
  }

  async unassignSipConfigFromUser(userId: number): Promise<boolean> {
    return this.deleteSipConfigByUserId(userId);
  }
}