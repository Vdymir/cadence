/**
 * The last user Clerk confirmed on this device, read synchronously from MMKV.
 *
 * The root navigator decides between sign-in and the app on its FIRST render.
 * Clerk's `isLoaded` needs a keychain read and, when online, a network round
 * trip, so it cannot answer that first frame. Before this flag existed the app
 * worked fully offline; a gate that waits on the network would put a login wall
 * in front of a user's own local data. So the first frame trusts this flag, and
 * Clerk confirms or revokes a moment later. A remotely revoked session sees the
 * app for a few hundred milliseconds. That data is theirs anyway.
 *
 * Written by the auth bridge when Clerk reports a user, cleared on sign-out.
 * Never written from a render.
 */

import { kv } from '@/services/kv';

const KEY = 'auth/userId';

export function getLastSignedInUserId(): string | null {
  try {
    return kv.getString(KEY) ?? null;
  } catch {
    return null;
  }
}

export function setLastSignedInUserId(userId: string | null): void {
  try {
    if (userId) kv.set(KEY, userId);
    else kv.remove(KEY);
  } catch (error) {
    console.warn('[auth-state] could not persist sign-in flag', error);
  }
}
