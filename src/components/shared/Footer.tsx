'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 py-4">
      <div className="mx-auto max-w-3xl flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
        <span>&copy; {year} plactice_math</span>
        <div className="flex items-center gap-4">
          <Link href="/policy" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            Site Policy
          </Link>
          <a href="https://github.com/kent-tokyo/plactice_math" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
