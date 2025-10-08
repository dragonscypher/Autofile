import { describe, expect, it } from 'vitest';
import { makeQuestionPrompt, makeRubricPrompt } from './promptTemplates';

describe('prompts', () => {
    it('builds question prompt', () => {
        const p = makeQuestionPrompt('Build APIs', { required: ['Node'], bonus: [] }, { easy: 3, medium: 3, hard: 3 }, ['doc1']);
        expect(p).toContain('Build APIs');
    });
    it('builds rubric prompt', () => {
        const p = makeRubricPrompt('What is Node.js?');
        expect(p).toContain('model answers');
    });
});
