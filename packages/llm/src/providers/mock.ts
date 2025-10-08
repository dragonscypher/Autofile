import { LLMConfig, LLMProvider } from '../types';

export class MockProvider implements LLMProvider {
    async generate(prompt: string, _config?: Partial<LLMConfig>): Promise<string> {
        const hash = Array.from(prompt).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 1000;
        return `Mock response ${hash}`;
    }
}
