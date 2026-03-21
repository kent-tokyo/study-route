'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NodeStatus } from '@/types';

interface ProgressEntry {
  status: NodeStatus;
  startedAt: string | null;
  completedAt: string | null;
}

type ProgressData = Record<string, ProgressEntry>;

function getStorageKey(domain?: string): string {
  return domain ? `study-route_progress_${domain}` : 'study-route_progress';
}

function loadProgress(domain?: string): ProgressData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(getStorageKey(domain));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistProgress(data: ProgressData, domain?: string): void {
  localStorage.setItem(getStorageKey(domain), JSON.stringify(data));
}

export function useProgress(domain?: string) {
  const [progress, setProgress] = useState<ProgressData>({});

  useEffect(() => {
    setProgress(loadProgress(domain));
  }, [domain]);

  const updateProgress = useCallback((nodeId: string, status: NodeStatus) => {
    setProgress(prev => {
      const now = new Date().toISOString();
      const existing = prev[nodeId];
      const updated: ProgressData = {
        ...prev,
        [nodeId]: {
          status,
          startedAt:
            (status === 'in_progress' || status === 'completed') && !existing?.startedAt
              ? now
              : existing?.startedAt ?? null,
          completedAt: status === 'completed' ? now : existing?.completedAt ?? null,
        },
      };
      persistProgress(updated, domain);
      return updated;
    });
  }, [domain]);

  const resetProgress = useCallback(() => {
    localStorage.removeItem(getStorageKey(domain));
    setProgress({});
  }, [domain]);

  return { progress, updateProgress, resetProgress };
}
