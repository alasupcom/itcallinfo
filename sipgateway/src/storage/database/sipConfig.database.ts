
import { eq, and, count } from 'drizzle-orm';
import { db } from '../../db';
import { GetConfigurationsOptions } from '../../services/sipConfig.service';
import { AstExtenUser, astExtenUsers } from '../../schema';

class SipConfigDatabase {
  async getAll(options: GetConfigurationsOptions = {}): Promise<AstExtenUser[]> {

    const conditions = [];
    
    if (options.available === true) {
      conditions.push(eq(astExtenUsers.sipaccountStatus, 'free'));
    } else if (options.available === false) {
      conditions.push(eq(astExtenUsers.sipaccountStatus, 'assigned'));
    }

    if (options.status) {
      conditions.push(eq(astExtenUsers.status, options.status));
    }

    // Alternative approach: Build query conditionally
    const baseQuery = db.select().from(astExtenUsers);
    
    const filteredQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const limitedQuery = options.limit 
      ? filteredQuery.limit(options.limit)
      : filteredQuery;

    const finalQuery = options.offset 
      ? limitedQuery.offset(options.offset)
      : limitedQuery;

    return await finalQuery;
  }

  async getById(id: number): Promise<AstExtenUser | null> {
    const result = await db
      .select()
      .from(astExtenUsers)
      .where(eq(astExtenUsers.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  async assignToUser(id: number, userId: number, username: string, userEmail: string): Promise<AstExtenUser | null> {
    // First check if the configuration is available
    const existing = await this.getById(id);
    if (!existing || existing.sipaccountStatus !== 'free') {
      return null;
    }

    // Update the record
    await db
      .update(astExtenUsers)
      .set({ 
        sipaccountStatus: 'assigned',
        userid: userId,
        username,
        userEmail
      })
      .where(and(
        eq(astExtenUsers.id, id),
        eq(astExtenUsers.sipaccountStatus, 'free')
      ));

    // Fetch and return the updated record
    return this.getById(id);
  }

  async releaseFromUser(id: number): Promise<AstExtenUser | null> {
    // Update the record
    await db
      .update(astExtenUsers)
      .set({ 
        sipaccountStatus: 'free',
        userid: null,
        username: null,
        userEmail: null
      })
      .where(eq(astExtenUsers.id, id));

    // Fetch and return the updated record
    return this.getById(id);
  }

  async getAvailableCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(astExtenUsers)
      .where(and(
        eq(astExtenUsers.sipaccountStatus, 'free'),
        eq(astExtenUsers.status, 'enabled')
      ));

    return result[0]?.count ?? 0;
  }

  async getAssignedCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(astExtenUsers)
      .where(eq(astExtenUsers.sipaccountStatus, 'assigned'));

    return result[0]?.count ?? 0;
  }

  async getByUserId(userId: number): Promise<AstExtenUser | null> {
    const result = await db
      .select()
      .from(astExtenUsers)
      .where(eq(astExtenUsers.userid, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  async updateConfiguration(id: number, updateData: Partial<AstExtenUser>): Promise<AstExtenUser | null> {
    // First check if the configuration exists
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    // Update the record
    await db
      .update(astExtenUsers)
      .set(updateData)
      .where(eq(astExtenUsers.id, id));

    // Fetch and return the updated record
    return this.getById(id);
  }
}

export const sipConfigDatabase = new SipConfigDatabase();