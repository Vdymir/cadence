/**
 * The sync layer's own durable state, read synchronously from MMKV like the
 * sign-in flag in `services/auth-state.ts`.
 *
 * Two cursors and one list. Sessions are already durable in the history store,
 * so there is no outbox to keep: `pushedSeq` says how far the upload got, and
 * a kill mid-push simply resumes from it. `pulledAt` is the server insertion
 * time of the last row applied. `passageDeletes` holds ids removed here that
 * the server has not yet confirmed, because a delete has no local row left to
 * speak for it.
 *
 * All of it is account-scoped and cleared on sign-out, so the next account on
 * this device does not inherit another account's cursors.
 */

import { kv } from '@/services/kv';

export const SYNC_KEY_PREFIX = 'sync/';

const KEY = {
  sessionsPushedSeq: 'sync/sessions/pushedSeq',
  sessionsPulledAt: 'sync/sessions/pulledAt',
  passageDeletes: 'sync/passages/deletes',
} as const;

/** Outside the `sync/` namespace on purpose: it must survive sign-out. */
const RESET_GUARD = 'meta/convexResetV1';

function readNumber(key: string): number {
  try {
    return kv.getNumber(key) ?? 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number) {
  try {
    kv.set(key, value);
  } catch (error) {
    console.warn(`[sync-state] could not persist ${key}`, error);
  }
}

export const getSessionsPushedSeq = () => readNumber(KEY.sessionsPushedSeq);
export const setSessionsPushedSeq = (seq: number) => writeNumber(KEY.sessionsPushedSeq, seq);
export const getSessionsPulledAt = () => readNumber(KEY.sessionsPulledAt);
export const setSessionsPulledAt = (at: number) => writeNumber(KEY.sessionsPulledAt, at);

export function getPendingPassageDeletes(): string[] {
  try {
    const raw = kv.getString(KEY.passageDeletes);
    if (raw == null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writePendingPassageDeletes(ids: string[]) {
  try {
    if (ids.length === 0) kv.remove(KEY.passageDeletes);
    else kv.set(KEY.passageDeletes, JSON.stringify(ids));
  } catch (error) {
    console.warn('[sync-state] could not persist pending passage deletes', error);
  }
}

/** Called by the passage store on every local delete, before the sync layer
 * has any chance to run. */
export function notePassageDelete(id: string) {
  const current = getPendingPassageDeletes();
  if (current.includes(id)) return;
  writePendingPassageDeletes([...current, id]);
  emit();
}

export function settlePassageDeletes(ids: readonly string[]) {
  const settled = new Set(ids);
  writePendingPassageDeletes(getPendingPassageDeletes().filter((id) => !settled.has(id)));
}

/** Sign-out wipe of every cursor. The reset guard is deliberately kept. */
export function clearSyncState() {
  try {
    for (const key of kv.getAllKeys()) {
      if (key.startsWith(SYNC_KEY_PREFIX)) kv.remove(key);
    }
  } catch (error) {
    console.warn('[sync-state] could not clear', error);
  }
  emit();
}

/**
 * Runs `clear` exactly once per install, the first time this build launches.
 *
 * Pre-account history has no owner. Uploading it would hand whatever this
 * device recorded before sign-in existed to whichever account signs in first,
 * so it is dropped instead. Local data was disposable at the time this shipped.
 */
export function resetLocalStoresOnce(clear: () => void) {
  try {
    if (kv.getBoolean(RESET_GUARD) === true) return;
  } catch {
    return;
  }
  try {
    clear();
  } finally {
    try {
      kv.set(RESET_GUARD, true);
    } catch (error) {
      console.warn('[sync-state] could not write the reset guard', error);
    }
  }
}

// --- gate resolution (in-memory) ---------------------------------------------

/**
 * Whether the app knows the account's `onboardingCompletedAt`. False only on a
 * fresh install with a signed-in user, until the settings query answers, Clerk
 * reports signed-out, or a bounded wait expires. The root layout holds the
 * splash on this so a returning user is not shown onboarding for a beat.
 */
let settingsResolved = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const getSettingsResolved = () => settingsResolved;

export function markSettingsResolved() {
  if (settingsResolved) return;
  settingsResolved = true;
  emit();
}

export function subscribeSyncState(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
