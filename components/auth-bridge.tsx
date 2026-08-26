import { useAuth } from '@clerk/expo';
import { useEffect } from 'react';

import { getLastSignedInUserId, setLastSignedInUserId } from '@/services/auth-state';
import { setAuthState } from '@/services/observe-events';
import { forgetPurchaser, identifyPurchaser } from '@/services/purchases';

/**
 * Renders nothing. Keeps the synchronous sign-in flag, RevenueCat's identity,
 * and the Observe auth attribute in step with Clerk.
 *
 * The flag is what the root navigator reads on its first frame, before Clerk
 * has loaded, so a returning user lands in the app offline exactly as they did
 * before accounts existed.
 *
 * RevenueCat identity follows the rule in `services/purchases.ts`: identify
 * right after a NEW login (so anonymous purchases transfer), forget on logout,
 * and never at launch. Comparing against the stored flag is what tells a fresh
 * sign-in apart from a cold start with a cached session.
 */
export function AuthBridge() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const current = isSignedIn && userId ? userId : null;
    const previous = getLastSignedInUserId();
    setLastSignedInUserId(current);
    setAuthState(current ? 'signed-in' : 'signed-out');

    if (current && current !== previous) {
      identifyPurchaser(current).catch((error) =>
        console.warn('[auth] identifyPurchaser failed', error),
      );
    } else if (!current && previous) {
      // A session revoked from outside the app. The in-app sign-out path has
      // already forgotten the purchaser before Clerk reports signed-out.
      forgetPurchaser().catch((error) => console.warn('[auth] forgetPurchaser failed', error));
    }
  }, [isLoaded, isSignedIn, userId]);

  return null;
}
