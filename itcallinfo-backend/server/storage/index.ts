import { IStorage } from './interfaces';
import { MemStorage } from './memory';
import { DatabaseStorage } from './database';

// Factory function to create the appropriate storage implementation
export function createStorage(type: 'memory' | 'database' = 'database'): IStorage {
  if (type === 'memory') {
    return new MemStorage();
  }
  // @ts-ignore
  return new DatabaseStorage();
}

// Export a default instance
const storage = createStorage(process.env.STORAGE_TYPE as 'memory' | 'database' || 'database');
export default storage;