import { app } from '@azure/functions';
import { createGitHubModelsClient } from '../lib/openai-client.js';
import { getToolById } from '../lib/tools-service.js';
import { getMCPServerById } from '../lib/mcp/servers.js';
import {
  MCPClient,
  mcpToolToOpenAIFunction,
  parseOpenAIFunctionName,
  mcpResultToText,
} from '../lib/mcp/client.js';

const mcpClientCache = new Map();

async function getOrCreateMCPClient(serverId) {
  let client = mcpClientCache.get(serverId);
  if (client && client.isInitialized()) return client;

  const serverConfig = getMCPServerById(serverId);
  if (!serverConfig) return null;

  client = new MCPClient(serverConfig);
  await client.initialize();
  mcpClientCache.set(serverId, client);
  return client;
}

function buildUserContent(prompt, imageAttachments) {
  const normalizedPrompt = typeof prompt === 'string' ? prompt : '';
  const normalizedImages = Array.isArray(imageAttachments) ? imageAttachments : [];

  const parts = [];
  if (normalizedPrompt.trim().length > 0) {
    parts.push({ type: 'text', text: normalizedPrompt });
  }

  for (const attachment of normalizedImages) {
    if (!attachment) continue;
    const dataUrl = attachment.dataUrl;
    const base64 = attachment.base64;
    const mimeType = attachment.mimeType;

    let url = null;
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      url = dataUrl;
    } else if (typeof base64 === 'string' && base64.trim().length > 0) {
      const resolvedMime = typeof mimeType === 'string' && mimeType ? mimeType : 'image/jpeg';
      url = `data:${resolvedMime};base64,${base64}`;
    }

    if (url) {
      parts.push({ type: 'image_url', image_url: { url, detail: 'high' } });
    }
  }

  if (parts.length === 1 && parts[0].type === 'text') {
    return parts[0].text;
  }
  return parts.length > 0 ? parts : ' ';
}

app.http('instruct-agent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'instruct-agent',
  handler: async (req, context) => {
    try {
      const body = await req.json().catch(() => ({}));
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : '';
      const prompt = body.prompt;
      const tool = body.tool;
      const model = body.model;
      const imageAttachments = Array.isArray(body.imageAttachments) ? body.imageAttachments : [];
      const enabledMCPServers = Array.isArray(body.enabledMCPServers) ? body.enabledMCPServers : [];

      const hasPrompt = typeof prompt === 'string' && prompt.trim().length > 0;
      const hasImages = Array.isArray(imageAttachments) && imageAttachments.length > 0;
      if (!messages || (!hasPrompt && !hasImages) || !tool || !model) {
        return { status: 400, jsonBody: { error: 'Missing required parameters' } };
      }

      const selectedTool = await getToolById(tool).catch(() => undefined);
      if (!selectedTool) {
        return { status: 400, jsonBody: { error: 'Selected tool not found' } };
      }

      const client = createGitHubModelsClient();

      const userMessageContent = buildUserContent(prompt, imageAttachments);

      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
          .filter((m) => m && m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessageContent },
      ];

      // Prepare MCP tools
      const mcpTools = [];
      const mcpServerMap = new Map();
      for (const serverId of enabledMCPServers) {
        try {
          const mcpClient = await getOrCreateMCPClient(serverId);
          if (!mcpClient) continue;
          const toolsList = mcpClient.getTools();
          mcpServerMap.set(serverId, { client: mcpClient, tools: toolsList });
          for (const t of toolsList) {
            mcpTools.push(mcpToolToOpenAIFunction(serverId, t));
          }
        } catch (e) {
          context.warn(`[MCP] Failed to init server ${serverId}:`, e);
        }
      }

      const conversationMessages = [...formattedMessages];
      const MAX_TOOL_ITERATIONS = 10;
      let toolIterations = 0;
      const toolCallsTrace = [];

      while (toolIterations < MAX_TOOL_ITERATIONS) {
        toolIterations += 1;

        const requestOptions = {
          model,
          messages: conversationMessages,
          ...(mcpTools.length > 0 ? { tools: mcpTools, tool_choice: 'auto' } : {}),
        };

        const completion = await client.chat.completions.create(requestOptions);
        const choice = completion && completion.choices ? completion.choices[0] : null;
        const msg = choice && choice.message ? choice.message : null;
        const assistantContent = (msg && msg.content) || '';
        const toolCalls = (msg && msg.tool_calls) || [];

        if (!toolCalls || toolCalls.length === 0) {
          return {
            jsonBody: {
              content: assistantContent,
              usage: completion.usage,
              toolIterations,
              toolCalls: toolCallsTrace,
            },
          };
        }

        // Add assistant message with tool calls
        conversationMessages.push({
          role: 'assistant',
          content: assistantContent || null,
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function && toolCall.function.name;
          const parsed = parseOpenAIFunctionName(functionName);

          if (!parsed) {
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: `Error: Invalid function name format: ${functionName}`,
            });
            toolCallsTrace.push({
              id: toolCall.id,
              name: functionName,
              status: 'error',
              error: 'Invalid function name format',
            });
            continue;
          }

          const serverInfo = mcpServerMap.get(parsed.serverId);
          if (!serverInfo) {
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: `Error: MCP server not found: ${parsed.serverId}`,
            });
            toolCallsTrace.push({
              id: toolCall.id,
              name: functionName,
              status: 'error',
              error: `MCP server not found: ${parsed.serverId}`,
            });
            continue;
          }

          let args = {};
          const rawArgs = toolCall.function && toolCall.function.arguments;
          if (rawArgs) {
            try {
              args = JSON.parse(rawArgs);
            } catch {
              // ignore parse errors, pass empty args
            }
          }

          try {
            const result = await serverInfo.client.callTool({
              name: parsed.toolName,
              arguments: args,
            });
            const resultText = mcpResultToText(result);
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: resultText || 'Tool executed successfully with no output.',
            });
            toolCallsTrace.push({
              id: toolCall.id,
              name: functionName,
              serverId: parsed.serverId,
              toolName: parsed.toolName,
              status: 'completed',
              preview: resultText ? resultText.slice(0, 200) : '',
            });
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Unknown error';
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: `Error calling tool: ${errorMsg}`,
            });
            toolCallsTrace.push({
              id: toolCall.id,
              name: functionName,
              serverId: parsed.serverId,
              toolName: parsed.toolName,
              status: 'error',
              error: errorMsg,
            });
          }
        }
      }

      return {
        status: 200,
        jsonBody: {
          content: '',
          warning: `Max tool iterations (${MAX_TOOL_ITERATIONS}) reached`,
          toolIterations,
          toolCalls: toolCallsTrace,
        },
      };
    } catch (error) {
      context.error('Request handling error:', error);
      return {
        status: 500,
        jsonBody: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
});
