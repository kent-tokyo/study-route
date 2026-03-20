'use client';

import { useEffect, useState } from 'react';
import { getAvailableLevels, hasIllustration, getContentBasePath } from '@/lib/content-manifest';
import type { Term } from '@/types';

export interface ContentData {
  id: string;
  nodeId: string;
  level: string;
  generatedAt: string;
  content: string;
  terms: Term[];
  diagrams: { name: string; svg: string }[];
}

interface UseContentResult {
  data: ContentData | null;
  illustrationUrl: string | null;
  loading: boolean;
  error: boolean;
  resolvedLevel: string;
  availableLevels: string[];
}

export function useContent(nodeId: string, level: string): UseContentResult {
  const [data, setData] = useState<ContentData | null>(null);
  const [illustrationUrl, setIllustrationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolvedLevel, setResolvedLevel] = useState(level);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      setData(null);

      try {
        const levels = await getAvailableLevels(nodeId);
        if (cancelled) return;
        setAvailableLevels(levels);

        // Fall back to 'standard' if requested level isn't available
        const targetLevel = levels.includes(level) ? level : levels.includes('standard') ? 'standard' : levels[0];
        if (!targetLevel) {
          setError(true);
          setLoading(false);
          return;
        }
        setResolvedLevel(targetLevel);

        const res = await fetch(`${getContentBasePath()}/content/${nodeId}/${targetLevel}/content.json`);
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const json: ContentData = await res.json();
        setData(json);

        // Check illustration
        const hasImg = await hasIllustration(nodeId, targetLevel);
        if (!cancelled) {
          setIllustrationUrl(hasImg ? `${getContentBasePath()}/content/${nodeId}/${targetLevel}/illustration.webp` : null);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [nodeId, level]);

  return { data, illustrationUrl, loading, error, resolvedLevel, availableLevels };
}
