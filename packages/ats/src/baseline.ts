import { PorterStemmer, TfIdf, WordTokenizer } from 'natural';
import type { ATSDetail, ATSScanner } from './types';

const tokenizer = new WordTokenizer();

function normalize(text: string) {
    const tokens = tokenizer.tokenize(text.toLowerCase());
    if (!tokens) return '';
    return tokens
        .map((t: string) => PorterStemmer.stem(t))
        .join(' ');
} function cosineSim(tfidfA: TfIdf, tfidfB: TfIdf) {
    const terms = new Set<string>();
    // naive term collection
    // @ts-ignore
    tfidfA.documents[0] && Object.keys(tfidfA.documents[0]).forEach((k) => terms.add(k));
    // @ts-ignore
    tfidfB.documents[0] && Object.keys(tfidfB.documents[0]).forEach((k) => terms.add(k));
    let dot = 0;
    let a2 = 0;
    let b2 = 0;
    for (const term of terms) {
        const a = tfidfA.tfidf(term, 0) || 0;
        const b = tfidfB.tfidf(term, 0) || 0;
        dot += a * b;
        a2 += a * a;
        b2 += b * b;
    }
    if (a2 === 0 || b2 === 0) return 0;
    return dot / Math.sqrt(a2 * b2);
}

export class BaselineATS implements ATSScanner {
    async scoreResume(input: {
        resumeId: string;
        resumeText: string;
        jobDescription: string;
        requiredSkills: string[];
        bonusSkills: string[];
    }): Promise<ATSDetail> {
        const jd = normalize(input.jobDescription);
        const resume = normalize(input.resumeText);

        const tfidfJD = new TfIdf();
        const tfidfResume = new TfIdf();
        tfidfJD.addDocument(jd);
        tfidfResume.addDocument(resume);

        const similarity = cosineSim(tfidfResume, tfidfJD); // 0..1

        const allText = resume.split(' ');
        const stemmedSet = new Set(allText);
        const required = input.requiredSkills.map((s) => PorterStemmer.stem(s.toLowerCase()));
        const bonus = input.bonusSkills.map((s) => PorterStemmer.stem(s.toLowerCase()));
        const matchedReq = required.filter((s: string) => stemmedSet.has(s));
        const matchedBonus = bonus.filter((s: string) => stemmedSet.has(s));
        const keywordCoverageRaw = (matchedReq.length * 2 + matchedBonus.length) / (required.length * 2 + Math.max(1, bonus.length));
        const keywordCoverage = Math.min(1, keywordCoverageRaw);

        const recency = 0.2; // placeholder until resume dates parsed
        const formatQuality = 0.8; // heuristic placeholder

        const score = Math.round(
            100 * (0.5 * similarity + 0.35 * keywordCoverage + 0.1 * recency + 0.05 * formatQuality)
        );

        return {
            resumeId: input.resumeId,
            score,
            components: {
                similarity: Number(similarity.toFixed(3)),
                keywordCoverage: Number(keywordCoverage.toFixed(3)),
                recency,
                formatQuality,
            },
            matchedKeywords: [...new Set([...matchedReq, ...matchedBonus])],
            missingMustHaves: required.filter((s) => !stemmedSet.has(s)),
            notes: ['baseline-tfidf'],
        };
    }
}
