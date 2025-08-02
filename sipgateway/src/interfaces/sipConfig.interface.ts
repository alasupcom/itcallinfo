export interface ISipConfigRepository {
    getAll(options?: any): Promise<any[]>;
    getById(id: string): Promise<any | null>;
    updateAvailability(id: string, isAvailable: boolean): Promise<any | null>;
    getAvailableCount(): Promise<number>;
}

export interface SipConfig {
  id: number;           // Unique SIP configuration ID
  sipusername: string;  // SIP username
  sippass: string;      // SIP password
  sipdomain: string;    // SIP domain
  sipserver: string;    // SIP server
  sipport: number;      // SIP port (default: 5060)
  siptransport: string; // Transport protocol (WSS, UDP, TCP)
  userid: number | null; // User ID if assigned, null if available
}

export interface SipConfigStats {
  total: number;
  available: number;
  assigned: number;
  percentage_used: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface AssignRequest {
  userId: number;
  username: string;
  userEmail?: string;
}