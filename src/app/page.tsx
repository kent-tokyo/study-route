'use client';

import Link from 'next/link';
import { getDomains } from '@/data/graph';
import { useTheme } from '@/hooks/useTheme';
import { useLocale } from '@/i18n/useLocale';
import { localize } from '@/i18n/localize';
import LanguageSelector from '@/components/shared/LanguageSelector';
import Footer from '@/components/shared/Footer';

const domains = getDomains();

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { locale, t } = useLocale();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-3">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">study-route</h1>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
            title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t('domain.selectTitle')}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('domain.selectDescription')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map(domain => (
              <Link
                key={domain.id}
                href={`/${domain.id}/map`}
                className="group rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 transition-all hover:shadow-lg hover:scale-[1.02]"
                style={{ borderColor: domain.color + '40' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ backgroundColor: domain.color }}
                  />
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{localize(locale, domain.label, domain.labels)}</span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{localize(locale, domain.description, domain.descriptions)}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
