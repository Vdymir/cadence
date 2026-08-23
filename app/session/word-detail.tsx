import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { WordDetail } from '@/components/session/word-detail';

import { useSessionContext } from './_layout';

function parseWordIndex(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const index = Number(value);
  return Number.isSafeInteger(index) ? index : null;
}

export default function WordDetailScreen() {
  const { result } = useSessionContext();
  const { wordIndex } = useLocalSearchParams<{ wordIndex?: string | string[] }>();
  const index = parseWordIndex(wordIndex);
  const word =
    result?.mode !== 'freestyle' && index != null ? (result?.words[index] ?? null) : null;

  const dismiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, []);

  useEffect(() => {
    if (!result || !word) dismiss();
  }, [dismiss, result, word]);

  if (!result || !word) return null;

  return <WordDetail word={word} audioUri={result.audioUri} onDismiss={dismiss} />;
}
