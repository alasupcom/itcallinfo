export interface PhoneConfig {
    id: number;
    server: string;
    port: string;
    path: string;
    username: string;
    password: string;
    domain: string;
    regExpires: number;
    transport: string;
    doRegistration: boolean;
    isDefault: boolean;
    profileName: string;
  }