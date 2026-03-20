interface ManifestEntry {
  levels: string[];
  hasIllustration: Record<string, boolean>;
}

type Manifest = Record<string, ManifestEntry>;

let cached: Manifest | null = null;

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function getContentBasePath(): string {
  return BASE_PATH;
}

export async function getManifest(): Promise<Manifest> {
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE_PATH}/content/manifest.json`);
    if (!res.ok) return {};
    cached = await res.json();
    return cached!;
  } catch {
    return {};
  }
}

export async function getAvailableLevels(nodeId: string): Promise<string[]> {
  const manifest = await getManifest();
  return manifest[nodeId]?.levels ?? [];
}

export async function hasIllustration(nodeId: string, level: string): Promise<boolean> {
  const manifest = await getManifest();
  return manifest[nodeId]?.hasIllustration[level] ?? false;
}
