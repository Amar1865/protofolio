import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('investor'),
  status: text('status').notNull().default('active'),
  phone: text('phone').notNull().default(''),
  currency: text('currency').notNull().default('USD'),
  riskProfile: text('risk_profile').notNull().default('Balanced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const investments = pgTable('investments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull(),
  assetName: text('asset_name').notNull(),
  symbol: text('symbol').notNull(),
  units: doublePrecision('units').notNull(),
  purchasePrice: doublePrecision('purchase_price').notNull(),
  currentPrice: doublePrecision('current_price').notNull(),
  purchaseDate: text('purchase_date').notNull(),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactInquiries = pgTable('contact_inquiries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  investments: many(investments),
  activityLogs: many(activityLogs),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  owner: one(users, {
    fields: [investments.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  actor: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));
