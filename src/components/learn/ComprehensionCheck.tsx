'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NodeStatus, QuizQuestion } from '@/types';
import { useLocale } from '@/i18n/useLocale';
import { getContentBasePath } from '@/lib/content-manifest';
import QuizView from './QuizView';

interface ComprehensionCheckProps {
  nodeId: string;
  status: NodeStatus;
  area: string;
  onUpdateProgress: (nodeId: string, status: NodeStatus) => void;
  quiz?: QuizQuestion[];
  mapUrl?: string;
  domainMapUrl?: string;
}

export default function ComprehensionCheck({ nodeId, status, area, onUpdateProgress, quiz, mapUrl, domainMapUrl }: ComprehensionCheckProps) {
  const [loading, setLoading] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  const resolvedMapUrl = mapUrl || `/map?area=${area}`;

  const handleComplete = () => {
    setLoading(true);
    onUpdateProgress(nodeId, 'completed');
    window.location.href = `${getContentBasePath()}${resolvedMapUrl}`;
  };

  const handleStartLearning = () => {
    setLoading(true);
    onUpdateProgress(nodeId, 'in_progress');
    setLoading(false);
  };

  if (status === 'completed') {
    return (
      <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-6 text-center">
        <p className="text-emerald-700 dark:text-emerald-300 font-semibold">{t('comprehension.alreadyCompleted')}</p>
        <div className="mt-3 flex justify-center gap-3">
          <button
            onClick={() => router.push(resolvedMapUrl)}
            className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            {t('common.backToMap')}
          </button>
          {domainMapUrl && (
            <button
              onClick={() => router.push(domainMapUrl)}
              className="rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-emerald-950 px-6 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900"
            >
              {t('common.backToOverview')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show quiz if available and not yet completed
  if (quiz && quiz.length > 0 && !quizCompleted) {
    return <QuizView questions={quiz} onComplete={() => setQuizCompleted(true)} />;
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">{t('comprehension.title')}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        {t('comprehension.description')}
      </p>
      <div className="flex gap-3">
        {status !== 'in_progress' && (
          <button
            onClick={handleStartLearning}
            disabled={loading}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            {t('comprehension.startLearning')}
          </button>
        )}
        <button
          onClick={handleComplete}
          disabled={loading}
          className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? t('common.processing') : t('comprehension.understood')}
        </button>
      </div>
    </div>
  );
}
