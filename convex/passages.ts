import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireUserId } from './lib';
import { passageFields } from './schema';

const { userId: _userId, deletedAt: _deletedAt, ...clientPassageFields } = passageFields;

/** A user writes passages by hand, so the library stays small. One bounded
 * read covers it, deleted rows included, so the client can apply removals. */
const LIST_LIMIT = 500;

export const list = query({
  args: {},
  returns: v.array(
    v.object({ _id: v.id('passages'), _creationTime: v.number(), ...passageFields }),
  ),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query('passages')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .order('asc')
      .take(LIST_LIMIT);
  },
});

/** Idempotent on `clientId`. A row that already exists is left alone, deleted
 * or not: a stale device re-pushing a passage the user removed elsewhere must
 * not bring it back. */
export const push = mutation({
  args: { passages: v.array(v.object(clientPassageFields)) },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    let inserted = 0;
    let skipped = 0;
    for (const passage of args.passages) {
      const existing = await ctx.db
        .query('passages')
        .withIndex('by_user_client', (q) =>
          q.eq('userId', userId).eq('clientId', passage.clientId),
        )
        .unique();
      if (existing !== null) {
        skipped += 1;
        continue;
      }
      await ctx.db.insert('passages', { ...passage, userId });
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

/** Soft delete. Unknown ids are ignored so a retry is harmless. */
export const remove = mutation({
  args: { clientIds: v.array(v.string()), at: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    for (const clientId of args.clientIds) {
      const existing = await ctx.db
        .query('passages')
        .withIndex('by_user_client', (q) => q.eq('userId', userId).eq('clientId', clientId))
        .unique();
      if (existing !== null && existing.deletedAt === undefined) {
        await ctx.db.patch(existing._id, { deletedAt: args.at });
      }
    }
    return null;
  },
});
