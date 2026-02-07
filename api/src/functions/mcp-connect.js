import { app } from '@azure/functions';
import { getMCPServerById } from '../lib/mcp/servers.js';
import { MCPClient } from '../lib/mcp/client.js';

const clientCache = new Map();

app.http('mcp-connect', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'mcp/connect',
  handler: async (req, context) => {
    try {
      const body = await req.json().catch(() => ({}));
      const serverId = body && body.serverId;

      if (!serverId) {
        return { status: 400, jsonBody: { error: 'Missing serverId parameter' } };
      }

      const serverConfig = getMCPServerById(serverId);
      if (!serverConfig) {
        return { status: 404, jsonBody: { error: `Server not found: ${serverId}` } };
      }

      let client = clientCache.get(serverId);
      if (!client || !client.isInitialized()) {
        client = new MCPClient(serverConfig);
        try {
          await client.initialize();
          clientCache.set(serverId, client);
        } catch (e) {
          context.error(`Failed to initialize MCP client for ${serverId}:`, e);
          const msg = e instanceof Error ? e.message : 'Failed to connect to MCP server';
          return { status: 502, jsonBody: { error: msg } };
        }
      }

      const tools = client.getTools();
      return {
        jsonBody: {
          serverId,
          serverName: serverConfig.name,
          connected: true,
          tools,
        },
      };
    } catch (error) {
      context.error('MCP connect error:', error);
      return {
        status: 500,
        jsonBody: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  },
});

export function getCachedMCPClient(serverId) {
  return clientCache.get(serverId);
}
