export interface ModelDefinition {
  id: string;
  name: string;
}

export const models: ModelDefinition[] = [
  // GPT-4.1 系列
  {
    id: 'openai/gpt-4.1',
    name: 'OpenAI GPT-4.1',
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'OpenAI GPT-4.1-mini',
  },
  // GPT-5 系列
  {
    id: 'openai/gpt-5',
    name: 'OpenAI gpt-5',
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'OpenAI gpt-5-mini',
  },
  {
    id: 'openai/gpt-5-nano',
    name: 'OpenAI gpt-5-nano',
  },
  // DeepSeek
  {
    id: 'deepseek/DeepSeek-V3-0324',
    name: 'DeepSeek-V3-0324',
  },
];
