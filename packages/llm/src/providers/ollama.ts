import { LLMConfig, LLMProvider } from '../types';

export class OllamaProvider implements LLMProvider {
    constructor(private baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434', private model = process.env.OLLAMA_MODEL || 'llama3') { }
    async generate(prompt: string, config?: Partial<LLMConfig>): Promise<string> {
        const res = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config?.model || this.model,
                prompt,
                options: { temperature: config?.temperature ?? 0.2, top_p: config?.topP ?? 0.95 },
                stream: false,
            }),
        });
        if (!res.ok) throw new Error(`Ollama error ${res.status}`);
        const data: any = await res.json();
        return data.response || '';
    }
}
