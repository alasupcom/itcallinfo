import { SipConfigStorageInterface } from '../interfaces/sip-config.interface';
import { SipConfig, InsertSipConfig, sipConfigs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../db';

export class SipConfigDatabaseStorage implements SipConfigStorageInterface {
  async getSipConfig(userId: number): Promise<SipConfig | undefined> {
    const [config] = await db.select()
      .from(sipConfigs)
      .where(eq(sipConfigs.userId, userId));
    return config;
  }

  async createSipConfig(config: InsertSipConfig): Promise<SipConfig> {
    const [newConfig] = await db.insert(sipConfigs)
      .values(config)
      .returning();
    return newConfig;
  }

  async updateSipConfig(id: number, data: Partial<SipConfig>): Promise<SipConfig | undefined> {
    const now = new Date();
    const [updatedConfig] = await db.update(sipConfigs)
      .set({ ...data, updatedAt: now })
      .where(eq(sipConfigs.id, id))
      .returning();
    return updatedConfig;
  }
}