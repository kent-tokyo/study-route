'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConceptView from '@/components/learn/ConceptView';
import TermList from '@/components/learn/TermList';
import ComprehensionCheck from '@/components/learn/ComprehensionCheck';
import { useContent } from '@/hooks/useContent';
import { useProgress } from '@/hooks/useProgress';
import { useSettings, type ContentLevel } from '@/hooks/useSettings';
import { useLocale } from '@/i18n/useLocale';
import { localize } from '@/i18n/localize';
import LanguageSelector from '@/components/shared/LanguageSelector';
import { useTheme } from '@/hooks/useTheme';
import { getNode } from '@/lib/graph';
import type { DomainId } from '@/types/domain';

interface LearnPageClientProps {
  nodeId: string;
  domain?: DomainId;
}

export default function LearnPageClient({ nodeId, domain }: LearnPageClientProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const node = useMemo(() => getNode(nodeId, domain), [nodeId, domain]);
  const { contentLevel, setContentLevel } = useSettings();
  const { progress, updateProgress } = useProgress(domain);
  const { data, illustrationUrl, loading, error, resolvedLevel, availableLevels } = useContent(nodeId, contentLevel, domain);

  const status = progress[nodeId]?.status ?? 'available';
  const mapUrl = domain ? `/${domain}/map?area=${node?.area}` : `/map?area=${node?.area}`;
  const domainMapUrl = domain ? `/${domain}/map` : `/map`;

  if (!node) {
    router.replace(domain ? `/${domain}/map` : '/map');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-zinc-950">
        <p className="text-zinc-500 dark:text-zinc-400">{t('common.notFound')}</p>
        <Link
          href={mapUrl}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
        >
          {t('common.backToMap')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <Link href={mapUrl} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            {t('common.backToMap')}
          </Link>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {node.number && <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500 mr-1.5">{node.number}</span>}
            {localize(locale, node.label, node.labels)}
          </h1>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {'★'.repeat(node.difficulty)} · {localize(locale, node.description, node.descriptions)}
          </span>
          {availableLevels.length > 1 && (
            <div className="ml-auto flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {(['beginner', 'standard', 'advanced'] as ContentLevel[])
                .filter(l => availableLevels.includes(l))
                .map(level => (
                  <button
                    key={level}
                    onClick={() => setContentLevel(level)}
                    className={`px-2 py-1 text-xs transition-colors ${
                      resolvedLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {t(`level.${level}`)}
                  </button>
                ))}
            </div>
          )}
          <div className={`flex items-center gap-2 ${availableLevels.length <= 1 ? 'ml-auto' : ''}`}>
            <LanguageSelector />
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
              title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-10">
        <ConceptView
          content={data.content}
          diagrams={data.diagrams}
          illustrationUrl={illustrationUrl}
          label={node.label}
        />

        <TermList terms={data.terms} />

        <ComprehensionCheck
          nodeId={nodeId}
          status={status}
          area={node.area}
          onUpdateProgress={updateProgress}
          quiz={data.quiz}
          mapUrl={mapUrl}
          domainMapUrl={domainMapUrl}
        />
      </main>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-20 rounded-full bg-zinc-700 dark:bg-zinc-600 p-3 text-white shadow-lg transition-opacity hover:bg-zinc-600 dark:hover:bg-zinc-500"
        title={t('common.backToTop')}
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
    </div>
  );
}
