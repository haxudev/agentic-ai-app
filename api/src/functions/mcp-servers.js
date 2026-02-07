import { app } from '@azure/functions';
import { getMCPServers } from '../lib/mcp/servers.js';

app.http('mcp-servers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mcp/servers',
  handler: async (_req, context) => {
    try {
      const servers = getMCPServers();
      return {
        jsonBody: {
          servers: servers.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            endpoint: s.endpoint,
            icon: s.icon,
            enabled: s.enabled,
          })),
        },
      };
    } catch (error) {
      context.error('MCP servers list error:', error);
      return {
        status: 500,
        jsonBody: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  },
});
