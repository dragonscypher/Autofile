import { LLMConfig, LLMProvider } from '../types';

export class HuggingFaceProvider implements LLMProvider {
    constructor(private apiKey = process.env.HF_API_KEY) { }
    async generate(prompt: string, config?: Partial<LLMConfig>): Promise<string> {
        if (!this.apiKey) throw new Error('HF_API_KEY missing');
        const model = config?.model || 'google/flan-t5-base';
        const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
        });
        if (!res.ok) throw new Error(`HF error ${res.status}`);
        const data: any = await res.json();
        const out = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '';
        return out || JSON.stringify(data);
    }
}