/**
 * The two account exits, in the one order that does not lose data.
 *
 * Sign-out clears the device so the next person to sign in on it does not
 * inherit this account's history. It is ordered:
 *
 *  1. RevenueCat first, while the identified app-user id is still current
 *     (`services/purchases.ts` says: forget on logout, never at launch).
 *  2. Every account-scoped local store. Named clears, not `clearAll()`: the
 *     history store's `clearAll` drops the legacy-import guard on purpose, and
 *     on sign-out that guard is what stops this device's old `sessions.json`
 *     from being re-imported into a different account.
 *  3. Clerk last. Signing out flips the root guard, which unmounts the screen
 *     that called this, so nothing after it is guaranteed to run.
 */

import { forgetPurchaser } from '@/services/purchases';
import { setLastSignedInUserId } from '@/services/auth-state';
import { clearAccountHistory } from '@/services/session-history';
import { resetSettings } from '@/services/settings';
import { clearSyncState } from '@/services/sync-state';
import { clearCustomPassages } from '@/services/user-passages';

export type SignOutFn = () => Promise<unknown>;

export function clearAccountData() {
  clearAccountHistory();
  clearCustomPassages();
  resetSettings();
  // Cursors go with the data they describe, or the next account on this
  // device would start its upload from another account's position.
  clearSyncState();
  setLastSignedInUserId(null);
}

export async function signOutAndClear(signOut: SignOutFn): Promise<void> {
  try {
    await forgetPurchaser();
  } catch (error) {
    // A failed logOut leaves RevenueCat on the old id until the next identify.
    // Not worth blocking the sign-out over.
    console.warn('[account] forgetPurchaser failed', error);
  }
  clearAccountData();
  await signOut();
}

/**
 * Account deletion, required by App Store guideline 5.1.1(v).
 *
 * `deleteRemote` removes the account's server-side data. It runs FIRST and a
 * failure aborts: deleting the Clerk user before the data would leave rows with
 * no owner left to delete them.
 */
export async function deleteAccount(
  deleteRemote: () => Promise<void>,
  deleteUser: () => Promise<unknown>,
  signOut: SignOutFn,
): Promise<void> {
  await deleteRemote();
  await deleteUser();
  await signOutAndClear(signOut);
}
