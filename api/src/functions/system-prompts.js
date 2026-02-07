import { app } from '@azure/functions';
import { getToolById } from '../lib/tools-service.js';
import { fetchSystemPrompt } from '../lib/prompt-loader.js';

app.http('system-prompts', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'system-prompts/{tool}',
  handler: async (req, context) => {
    try {
      const toolId = req.params.tool;
      const tool = await getToolById(toolId);
      if (!tool) {
        return { status: 404, jsonBody: { error: 'Tool not found' } };
      }

      const refresh = req.query.get('refresh');
      let prompt = '';

      if (tool.systemPromptUrl) {
        prompt = await fetchSystemPrompt(tool.systemPromptUrl, {
          skipCache: refresh === '1',
        });
      }

      if (!prompt || prompt.length === 0) {
        prompt = tool.fallbackSystemPrompt || '';
      }

      return { jsonBody: { prompt } };
    } catch (error) {
      context.error('Failed to load system prompt:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to load system prompt' },
      };
    }
  },
});
