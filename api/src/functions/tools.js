import { app } from '@azure/functions';
import { getTools } from '../lib/tools-service.js';

app.http('tools', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tools',
  handler: async (req, context) => {
    try {
      const refresh = req.query.get('refresh');
      const tools = await getTools({ refresh: refresh === '1' });
      return {
        jsonBody: { tools },
      };
    } catch (error) {
      context.error('Failed to load tools list:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to load tools list' },
      };
    }
  },
});
