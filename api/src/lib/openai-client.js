import OpenAI from 'openai';

export function createGitHubModelsClient() {
  const endpoint = process.env.GITHUB_MODEL_ENDPOINT || 'https://models.github.ai/inference';
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN environment variable.');
  }

  return new OpenAI({
    baseURL: endpoint,
    apiKey: token,
    dangerouslyAllowBrowser: false,
  });
}
