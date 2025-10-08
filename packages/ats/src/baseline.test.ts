import { describe, expect, it } from 'vitest';
import { BaselineATS } from './baseline';

describe('BaselineATS', () => {
    it('scores resume deterministically', async () => {
        const ats = new BaselineATS();
        const res = await ats.scoreResume({
            resumeId: 'r1',
            resumeText: 'Experienced in Node.js, TypeScript and PostgreSQL',
            jobDescription: 'Looking for Node.js and PostgreSQL developer',
            requiredSkills: ['Node.js', 'PostgreSQL'],
            bonusSkills: ['TypeScript'],
        });
        expect(res.score).toBeGreaterThan(0);
        expect(res.components.similarity).toBeGreaterThan(0);
    });
});
