'use client';

import { useCallback, useEffect, useState } from 'react';

export type ContentLevel = 'beginner' | 'standard' | 'advanced';

const STORAGE_KEY = 'study-route_content_level';

export function useSettings() {
  const [contentLevel, setContentLevelState] = useState<ContentLevel>('standard');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'beginner' || saved === 'standard' || saved === 'advanced') {
      setContentLevelState(saved);
    }
  }, []);

  const setContentLevel = useCallback((level: ContentLevel) => {
    setContentLevelState(level);
    localStorage.setItem(STORAGE_KEY, level);
  }, []);

  return { contentLevel, setContentLevel };
}
