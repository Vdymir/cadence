import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireUserId } from './lib';
import { sessionFields } from './schema';

/** The client-supplied half of a row: everything except the owner. */
const { userId: _userId, ...clientSessionFields } = sessionFields;

/** Bounded so one call stays well inside a mutation's write limits. The client
 * batches to this size. */
export const PUSH_BATCH = 50;

/**
 * Idempotent append. A record whose `clientId` already exists for this user is
 * skipped, so a device that retries after a kill mid-push cannot double a
 * session. Sessions are immutable once written; there is no update path.
 */
export const push = mutation({
  args: { records: v.array(v.object(clientSessionFields)) },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.records.length > PUSH_BATCH) {
      throw new Error(`push accepts at most ${PUSH_BATCH} records per call`);
    }
    let inserted = 0;
    let skipped = 0;
    for (const record of args.records) {
      const existing = await ctx.db
        .query('sessions')
        .withIndex('by_user_client', (q) =>
          q.eq('userId', userId).eq('clientId', record.clientId),
        )
        .unique();
      if (existing !== null) {
        skipped += 1;
        continue;
      }
      await ctx.db.insert('sessions', { ...record, userId });
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

/**
 * Pull cursor over SERVER insertion time, not `completedAt`: a device that was
 * offline can push an old session long after newer ones exist, and a cursor on
 * completion time would never see it. Returns rows inserted strictly after
 * `after`, oldest first, capped at `limit`; the client advances `after` to the
 * last row's `_creationTime` and re-subscribes until a page comes back short.
 */
export const since = query({
  args: { after: v.number(), limit: v.number() },
  returns: v.array(
    v.object({ _id: v.id('sessions'), _creationTime: v.number(), ...sessionFields }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', userId).gt('_creationTime', args.after))
      .order('asc')
      .take(Math.min(Math.max(1, args.limit), 200));
  },
});
