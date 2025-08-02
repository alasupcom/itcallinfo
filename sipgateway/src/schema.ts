import { mysqlTable, int, varchar, mysqlEnum } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const astExtenUsers = mysqlTable('ast_exten_users', {
  id: int('id').primaryKey().autoincrement(),
  sipusername: varchar('sipusername', { length: 50 }).notNull(),
  sipid: varchar('sipid', { length: 50 }).notNull(),
  sippass: varchar('sippass', { length: 255 }).notNull(),
  sipdomain: varchar('sipdomain', { length: 255 }).notNull(),
  siptransport: varchar('siptransport', { length: 10 }).notNull().default('ws'),
  userid: int('userid'),
  username: varchar('username', { length: 100 }),
  userEmail: varchar('user_email', { length: 255 }),
  sipaccountStatus: mysqlEnum('sipaccount_status', ['free', 'assigned']).default('free'),
  status: mysqlEnum('status', ['enabled', 'disabled']).default('enabled'),
});

export const insertAstExtenUserSchema = createInsertSchema(astExtenUsers);
export const selectAstExtenUserSchema = createSelectSchema(astExtenUsers);

export type AstExtenUser = typeof astExtenUsers.$inferSelect;
export type NewAstExtenUser = typeof astExtenUsers.$inferInsert;