import { request } from '../axios';

export interface SipConfig {
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

export class SipConfigAxiosClient {
  private readonly endpoint = import.meta.env.VITE_SIP_GATEWAY_URL || '';

  // Get next available SIP configuration
  async getNextAvailable(): Promise<SipConfig | null> {
    const response = await request<undefined, { success: boolean; data: SipConfig }>({
      url: `${this.endpoint}/available/next`,
      method: 'get',
    });
    return response.data.data;
  }

  // Assign SIP configuration to user
  async assignConfig(configId: number, userId: number, username: string, userEmail: string): Promise<SipConfig | null> {
    const response = await request<{ userId: number; username: string; userEmail: string }, { success: boolean; data: SipConfig }>({
      url: `${this.endpoint}/${configId}/assign`,
      method: 'put',
      data: {
        userId,
        username,
        userEmail
      }
    });
    return response.data.data;
  }

  // Release SIP configuration (unlink from user, don't delete from gateway)
  async releaseConfig(configId: number): Promise<SipConfig | null> {
    try {
      // Make a PUT request to release/unassign the configuration from the user
      // This should set the userId to null or mark it as unassigned in the gateway
      const response = await request<undefined, { success: boolean; data: SipConfig }>({
        url: `${this.endpoint}/${configId}/release`,
        method: 'put',
      });
      console.log(`SIP config ${configId} successfully released/unassigned from user`);
      return response.data.data;
    } catch (error) {
      console.error('Error releasing SIP config:', error);
      return null;
    }
  }

  // Get SIP configuration by ID
  async getConfigById(configId: number): Promise<SipConfig | null> {
    const response = await request<undefined, { success: boolean; data: SipConfig }>({
      url: `${this.endpoint}/${configId}`,
      method: 'get',
    });
    return response.data.data;
  }

  // Get SIP configuration statistics
  async getStats(): Promise<any> {
    const response = await request<undefined, { success: boolean; data: { total: number; available: number; assigned: number } }>({
      url: `${this.endpoint}/stats/overview`,
      method: 'get',
    });
    return response.data.data;
  }
} 