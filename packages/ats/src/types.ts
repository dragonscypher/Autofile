export type ATSDetail = {
    resumeId: string;
    score: number;
    components: {
        similarity: number;
        keywordCoverage: number;
        recency: number;
        formatQuality: number;
    };
    matchedKeywords: string[];
    missingMustHaves: string[];
    notes: string[];
};

export interface ATSScanner {
    scoreResume(input: {
        resumeId: string;
        resumeText: string;
        jobDescription: string;
        requiredSkills: string[];
        bonusSkills: string[];
    }): Promise<ATSDetail>;
}
