import { 
    UserStorageInterface,
    SipConfigStorageInterface,
    NotificationStorageInterface
  } from './interfaces/index';
  
  export interface IStorage extends 
    UserStorageInterface,
    SipConfigStorageInterface,
    NotificationStorageInterface
    {}
    