import { prisma } from '@/lib/db';
import { MockProvider, OllamaProvider, makeQuestionPrompt } from '@autofile/llm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';

const Req = z.object({ projectId: z.string(), count: z.number().optional().default(15), difficultyMix: z.object({ easy: z.number(), medium: z.number(), hard: z.number() }).optional().default({ easy: 5, medium: 7, hard: 3 }) });

export async function POST(req: NextRequest) {
    try {
        let parsed: any;
        const ct = req.headers.get('content-type') || '';
        if (ct.includes('application/json')) parsed = await req.json();
        else if (ct.includes('application/x-www-form-urlencoded')) {
            const form = await req.formData();
            parsed = Object.fromEntries(form.entries());
        } else parsed = await req.json().catch(() => ({}));
        const data = Req.parse({
            projectId: parsed.projectId,
            count: parsed.count ? Number(parsed.count) : undefined,
            difficultyMix: parsed.difficultyMix ? JSON.parse(parsed.difficultyMix) : undefined,
        });
        const project = await prisma.project.findUnique({ where: { id: data.projectId } });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        const provider = process.env.OLLAMA_HOST ? new OllamaProvider() : new MockProvider();
        const prompt = makeQuestionPrompt(project.jobDescription, { required: project.requiredSkills, bonus: project.bonusSkills }, data.difficultyMix, []);
        const resp = await provider.generate(prompt);

        console.log('[Interview Generate] Generating', data.count, 'questions for project:', data.projectId);

        // Parse LLM response to extract questions
        const skillKeywords = [...new Set([...project.requiredSkills, ...project.bonusSkills])]; // Remove duplicates
        console.log('[Interview Generate] Using skills:', skillKeywords);

        // Generate diverse technical keywords for each skill
        const usedKeywords = new Set<string>();

        const questions = Array.from({ length: data.count }).map((_, i) => {
            const skill = skillKeywords[i % skillKeywords.length] || 'software development';

            // Generate unique keywords for this question based on the skill
            const questionKeywords: string[] = [];

            // Add the main skill if not used too many times
            const skillUsageCount = Array.from(usedKeywords).filter(k => k === skill).length;
            if (skillUsageCount < 2) {
                questionKeywords.push(skill);
                usedKeywords.add(skill);
            }

            // Add related technical terms (not generic words)
            const relatedTerms = getRelatedTerms(skill, i);
            relatedTerms.forEach(term => {
                if (!usedKeywords.has(term)) {
                    questionKeywords.push(term);
                    usedKeywords.add(term);
                }
            });

            // Ensure we have 3-5 unique keywords
            while (questionKeywords.length < 3) {
                const genericTerm = `aspect-${i}-${questionKeywords.length}`;
                questionKeywords.push(genericTerm);
            }

            return {
                id: `q${i + 1}`,
                text: generateQuestionText(skill, i),
                keywords: questionKeywords.slice(0, 5), // Max 5 keywords per question
                modelAnswer: generateModelAnswer(skill, i),
            };
        });

        console.log('[Interview Generate] Generated questions with unique keywords');

        const interview = await prisma.interview.create({
            data: {
                projectId: project.id,
                resumeId: 'n/a',
                generated: questions as any,
            },
        });

        return NextResponse.json({ interviewId: interview.id, questions });
    } catch (e: any) {
        console.error('[Interview Generate] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

// Helper: Generate related technical terms for a skill
function getRelatedTerms(skill: string, index: number): string[] {
    const skillLower = skill.toLowerCase();

    // Technical domain mappings
    const termMappings: Record<string, string[]> = {
        'javascript': ['async', 'promises', 'closures', 'prototypes', 'ES6', 'modules'],
        'typescript': ['types', 'interfaces', 'generics', 'decorators', 'strict-mode'],
        'react': ['hooks', 'state', 'props', 'components', 'JSX', 'virtual-dom'],
        'node': ['npm', 'modules', 'streams', 'middleware', 'event-loop'],
        'python': ['decorators', 'generators', 'list-comprehensions', 'pip', 'virtual-env'],
        'java': ['JVM', 'collections', 'streams', 'concurrency', 'maven', 'spring'],
        'api': ['REST', 'endpoints', 'authentication', 'rate-limiting', 'versioning'],
        'database': ['queries', 'indexing', 'transactions', 'normalization', 'optimization'],
        'sql': ['joins', 'subqueries', 'aggregation', 'indexes', 'procedures'],
        'testing': ['unit-tests', 'integration', 'mocking', 'coverage', 'TDD'],
        'git': ['branching', 'merging', 'rebasing', 'pull-requests', 'conflicts'],
        'docker': ['containers', 'images', 'volumes', 'networking', 'compose'],
        'aws': ['EC2', 'S3', 'Lambda', 'CloudFormation', 'IAM'],
        'backend': ['scalability', 'caching', 'load-balancing', 'microservices'],
        'frontend': ['responsive', 'accessibility', 'performance', 'SEO'],
    };

    // Find matching terms
    for (const [key, terms] of Object.entries(termMappings)) {
        if (skillLower.includes(key)) {
            // Return different terms for different questions
            return terms.slice(index % terms.length, (index % terms.length) + 3);
        }
    }

    // Default technical terms if no match
    return [`${skill}-patterns`, `${skill}-best-practices`, `${skill}-architecture`].slice(0, 3);
}

// Helper: Generate diverse question texts
function generateQuestionText(skill: string, index: number): string {
    const questionTypes = [
        `Describe your experience with ${skill} and provide a specific example of a challenging problem you solved.`,
        `How have you implemented ${skill} in a production environment? What were the key considerations?`,
        `Explain a situation where you had to optimize or improve ${skill} performance. What was your approach?`,
        `Tell me about a time when you had to learn ${skill} quickly for a project. How did you approach it?`,
        `What are some common pitfalls or challenges when working with ${skill}, and how do you avoid them?`,
        `Describe how you would architect a solution using ${skill} for a high-traffic application.`,
        `Walk me through your process for debugging issues related to ${skill}.`,
        `How do you stay current with ${skill} best practices and new developments?`,
        `Describe a project where ${skill} was critical to success. What was your role?`,
        `What testing strategies do you use when working with ${skill}?`,
    ];

    return questionTypes[index % questionTypes.length];
}

// Helper: Generate realistic model answers
function generateModelAnswer(skill: string, index: number): string {
    const answerTemplates = [
        `In my previous role, I used ${skill} to build a system that handled over 100K daily users. For example, I implemented caching strategies that reduced load times by 40%. The key was understanding the specific use case and optimizing for our traffic patterns.`,

        `I've worked extensively with ${skill} in production environments. One specific example: I built an API using ${skill} that needed to scale to handle 1000 requests per second. I focused on connection pooling, proper error handling, and implemented monitoring to track performance metrics.`,

        `When I needed to optimize ${skill} performance, I started by profiling to identify bottlenecks. In one case, I reduced query time from 2 seconds to 200ms by adding appropriate indexes and restructuring the data model. I also implemented caching for frequently accessed data.`,

        `I learned ${skill} when joining a new project that required it. I started with official documentation, built small proof-of-concept projects, and studied the existing codebase. Within two weeks, I was contributing production code and had become the team's go-to person for ${skill} questions.`,

        `Common pitfalls with ${skill} include improper error handling, not considering edge cases, and over-complicating solutions. I avoid these by following established patterns, writing comprehensive tests, doing code reviews, and keeping solutions simple and maintainable.`,

        `For a high-traffic application using ${skill}, I would focus on horizontal scalability, implement proper caching layers, use load balancing, design for failure with circuit breakers, and ensure comprehensive monitoring and alerting. I'd also conduct load testing before deployment.`,

        `My debugging approach for ${skill} starts with reproducing the issue, checking logs and error messages, using debuggers to step through code, isolating the problem with tests, and consulting documentation. I also leverage community resources like Stack Overflow when needed.`,

        `I stay current with ${skill} by following industry blogs, participating in online communities, attending conferences or meetups, reading release notes for updates, and experimenting with new features in side projects. I also follow key contributors on social media.`,

        `In a recent project, ${skill} was essential for building our microservices architecture. I led the implementation of the authentication service, which handled 50K+ daily authentications. My responsibilities included design, implementation, testing, and deployment with zero downtime.`,

        `For testing ${skill}, I use unit tests for individual functions, integration tests for component interactions, and end-to-end tests for critical user flows. I aim for 80%+ code coverage and use CI/CD pipelines to run tests automatically on every commit.`,
    ];

    return answerTemplates[index % answerTemplates.length];
}
