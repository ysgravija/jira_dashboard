export type AIProvider = 'openai' | 'anthropic';

export interface AICredentials {
  provider: AIProvider;
  apiKey: string;
}

export interface OpenAICredentials {
  apiKey: string;
}