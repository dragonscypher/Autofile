import { OllamaProvider } from '@autofile/llm';
import type { ATSDetail, ATSScanner } from './types';

const jsonInstruction = `Return ONLY valid JSON with keys: score (0..100), components { similarity, keywordCoverage, recency, formatQuality }, matchedKeywords (string[]), missingMustHaves (string[]), notes (string[]).`;

export class LlmATS implements ATSScanner {
    constructor(private provider = new OllamaProvider()) { }
    async scoreResume(input: {
        resumeId: string;
        resumeText: string;
        jobDescription: string;
        requiredSkills: string[];
        bonusSkills: string[];
    }): Promise<ATSDetail> {
        const prompt = `You are an ATS. Score the resume for the job.
Job Description:\n${input.jobDescription}\n\nRequired skills: ${input.requiredSkills.join(', ')}\nBonus skills: ${input.bonusSkills.join(', ')}\n\nResume:\n${input.resumeText}\n\n${jsonInstruction}`;
        const resp = await this.provider.generate(prompt, { temperature: 0.1 });
        let parsed: any;
        try {
            const jsonStart = resp.indexOf('{');
            const jsonEnd = resp.lastIndexOf('}');
            parsed = JSON.parse(resp.slice(jsonStart, jsonEnd + 1));
        } catch {
            // Fallback minimal
            parsed = {
                score: 50,
                components: { similarity: 0.4, keywordCoverage: 0.4, recency: 0.1, formatQuality: 0.1 },
                matchedKeywords: [],
                missingMustHaves: input.requiredSkills,
                notes: ['llm-parse-failed'],
            };
        }
        const score = Math.max(0, Math.min(100, Math.round(parsed.score ?? 0)));
        return {
            resumeId: input.resumeId,
            score,
            components: {
                similarity: Number((parsed.components?.similarity ?? 0).toFixed?.(3) ?? parsed.components?.similarity ?? 0),
                keywordCoverage: Number((parsed.components?.keywordCoverage ?? 0).toFixed?.(3) ?? parsed.components?.keywordCoverage ?? 0),
                recency: Number(parsed.components?.recency ?? 0),
                formatQuality: Number(parsed.components?.formatQuality ?? 0),
            },
            matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
            missingMustHaves: Array.isArray(parsed.missingMustHaves) ? parsed.missingMustHaves : [],
            notes: Array.isArray(parsed.notes) ? parsed.notes : ['llm-ats'],
        };
    }
}

