const TOOLS_CACHE_TTL_MS = Number(process.env.GITHUB_TOOLS_CACHE_TTL_MS || 300000);
const GIST_ID = process.env.GITHUB_TOOLS_GIST_ID || '614481beb4d227eeebfd4497fe504c71';
const GITHUB_API_BASE = 'https://api.github.com';

let cache = null;

function normalizeId(filename) {
  return String(filename || '').trim().toLowerCase().replace(/\s+/g, '-');
}

async function fetchGistFiles(refresh = false) {
  if (!refresh && cache && cache.expiresAt > Date.now()) {
    return cache.tools;
  }

  if (!GIST_ID) {
    throw new Error('GITHUB_TOOLS_GIST_ID is not configured.');
  }

  const url = `${GITHUB_API_BASE}/gists/${GIST_ID}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'agentic-ai-app',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tools gist: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const files = data && data.files ? Object.values(data.files) : [];

  const tools = files
    .filter((file) => file && (!file.type || String(file.type).startsWith('text')))
    .map((file) => {
      const id = normalizeId(file.filename || '');
      const name = file.filename || id;
      const systemPromptUrl = file.raw_url;
      const fallbackSystemPrompt = file.truncated ? undefined : (file.content || '').trim();

      return {
        id,
        name,
        systemPromptUrl,
        fallbackSystemPrompt,
      };
    })
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'en'));

  cache = {
    tools,
    expiresAt: Date.now() + TOOLS_CACHE_TTL_MS,
  };

  return tools;
}

export async function getTools(options = {}) {
  return fetchGistFiles(options.refresh === true);
}

export async function getToolById(id, options = {}) {
  if (!id) return undefined;
  const tools = await getTools(options);
  return tools.find((t) => t.id === id) || tools[0];
}

export function clearToolsCache() {
  cache = null;
}
