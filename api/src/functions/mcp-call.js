import { app } from '@azure/functions';
import { getMCPServerById } from '../lib/mcp/servers.js';
import { MCPClient, mcpResultToText } from '../lib/mcp/client.js';
import { getCachedMCPClient } from './mcp-connect.js';

const localCache = new Map();

async function getOrCreateClient(serverId) {
  const cached = getCachedMCPClient(serverId);
  if (cached && cached.isInitialized()) return cached;

  const local = localCache.get(serverId);
  if (local && local.isInitialized()) return local;

  const config = getMCPServerById(serverId);
  if (!config) throw new Error(`Server not found: ${serverId}`);

  const client = new MCPClient(config);
  await client.initialize();
  localCache.set(serverId, client);
  return client;
}

app.http('mcp-call', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'mcp/call',
  handler: async (req, context) => {
    try {
      const body = await req.json().catch(() => ({}));
      const serverId = body && body.serverId;
      const toolName = body && body.toolName;
      const args = (body && body.arguments) || {};

      if (!serverId || !toolName) {
        return { status: 400, jsonBody: { error: 'Missing serverId or toolName parameter' } };
      }

      const client = await getOrCreateClient(serverId);
      const result = await client.callTool({ name: toolName, arguments: args });

      return {
        jsonBody: {
          serverId,
          toolName,
          result,
          text: mcpResultToText(result),
          isError: Boolean(result && result.isError),
        },
      };
    } catch (error) {
      context.error('MCP tool call error:', error);
      return {
        status: 500,
        jsonBody: {
          error: error instanceof Error ? error.message : 'Unknown error',
          isError: true,
        },
      };
    }
  },
});
