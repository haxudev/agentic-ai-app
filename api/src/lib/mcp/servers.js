export const MCP_SERVERS = [
  {
    id: 'microsoft-learn',
    name: 'Microsoft Learn',
    description: 'Microsoft official docs and code samples search',
    endpoint: 'https://learn.microsoft.com/api/mcp',
    icon: 'M',
    enabled: false,
    auth: { type: 'none' },
  },
  {
    id: 'web-fetch',
    name: 'Web Fetch',
    description: 'Fetch a web page and convert to Markdown',
    endpoint: 'https://remote.mcpservers.org/fetch/mcp',
    icon: 'W',
    enabled: false,
    auth: { type: 'none' },
  },
  {
    id: 'deepwiki',
    name: 'DeepWiki',
    description: 'Deep wiki search and Q&A',
    endpoint: 'https://mcp.deepwiki.com/mcp',
    icon: 'D',
    enabled: false,
    auth: { type: 'none' },
  },
];

export function getMCPServers() {
  return MCP_SERVERS;
}

export function getMCPServerById(id) {
  return MCP_SERVERS.find((s) => s.id === id);
}
