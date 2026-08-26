import { useAuth } from '@clerk/expo';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useEffect, useRef, useState } from 'react';

import { api } from '@/convex/_generated/api';
import { EXPORT_KIND, EXPORT_VERSION, type HistoryExport } from '@/lib/history-schema';
import {
  expandWordDeltas,
  fromRemoteSession,
  planPassages,
  planSessionPush,
  planSettings,
  settledSeq,
  toRemotePassage,
  toRemoteSession,
  type SettingsStamps,
} from '@/lib/sync-plan';
import {
  applyWordVerdicts,
  getRecords,
  getWordDeltas,
  importHistory,
  removeWordDeltas,
  subscribe as subscribeHistory,
} from '@/services/session-history';
import {
  applyRemoteSettings,
  getSettingUpdatedAt,
  getSettings,
  subscribe as subscribeSettings,
} from '@/services/settings';
import {
  getPendingPassageDeletes,
  getSessionsPulledAt,
  getSessionsPushedSeq,
  markSettingsResolved,
  setSessionsPulledAt,
  setSessionsPushedSeq,
  settlePassageDeletes,
} from '@/services/sync-state';
import {
  applyRemotePassages,
  getCustomPassages,
  subscribe as subscribePassages,
} from '@/services/user-passages';
import type { Settings } from '@/types/settings';

/** Matches `PUSH_BATCH` in `convex/sessions.ts`. */
const SESSION_PUSH_BATCH = 50;
const SESSION_PULL_PAGE = 200;
/**
 * How long a fresh install waits for the account's settings before falling
 * through to onboarding. Offline, the query never answers; the user must still
 * be able to start. A later sync reconciles the answers on their stamps.
 */
const GATE_TIMEOUT_MS = 3000;

/**
 * Renders nothing. Keeps the local stores and Convex in step, in both
 * directions, for the signed-in user.
 *
 * This is the ONLY place `useConvexAuth`, `useQuery`, and `useMutation` touch
 * app data. Screens keep reading MMKV through the stores, synchronously, so the
 * first frame renders offline exactly as it did before accounts existed. Convex
 * changes what is IN the stores, never how the gate reads them.
 *
 * Push and pull both run in effects, never in render, and a failure leaves the
 * durable cursor where it was so the next change retries.
 */
export function ConvexSync() {
  const { isAuthenticated } = useConvexAuth();
  useGateResolution();
  if (!isAuthenticated) return null;
  return (
    <>
      <SessionSync />
      <PassageSync />
      <SettingsSync />
    </>
  );
}

/**
 * Lifts the splash hold. Resolved by whichever comes first: the settings query
 * answering (in `SettingsSync`), Clerk reporting signed-out, or the timeout.
 */
function useGateResolution() {
  const { isLoaded, isSignedIn } = useAuth();
  useEffect(() => {
    if (isLoaded && !isSignedIn) markSettingsResolved();
  }, [isLoaded, isSignedIn]);
  useEffect(() => {
    const timer = setTimeout(markSettingsResolved, GATE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);
}

// --- sessions ----------------------------------------------------------------

function SessionSync() {
  const push = useMutation(api.sessions.push);
  /** Ids that arrived from the server this run. Never pushed back. */
  const pulledIds = useRef(new Set<string>());

  // Push: everything past the cursor, in seq order, one batch at a time.
  useEffect(() => {
    let cancelled = false;
    let running = false;

    const run = async () => {
      if (running) return;
      running = true;
      try {
        for (;;) {
          const records = getRecords();
          const batch = planSessionPush(
            records,
            getSessionsPushedSeq(),
            pulledIds.current,
            SESSION_PUSH_BATCH,
          );
          if (batch.length === 0) {
            // Nothing local left: fold any imported rows into the cursor so
            // they are never offered again.
            setSessionsPushedSeq(settledSeq(records, getSessionsPushedSeq()));
            break;
          }
          await push({
            records: batch.map((record) => toRemoteSession(record, getWordDeltas(record.id))),
          });
          if (cancelled) break;
          setSessionsPushedSeq(batch[batch.length - 1].seq);
          for (const record of batch) removeWordDeltas(record.id);
        }
      } catch (error) {
        console.warn('[sync] session push failed; will retry on the next change', error);
      } finally {
        running = false;
      }
    };

    void run();
    const unsubscribe = subscribeHistory(() => void run());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [push]);

  // Pull: page through everything inserted after the cursor, then stay
  // subscribed at the tail for other devices' sessions.
  const [after, setAfter] = useState(getSessionsPulledAt);
  const page = useQuery(api.sessions.since, { after, limit: SESSION_PULL_PAGE });

  useEffect(() => {
    if (!page || page.length === 0) return;
    const localIds = new Set(getRecords().map((record) => record.id));
    // Recorded here and folded at write time; folding again would double count.
    const fresh = page.filter((row) => !localIds.has(row.clientId));
    for (const row of fresh) pulledIds.current.add(row.clientId);

    if (fresh.length > 0) {
      // Through the store's import path, so server rows cross the same
      // untrusted-bytes boundary (`parseRecord`) as bytes on disk.
      const envelope: HistoryExport = {
        kind: EXPORT_KIND,
        version: EXPORT_VERSION,
        exportedAt: Date.now(),
        records: fresh.map(fromRemoteSession),
        words: [],
      };
      const summary = importHistory(JSON.stringify(envelope), 'merge');
      if (!summary.ok) console.warn('[sync] session import rejected', summary.reason);
      for (const row of fresh) {
        if (row.wordDeltas && row.wordDeltas.length > 0) {
          applyWordVerdicts(expandWordDeltas(row.wordDeltas), row.completedAt, row.endedReason);
        }
      }
    }

    const last = page[page.length - 1]._creationTime;
    setSessionsPulledAt(last);
    setAfter(last);
  }, [page]);

  return null;
}

// --- passages ----------------------------------------------------------------

function PassageSync() {
  const push = useMutation(api.passages.push);
  const remove = useMutation(api.passages.remove);
  const remote = useQuery(api.passages.list, {});
  const remoteRef = useRef(remote);
  remoteRef.current = remote;

  useEffect(() => {
    let cancelled = false;
    let running = false;

    const run = async () => {
      const rows = remoteRef.current;
      if (rows === undefined || running) return;
      running = true;
      try {
        const pending = getPendingPassageDeletes();
        const plan = planPassages(getCustomPassages(), rows, pending);

        if (plan.addLocal.length > 0 || plan.removeLocal.length > 0) {
          applyRemotePassages(plan.addLocal, plan.removeLocal);
        }
        if (plan.push.length > 0) {
          await push({ passages: plan.push.map(toRemotePassage) });
        }
        if (cancelled) return;
        if (plan.removeRemote.length > 0) {
          await remove({ clientIds: plan.removeRemote, at: Date.now() });
        }
        if (cancelled) return;
        // Every pending delete is either now on the server or was never there.
        if (pending.length > 0) settlePassageDeletes(pending);
      } catch (error) {
        console.warn('[sync] passage sync failed; will retry on the next change', error);
      } finally {
        running = false;
      }
    };

    void run();
    const unsubscribe = subscribePassages(() => void run());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [push, remove, remote]);

  return null;
}

// --- settings ----------------------------------------------------------------

function readLocalStamps(): SettingsStamps {
  return {
    accentLocale: getSettingUpdatedAt('accentLocale'),
    improveClarity: getSettingUpdatedAt('improveClarity'),
    displayName: getSettingUpdatedAt('displayName'),
    goalMinutes: getSettingUpdatedAt('goalMinutes'),
    prioritySkill: getSettingUpdatedAt('prioritySkill'),
    onboardingCompletedAt: getSettingUpdatedAt('onboardingCompletedAt'),
  };
}

function SettingsSync() {
  const push = useMutation(api.settings.push);
  const remote = useQuery(api.settings.get, {});
  const remoteRef = useRef(remote);
  remoteRef.current = remote;

  // The account's answer is in, whether or not it has a document yet.
  useEffect(() => {
    if (remote !== undefined) markSettingsResolved();
  }, [remote]);

  useEffect(() => {
    let cancelled = false;
    let running = false;

    const run = async () => {
      const doc = remoteRef.current;
      if (doc === undefined || running) return;
      running = true;
      try {
        const local: Settings = getSettings();
        const plan = planSettings(local, readLocalStamps(), doc);
        if (plan.apply) applyRemoteSettings(plan.apply.patch, plan.apply.stamps);
        if (plan.push && !cancelled) await push(plan.push);
      } catch (error) {
        console.warn('[sync] settings sync failed; will retry on the next change', error);
      } finally {
        running = false;
      }
    };

    void run();
    const unsubscribe = subscribeSettings(() => void run());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [push, remote]);

  return null;
}
