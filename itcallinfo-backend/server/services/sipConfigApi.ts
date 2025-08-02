import axios, { AxiosResponse } from 'axios';

interface SipConfig {
  id: number;
  userId: number | null;
  domain: string;
  username: string;
  password: string;
  server: string;
  port: number;
  transport: string;
  iceServers: { urls: string[] };
  status?: string;
}

interface SipConfigStats {
  total: number;
  available: number;
  used: number;
}

export class SipConfigAxiosClient {
  private endpoint: string;
  private timeout: number;
  private testRangeEnabled: boolean;
  private testRangeStart: number;
  private testRangeEnd: number;

  constructor() {
    this.endpoint = process.env.SIP_GATEWAY_URL || 'http://localhost:3000/api/sip-config';
    this.timeout = parseInt(process.env.SIP_GATEWAY_TIMEOUT || '10000');
    this.testRangeEnabled = process.env.TEST_SIP_RANGE === 'true';
    this.testRangeStart = 2400;
    this.testRangeEnd = 2500;
  }

  async getNextAvailable(): Promise<SipConfig | null> {
    try {
      const response: AxiosResponse = await axios.get(`${this.endpoint}/available`, {
        timeout: this.timeout,
      });

      let allConfigs: any[] = [];

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        allConfigs = response.data.data;
      } else if (Array.isArray(response.data)) {
        allConfigs = response.data;
      } else {
        return null;
      }

      if (this.testRangeEnabled) {
        const filteredConfigs = allConfigs.filter(config => {
          const numericPart = config.sipid?.toString().match(/\d+/)?.[0];
          if (!numericPart) return false;
          const sipId = parseInt(numericPart);
          const inRange = sipId >= this.testRangeStart && sipId <= this.testRangeEnd;
          return inRange && !config.userId;
        });

        if (filteredConfigs.length > 0) {
          const config = filteredConfigs[0];
          return {
            id: config.id,
            userId: config.userId,
            domain: config.domain,
            username: config.username,
            password: config.password,
            server: config.server,
            port: config.port,
            transport: config.transport,
            iceServers: config.iceServers || { urls: [] },
            status: config.status,
          };
        }
      } else {
        const availableConfig = allConfigs.find(config => !config.userId);
        if (availableConfig) {
          return {
            id: availableConfig.id,
            userId: availableConfig.userId,
            domain: availableConfig.domain,
            username: availableConfig.username,
            password: availableConfig.password,
            server: availableConfig.server,
            port: availableConfig.port,
            transport: availableConfig.transport,
            iceServers: availableConfig.iceServers || { urls: [] },
            status: availableConfig.status,
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async getAllAvailableInRange(): Promise<SipConfig[]> {
    if (!this.testRangeEnabled) {
      return [];
    }

    try {
      const response: AxiosResponse = await axios.get(`${this.endpoint}/available`, {
        timeout: this.timeout,
      });

      let allConfigs: any[] = [];

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        allConfigs = response.data.data;
      } else if (Array.isArray(response.data)) {
        allConfigs = response.data;
      } else {
        return [];
      }

      const filteredConfigs = allConfigs.filter(config => {
        const numericPart = config.sipid?.toString().match(/\d+/)?.[0];
        if (!numericPart) return false;
        const sipId = parseInt(numericPart);
        const inRange = sipId >= this.testRangeStart && sipId <= this.testRangeEnd;
        return inRange && !config.userId;
      });

      return filteredConfigs.map(config => ({
        id: config.id,
        userId: config.userId,
        domain: config.domain,
        username: config.username,
        password: config.password,
        server: config.server,
        port: config.port,
        transport: config.transport,
        iceServers: config.iceServers || { urls: [] },
        status: config.status,
      }));
    } catch (error) {
      return [];
    }
  }

  async assignConfig(configId: number, userId: number, username: string, userEmail: string): Promise<SipConfig | null> {
    try {
      const response: AxiosResponse = await axios.put(
        `${this.endpoint}/${configId}/assign`,
        {
          userId,
          username,
          userEmail,
        },
        {
          timeout: this.timeout,
        }
      );

      if (response.data && response.data.data) {
        const assignedConfig = response.data.data;
        return {
          id: assignedConfig.id,
          userId: assignedConfig.userId,
          domain: assignedConfig.domain,
          username: assignedConfig.username,
          password: assignedConfig.password,
          server: assignedConfig.server,
          port: assignedConfig.port,
          transport: assignedConfig.transport,
          iceServers: assignedConfig.iceServers || { urls: [] },
          status: assignedConfig.status,
        };
      } else if (response.data) {
        return {
          id: response.data.id,
          userId: response.data.userId,
          domain: response.data.domain,
          username: response.data.username,
          password: response.data.password,
          server: response.data.server,
          port: response.data.port,
          transport: response.data.transport,
          iceServers: response.data.iceServers || { urls: [] },
          status: response.data.status,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async releaseConfig(configId: number): Promise<SipConfig | null> {
    try {
      const response: AxiosResponse = await axios.put(
        `${this.endpoint}/${configId}/release`,
        {},
        {
          timeout: this.timeout,
        }
      );

      if (response.data && response.data.data) {
        const releasedConfig = response.data.data;
        return {
          id: releasedConfig.id,
          userId: releasedConfig.userId,
          domain: releasedConfig.domain,
          username: releasedConfig.username,
          password: releasedConfig.password,
          server: releasedConfig.server,
          port: releasedConfig.port,
          transport: releasedConfig.transport,
          iceServers: releasedConfig.iceServers || { urls: [] },
          status: releasedConfig.status,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async getConfigById(configId: number): Promise<SipConfig | null> {
    try {
      const response: AxiosResponse = await axios.get(`${this.endpoint}/${configId}`, {
        timeout: this.timeout,
      });

      if (response.data && response.data.data) {
        const config = response.data.data;
        return {
          id: config.id,
          userId: config.userId,
          domain: config.domain,
          username: config.username,
          password: config.password,
          server: config.server,
          port: config.port,
          transport: config.transport,
          iceServers: config.iceServers || { urls: [] },
          status: config.status,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async getStats(): Promise<SipConfigStats | null> {
    try {
      const response: AxiosResponse = await axios.get(`${this.endpoint}/stats`, {
        timeout: this.timeout,
      });

      if (response.data && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async getStatsForRange(): Promise<SipConfigStats | null> {
    if (!this.testRangeEnabled) {
      return null;
    }

    try {
      const allConfigs = await this.getAllSipConfigs();
      const rangeConfigs = allConfigs.filter(config => {
        const numericPart = config.username?.match(/\d+/)?.[0];
        if (!numericPart) return false;
        const sipId = parseInt(numericPart);
        return sipId >= this.testRangeStart && sipId <= this.testRangeEnd;
      });

      const totalRange = rangeConfigs.length;
      const availableCount = rangeConfigs.filter(config => !config.userId).length;
      const usedCount = totalRange - availableCount;

      return {
        total: totalRange,
        available: availableCount,
        used: usedCount,
      };
    } catch (error) {
      return null;
    }
  }

  async getAllSipConfigs(): Promise<SipConfig[]> {
    try {
      const response: AxiosResponse = await axios.get(this.endpoint, {
        timeout: this.timeout,
      });

      let allConfigs: any[] = [];

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        allConfigs = response.data.data;
      } else if (Array.isArray(response.data)) {
        allConfigs = response.data;
      } else {
        return [];
      }

      if (this.testRangeEnabled) {
        const filteredConfigs = allConfigs.filter(config => {
          const numericPart = config.sipid?.toString().match(/\d+/)?.[0];
          if (!numericPart) return false;
          const sipId = parseInt(numericPart);
          return sipId >= this.testRangeStart && sipId <= this.testRangeEnd;
        });

        return filteredConfigs.map(config => ({
          id: config.id,
          userId: config.userId,
          domain: config.domain,
          username: config.username,
          password: config.password,
          server: config.server,
          port: config.port,
          transport: config.transport,
          iceServers: config.iceServers || { urls: [] },
          status: config.status,
        }));
      }

      return allConfigs.map(config => ({
        id: config.id,
        userId: config.userId,
        domain: config.domain,
        username: config.username,
        password: config.password,
        server: config.server,
        port: config.port,
        transport: config.transport,
        iceServers: config.iceServers || { urls: [] },
        status: config.status,
      }));
    } catch (error) {
      return [];
    }
  }

  async getRawConfigById(configId: number): Promise<any | null> {
    try {
      const response: AxiosResponse = await axios.get(`${this.endpoint}/${configId}`, {
        timeout: this.timeout,
      });

      if (response.data && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async getUserSipConfig(userId: number): Promise<SipConfig | null> {
    try {
      const response: AxiosResponse = await axios.get(`${this.endpoint}/user/${userId}`, {
        timeout: this.timeout,
      });

      if (response.data && response.data.data) {
        const userConfig = response.data.data;
        return {
          id: userConfig.id,
          userId: userConfig.userId,
          domain: userConfig.domain,
          username: userConfig.username,
          password: userConfig.password,
          server: userConfig.server,
          port: userConfig.port,
          transport: userConfig.transport,
          iceServers: userConfig.iceServers || { urls: [] },
          status: userConfig.status,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async getAllAvailable(): Promise<SipConfig[]> {
    try {
      const response: AxiosResponse = await axios.get(`${this.endpoint}/available`, {
        timeout: this.timeout,
      });

      let allConfigs: any[] = [];

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        allConfigs = response.data.data;
      } else if (Array.isArray(response.data)) {
        allConfigs = response.data;
      } else if (typeof response.data === 'string') {
        try {
          allConfigs = JSON.parse(response.data);
        } catch (parseError) {
          return [];
        }
      } else {
        return [];
      }

      if (!Array.isArray(allConfigs)) {
        return [];
      }

      if (this.testRangeEnabled) {
        const filteredConfigs = allConfigs.filter(config => {
          const numericPart = config.sipid?.toString().match(/\d+/)?.[0];
          if (!numericPart) return false;
          const sipId = parseInt(numericPart);
          const inRange = sipId >= this.testRangeStart && sipId <= this.testRangeEnd;
          return inRange && !config.userId;
        });

        return filteredConfigs.map(config => ({
          id: config.id,
          userId: config.userId,
          domain: config.domain,
          username: config.username,
          password: config.password,
          server: config.server,
          port: config.port,
          transport: config.transport,
          iceServers: config.iceServers || { urls: [] },
          status: config.status,
        }));
      }

      const availableConfigs = allConfigs.filter(config => !config.userId);

      return availableConfigs.map(config => ({
        id: config.id,
        userId: config.userId,
        domain: config.domain,
        username: config.username,
        password: config.password,
        server: config.server,
        port: config.port,
        transport: config.transport,
        iceServers: config.iceServers || { urls: [] },
        status: config.status,
      }));
    } catch (error) {
      return [];
    }
  }
} 