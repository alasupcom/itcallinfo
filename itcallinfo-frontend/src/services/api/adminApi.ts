import { request } from '../axios';

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  message: string;
}

export class AdminAxiosClient {
  private readonly endpoint = '/api/admin';

  // Use the same auth endpoint as regular users
  login(data: AdminLoginRequest) {
    return request<AdminLoginRequest, AdminLoginResponse>({
      url: '/api/auth/login',
      method: 'post',
    }, data);
  }

  getStats() {
    return request<undefined, any>({
      url: `${this.endpoint}/stats`,
      method: 'get',
    });
  }

  getUsers() {
    return request<undefined, any>({
      url: `${this.endpoint}/users`,
      method: 'get',
    });
  }

  getUserById(userId: number) {
    return request<undefined, any>({
      url: `${this.endpoint}/users/${userId}`,
      method: 'get',
    });
  }

  getSipConfigs(params?: { format?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.format) searchParams.append('format', params.format);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    const url = queryString ? `${this.endpoint}/sip-configs?${queryString}` : `${this.endpoint}/sip-configs`;
    
    return request<undefined, any>({
      url,
      method: 'get',
    });
  }

  getAvailableSipConfigs(page?: number, limit?: number) {
    const searchParams = new URLSearchParams();
    if (page) searchParams.append('page', page.toString());
    if (limit) searchParams.append('limit', limit.toString());
    
    const queryString = searchParams.toString();
    const url = queryString ? `${this.endpoint}/sip-configs/available?${queryString}` : `${this.endpoint}/sip-configs/available`;
    
    return request<undefined, any>({
      url,
      method: 'get',
    });
  }

  activateUser(userId: number) {
    return request<undefined, any>({
      url: `${this.endpoint}/users/${userId}/activate`,
      method: 'post',
    });
  }

  deactivateUser(userId: number) {
    return request<undefined, any>({
      url: `${this.endpoint}/users/${userId}/deactivate`,
      method: 'post',
    });
  }

  unassignSipConfig(configId: number) {
    return request<undefined, any>({
      url: `${this.endpoint}/sip-configs/${configId}/unassign`,
      method: 'post',
    });
  }

  assignSipConfig(configId: number, userId: number) {
    return request<{ userId: number }, any>({
      url: `${this.endpoint}/sip-configs/${configId}/assign`,
      method: 'post',
    }, { userId });
  }

  createUser(userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
  }) {
    return request<typeof userData, any>({
      url: `${this.endpoint}/users`,
      method: 'post',
    }, userData);
  }

  updateUser(userId: number, userData: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
  }) {
    return request<typeof userData, any>({
      url: `${this.endpoint}/users/${userId}`,
      method: 'put',
    }, userData);
  }

  updateUserStatus(userId: number, action: 'activate' | 'deactivate') {
    return request<undefined, any>({
      url: `${this.endpoint}/users/${userId}/${action}`,
      method: 'post',
    });
  }

  updateSipConfig(configId: number, configData: {
    domain: string;
    username: string;
    password: string;
    server: string;
    port: number;
    transport: string;
  }) {
    return request<typeof configData, any>({
      url: `${this.endpoint}/sip-configs/${configId}`,
      method: 'put',
    }, configData);
  }

  logout() {
    return request<undefined, any>({
      url: '/api/auth/logout',
      method: 'post',
    });
  }
} 