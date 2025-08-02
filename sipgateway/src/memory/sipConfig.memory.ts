import { AstExtenUser } from "../schema";

class SipConfigMemory {
  private cache: Map<string, AstExtenUser> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: AstExtenUser): void {
    this.cache.set(key, value);
  }

  get(key: string): AstExtenUser | undefined {
    return this.cache.get(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  isExpired(): boolean {
    return Date.now() - this.lastFetch > this.CACHE_TTL;
  }

  updateLastFetch(): void {
    this.lastFetch = Date.now();
  }

  getAll(): AstExtenUser[] {
    return Array.from(this.cache.values());
  }
}

export const sipConfigMemory = new SipConfigMemory();