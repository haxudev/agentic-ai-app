let requestIdCounter = 0;

function generateRequestId() {
  requestIdCounter += 1;
  return requestIdCounter;
}

async function parseSSEResponse(response) {
  const text = await response.text();
  const lines = text.split('\n');

  let result = null;
  const sessionId = response.headers.get('mcp-session-id') || undefined;

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6);
    if (!data.trim()) continue;

    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.result !== undefined) {
        result = parsed.result;
      } else if (parsed && parsed.error) {
        throw new Error(`MCP error: ${parsed.error.message} (code: ${parsed.error.code})`);
      }
    } catch (e) {
      if (e instanceof SyntaxError) continue;
      throw e;
    }
  }

  if (result === null) {
    throw new Error('No valid response data found in SSE stream');
  }

  return { result, sessionId };
}

async function sendMCPRequest(endpoint, method, params, auth, sessionId) {
  const request = {
    jsonrpc: '2.0',
    id: generateRequestId(),
    method,
    params,
  };

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };

  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  if (auth) {
    if (auth.type === 'bearer' && auth.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    } else if (auth.type === 'api-key' && auth.token) {
      const headerName = auth.headerName || 'X-API-Key';
      headers[headerName] = auth.token;
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    return parseSSEResponse(response);
  }

  const data = await response.json();
  const newSessionId = response.headers.get('mcp-session-id') || undefined;

  if (data && data.error) {
    throw new Error(`MCP error: ${data.error.message} (code: ${data.error.code})`);
  }

  return { result: data.result, sessionId: newSessionId };
}

export class MCPClient {
  constructor(config) {
    this.config = config;
    this.tools = [];
    this.initialized = false;
    this.sessionId = undefined;
  }

  getConfig() {
    return this.config;
  }

  isInitialized() {
    return this.initialized;
  }

  getTools() {
    return this.tools;
  }

  async initialize() {
    const { result, sessionId } = await sendMCPRequest(
      this.config.endpoint,
      'initialize',
      {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'agentic-ai-app', version: '0.1.0' },
      },
      this.config.auth
    );

    if (sessionId) {
      this.sessionId = sessionId;
    }

    await this.sendNotification('notifications/initialized', {});
    this.initialized = true;
    await this.listTools();
    return result;
  }

  async sendNotification(method, params) {
    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const auth = this.config.auth;
    if (auth) {
      if (auth.type === 'bearer' && auth.token) {
        headers.Authorization = `Bearer ${auth.token}`;
      } else if (auth.type === 'api-key' && auth.token) {
        const headerName = auth.headerName || 'X-API-Key';
        headers[headerName] = auth.token;
      }
    }

    await fetch(this.config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(notification),
    });
  }

  async listTools() {
    const { result } = await sendMCPRequest(
      this.config.endpoint,
      'tools/list',
      {},
      this.config.auth,
      this.sessionId
    );

    this.tools = (result && result.tools) || [];
    return this.tools;
  }

  async callTool(params) {
    const { result } = await sendMCPRequest(
      this.config.endpoint,
      'tools/call',
      params,
      this.config.auth,
      this.sessionId
    );
    return result;
  }

  disconnect() {
    this.initialized = false;
    this.tools = [];
    this.sessionId = undefined;
  }
}

export function mcpResultToText(result) {
  if (!result || !Array.isArray(result.content) || result.content.length === 0) {
    return '';
  }

  return result.content
    .map((content) => {
      if (content.type === 'text' && content.text) return content.text;
      if (content.type === 'resource' && content.resource && content.resource.text) return content.resource.text;
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export function mcpToolToOpenAIFunction(serverId, tool) {
  const functionName = `${serverId}__${tool.name}`;
  return {
    type: 'function',
    function: {
      name: functionName,
      description: tool.description,
      parameters: tool.inputSchema || {},
    },
  };
}

export function parseOpenAIFunctionName(functionName) {
  const parts = String(functionName || '').split('__');
  if (parts.length < 2) return null;
  return {
    serverId: parts[0],
    toolName: parts.slice(1).join('__'),
  };
}
