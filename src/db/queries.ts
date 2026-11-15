import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { activityLogs, contactInquiries, investments, users } from './schema.ts';

export type SafeUser = {
  id: number;
  uid: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  phone: string;
  currency: string;
  riskProfile: string;
  createdAt: Date;
  updatedAt: Date;
};

export function sanitizeUser(user: typeof users.$inferSelect): SafeUser {
  return {
    id: user.id,
    uid: user.uid,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    currency: user.currency,
    riskProfile: user.riskProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function findUserByEmail(email: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (findUserByEmail):', error);
    throw new Error('Unable to look up user account.', { cause: error });
  }
}

export async function findUserById(id: number) {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (findUserById):', error);
    throw new Error('Unable to load user profile.', { cause: error });
  }
}

export async function findUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (findUserByUid):', error);
    throw new Error('Unable to resolve user identity.', { cause: error });
  }
}

export async function createLocalUser(data: {
  uid: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'investor' | 'admin';
  currency?: string;
  riskProfile?: string;
}) {
  try {
    const rows = await db
      .insert(users)
      .values({
        uid: data.uid,
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        status: 'active',
        currency: data.currency || 'USD',
        riskProfile: data.riskProfile || 'Balanced',
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database query failed (createLocalUser):', error);
    throw new Error('Unable to create user account.', { cause: error });
  }
}

export async function upsertFirebaseUser(data: {
  uid: string;
  email: string;
  fullName: string;
}) {
  try {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingByEmail = await findUserByEmail(normalizedEmail);
    if (existingByEmail) {
      if (existingByEmail.uid !== data.uid) {
        const updated = await db
          .update(users)
          .set({
            uid: data.uid,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        return updated[0];
      }
      return existingByEmail;
    }

    const result = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: normalizedEmail,
        fullName: data.fullName || normalizedEmail.split('@')[0],
        role: 'investor',
        status: 'active',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed (upsertFirebaseUser):', error);
    throw new Error('Unable to synchronize user profile.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: number,
  data: {
    fullName: string;
    phone: string;
    currency: string;
    riskProfile: string;
  }
) {
  try {
    const rows = await db
      .update(users)
      .set({
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        currency: data.currency,
        riskProfile: data.riskProfile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (updateUserProfile):', error);
    throw new Error('Unable to update user profile.', { cause: error });
  }
}

export async function updateUserPasswordHash(userId: number, passwordHash: string) {
  try {
    const rows = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (updateUserPasswordHash):', error);
    throw new Error('Unable to update password.', { cause: error });
  }
}

export async function getInvestmentsForUser(userId: number) {
  try {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId))
      .orderBy(desc(investments.purchaseDate), desc(investments.id));
  } catch (error) {
    console.error('Database query failed (getInvestmentsForUser):', error);
    throw new Error('Unable to load investment records.', { cause: error });
  }
}

export async function createInvestment(data: {
  userId: number;
  category: string;
  assetName: string;
  symbol: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes: string;
}) {
  try {
    const rows = await db
      .insert(investments)
      .values({
        userId: data.userId,
        category: data.category,
        assetName: data.assetName.trim(),
        symbol: data.symbol.trim().toUpperCase(),
        units: data.units,
        purchasePrice: data.purchasePrice,
        currentPrice: data.currentPrice,
        purchaseDate: data.purchaseDate,
        notes: data.notes.trim(),
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database query failed (createInvestment):', error);
    throw new Error('Unable to save investment record.', { cause: error });
  }
}

export async function updateInvestmentForUser(
  investmentId: number,
  userId: number,
  data: {
    category: string;
    assetName: string;
    symbol: string;
    units: number;
    purchasePrice: number;
    currentPrice: number;
    purchaseDate: string;
    notes: string;
  }
) {
  try {
    const rows = await db
      .update(investments)
      .set({
        category: data.category,
        assetName: data.assetName.trim(),
        symbol: data.symbol.trim().toUpperCase(),
        units: data.units,
        purchasePrice: data.purchasePrice,
        currentPrice: data.currentPrice,
        purchaseDate: data.purchaseDate,
        notes: data.notes.trim(),
        updatedAt: new Date(),
      })
      .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (updateInvestmentForUser):', error);
    throw new Error('Unable to update investment record.', { cause: error });
  }
}

export async function deleteInvestmentForUser(investmentId: number, userId: number) {
  try {
    const rows = await db
      .delete(investments)
      .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (deleteInvestmentForUser):', error);
    throw new Error('Unable to delete investment record.', { cause: error });
  }
}

export async function logActivity(data: {
  userId: number | null;
  actorEmail: string;
  action: string;
  entityType: string;
  details: string;
}) {
  try {
    await db.insert(activityLogs).values({
      userId: data.userId,
      actorEmail: data.actorEmail,
      action: data.action,
      entityType: data.entityType,
      details: data.details,
    });
  } catch (error) {
    console.error('Database query failed (logActivity):', error);
  }
}

export async function createContactInquiry(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const rows = await db
      .insert(contactInquiries)
      .values({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subject: data.subject.trim(),
        message: data.message.trim(),
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database query failed (createContactInquiry):', error);
    throw new Error('Unable to submit your inquiry at this time.', { cause: error });
  }
}

export async function getAllUsersWithInvestmentStats() {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));

    const counts = await db
      .select({
        userId: investments.userId,
        holdingsCount: sql<number>`count(*)::int`,
        totalInvested: sql<number>`coalesce(sum(${investments.units} * ${investments.purchasePrice}), 0)`,
        totalCurrent: sql<number>`coalesce(sum(${investments.units} * ${investments.currentPrice}), 0)`,
      })
      .from(investments)
      .groupBy(investments.userId);

    const countMap = new Map(counts.map((c) => [c.userId, c]));

    return allUsers.map((u) => {
      const stats = countMap.get(u.id);
      return {
        ...sanitizeUser(u),
        holdingsCount: stats?.holdingsCount ?? 0,
        totalInvested: Number(stats?.totalInvested ?? 0),
        totalCurrent: Number(stats?.totalCurrent ?? 0),
      };
    });
  } catch (error) {
    console.error('Database query failed (getAllUsersWithInvestmentStats):', error);
    throw new Error('Unable to load registered users.', { cause: error });
  }
}

export async function updateUserStatus(userId: number, status: 'active' | 'inactive') {
  try {
    const rows = await db
      .update(users)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (updateUserStatus):', error);
    throw new Error('Unable to update user status.', { cause: error });
  }
}

export async function getRecentActivities(limit = 50) {
  try {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Database query failed (getRecentActivities):', error);
    throw new Error('Unable to load system activities.', { cause: error });
  }
}

export async function getAdminOverviewMetrics() {
  try {
    const allUsers = await db.select().from(users);
    const allInvestments = await db.select().from(investments);
    const recentLogs = await getRecentActivities(25);
    const inquiries = await db
      .select()
      .from(contactInquiries)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(10);

    let aggregateInvested = 0;
    let aggregateCurrentValue = 0;
    for (const inv of allInvestments) {
      aggregateInvested += Number(inv.units) * Number(inv.purchasePrice);
      aggregateCurrentValue += Number(inv.units) * Number(inv.currentPrice);
    }

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u) => u.status === 'active').length;
    const inactiveUsers = allUsers.filter((u) => u.status === 'inactive').length;
    const investorCount = allUsers.filter((u) => u.role === 'investor').length;
    const adminCount = allUsers.filter((u) => u.role === 'admin').length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      investorCount,
      adminCount,
      totalHoldings: allInvestments.length,
      aggregateInvested,
      aggregateCurrentValue,
      recentLogs,
      recentInquiries: inquiries,
    };
  } catch (error) {
    console.error('Database query failed (getAdminOverviewMetrics):', error);
    throw new Error('Unable to load system overview.', { cause: error });
  }
}
