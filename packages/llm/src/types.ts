export type LLMConfig = {
    provider: 'ollama' | 'huggingface' | 'openrouter' | 'mock';
    model: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
};

export interface LLMProvider {
    generate(prompt: string, config?: Partial<LLMConfig>): Promise<string>;
}
