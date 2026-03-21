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
import { getNode } from '@/lib/graph';
import type { DomainId } from '@/types/domain';

interface LearnPageClientProps {
  nodeId: string;
  domain?: DomainId;
}

export default function LearnPageClient({ nodeId, domain }: LearnPageClientProps) {
  const router = useRouter();
  const { locale, t } = useLocale();

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
          <div className={availableLevels.length <= 1 ? 'ml-auto' : ''}>
            <LanguageSelector />
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
    </div>
  );
}
