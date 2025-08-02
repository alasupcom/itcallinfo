import { SipConfig, InsertSipConfig } from "../../../shared/schema.js";

export interface SipConfigStorageInterface {
  // SIP Config relationship methods
  getSipConfig(userId: number): Promise<SipConfig | undefined>;
  getSipConfigById(id: number): Promise<SipConfig | undefined>;
  getAllSipConfigs(): Promise<SipConfig[]>;
  createSipConfig(config: InsertSipConfig): Promise<SipConfig>;
  updateSipConfig(id: number, data: Partial<SipConfig>): Promise<SipConfig | undefined>;
  updateSipConfigByUserId(userId: number, data: Partial<SipConfig>): Promise<SipConfig | undefined>;
  deleteSipConfig(id: number): Promise<boolean>;
  deleteSipConfigByUserId(userId: number): Promise<boolean>;
  assignSipConfigToUser(userId: number, sipConfigId: number): Promise<SipConfig>;
  unassignSipConfigFromUser(userId: number): Promise<boolean>;
}