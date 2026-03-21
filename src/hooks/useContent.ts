'use client';

import { useEffect, useState } from 'react';
import { getAvailableLevels, hasIllustration, getContentBasePath } from '@/lib/content-manifest';
import type { Term, QuizQuestion } from '@/types';

export interface ContentData {
  id: string;
  nodeId: string;
  level: string;
  generatedAt: string;
  content: string;
  terms: Term[];
  diagrams: { name: string; svg: string }[];
  quiz?: QuizQuestion[];
}

interface UseContentResult {
  data: ContentData | null;
  illustrationUrl: string | null;
  loading: boolean;
  error: boolean;
  resolvedLevel: string;
  availableLevels: string[];
}

function contentFilename(locale: string): string {
  return locale === 'ja' ? 'content.json' : `content.${locale}.json`;
}

export function useContent(nodeId: string, level: string, domain: string = 'math', locale: string = 'ja'): UseContentResult {
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
        const levels = await getAvailableLevels(nodeId, domain);
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

        const basePath = getContentBasePath();
        const domainPrefix = domain ? `${domain}/` : '';

        // Try locale-specific file first, fall back to Japanese
        let res = await fetch(`${basePath}/content/${domainPrefix}${nodeId}/${targetLevel}/${contentFilename(locale)}`);
        if (!res.ok && locale !== 'ja') {
          res = await fetch(`${basePath}/content/${domainPrefix}${nodeId}/${targetLevel}/content.json`);
        }
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const json: ContentData = await res.json();
        setData(json);

        const hasImg = await hasIllustration(nodeId, targetLevel, domain);
        if (!cancelled) {
          setIllustrationUrl(hasImg ? `${basePath}/content/${domainPrefix}${nodeId}/${targetLevel}/illustration.webp` : null);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [nodeId, level, domain, locale]);

  return { data, illustrationUrl, loading, error, resolvedLevel, availableLevels };
}
