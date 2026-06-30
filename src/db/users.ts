import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    // Fallback: try selecting the user if insertion/upsert had issues
    try {
      const existing = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.uid, uid)
      });
      if (existing) return existing;
    } catch (e) {
      console.error('Fallback select user failed:', e);
    }
    throw new Error('Database registration failed. Please try again.', { cause: error });
  }
}
