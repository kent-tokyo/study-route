interface ManifestEntry {
  levels: string[];
  hasIllustration: Record<string, boolean>;
  locales?: Record<string, string[]>;
}

type Manifest = Record<string, ManifestEntry>;

const cache = new Map<string, Manifest>();

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function getContentBasePath(): string {
  return BASE_PATH;
}

async function fetchManifest(domain: string): Promise<Manifest> {
  if (cache.has(domain)) return cache.get(domain)!;

  try {
    const res = await fetch(`${BASE_PATH}/content/${domain}/manifest.json`);
    if (res.ok) {
      const data = await res.json();
      cache.set(domain, data);
      return data;
    }
  } catch { /* ignore */ }

  return {};
}

export async function getAvailableLevels(nodeId: string, domain: string): Promise<string[]> {
  const manifest = await fetchManifest(domain);
  return manifest[nodeId]?.levels ?? [];
}

export async function hasIllustration(nodeId: string, level: string, domain: string): Promise<boolean> {
  const manifest = await fetchManifest(domain);
  return manifest[nodeId]?.hasIllustration[level] ?? false;
}

export async function getAvailableLocales(nodeId: string, level: string, domain: string): Promise<string[]> {
  const manifest = await fetchManifest(domain);
  return manifest[nodeId]?.locales?.[level] ?? ['ja'];
}
