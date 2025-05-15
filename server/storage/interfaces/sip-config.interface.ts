import { SipConfig, InsertSipConfig } from "../../../shared/schema";

export interface SipConfigStorageInterface {
  // SIP Config methods
  getSipConfig(userId: number): Promise<SipConfig | undefined>;
  createSipConfig(config: InsertSipConfig): Promise<SipConfig>;
  updateSipConfig(id: number, data: Partial<SipConfig>): Promise<SipConfig | undefined>;
}