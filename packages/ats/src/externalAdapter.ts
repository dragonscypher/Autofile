import type { ATSDetail, ATSScanner } from './types';

export class ExternalATSAdapter implements ATSScanner {
    constructor(private endpoint: string) { }
    async scoreResume(input: {
        resumeId: string;
        resumeText: string;
        jobDescription: string;
        requiredSkills: string[];
        bonusSkills: string[];
    }): Promise<ATSDetail> {
        // Placeholder: call out to an external service
        // For now, return a deterministic, low-confidence result
        return {
            resumeId: input.resumeId,
            score: 50,
            components: { similarity: 0.4, keywordCoverage: 0.4, recency: 0.1, formatQuality: 0.1 },
            matchedKeywords: [],
            missingMustHaves: input.requiredSkills,
            notes: ['external-adapter-disabled'],
        };
    }
}
