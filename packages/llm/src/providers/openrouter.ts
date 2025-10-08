import { LLMConfig, LLMProvider } from '../types';

export class OpenRouterProvider implements LLMProvider {
    constructor(private apiKey = process.env.OPENROUTER_API_KEY, private base = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') { }
    async generate(prompt: string, config?: Partial<LLMConfig>): Promise<string> {
        if (!this.apiKey) throw new Error('OPENROUTER_API_KEY missing');
        const model = config?.model || 'openrouter/auto';
        const res = await fetch(`${this.base}/chat/completions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: config?.temperature ?? 0.2, max_tokens: config?.maxTokens ?? 512 }),
        });
        if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
        const data: any = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }
}