import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { BaselineATS, ExternalATSAdapter, LlmATS } from '@autofile/ats';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';

const ReqSchema = z.object({
    projectId: z.string(),
    resumeIds: z.array(z.string()).optional(),
    useExternal: z.boolean().optional()
});

export async function POST(req: NextRequest) {
    try {
        if (!rateLimit('ats:' + (req.ip || 'anon'))) {
            return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
        }

        let parsed: any;
        const ct = req.headers.get('content-type') || '';
        if (ct.includes('application/json')) parsed = await req.json();
        else if (ct.includes('application/x-www-form-urlencoded')) {
            const form = await req.formData();
            parsed = Object.fromEntries(form.entries());
        } else parsed = await req.json().catch(() => ({}));

        const data = ReqSchema.parse({
            projectId: parsed.projectId,
            resumeIds: typeof parsed.resumeIds === 'string' ? parsed.resumeIds.split(',') : parsed.resumeIds,
            useExternal: parsed.useExternal === 'true' ? true : parsed.useExternal,
        });

        console.log('[ATS Score] Starting ATS scoring for project:', data.projectId);

        const project = await prisma.project.findUnique({ where: { id: data.projectId } });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const resumes = await prisma.resume.findMany({
            where: { projectId: data.projectId, id: { in: data.resumeIds || undefined } }
        });

        console.log('[ATS Score] Scoring', resumes.length, 'resumes');

        const useExternal = data.useExternal ?? (process.env.USE_EXTERNAL_ATS === 'true');
        const useLlm = parsed.useLLM === true || parsed.llm === 'true' || parsed.useLlm === 'true' ||
            (process.env.OLLAMA_HOST ? true : false);

        const scannerType = useLlm ? 'LLM' : useExternal ? 'External' : 'Baseline';
        console.log('[ATS Score] Using', scannerType, 'scanner');

        const scanner = useLlm ? new LlmATS() :
            useExternal ? new ExternalATSAdapter('http://external.example.com') :
                new BaselineATS();

        const results = await Promise.all(
            resumes.map(async (r) => {
                console.log('[ATS Score] Scoring resume:', r.filename);
                return scanner.scoreResume({
                    resumeId: r.id,
                    resumeText: r.text,
                    jobDescription: project.jobDescription,
                    requiredSkills: project.requiredSkills,
                    bonusSkills: project.bonusSkills,
                });
            })
        );

        console.log('[ATS Score] Scores:', results.map(r => `${r.resumeId}: ${r.score}`));

        await Promise.all(
            results.map((res) =>
                prisma.resume.update({
                    where: { id: res.resumeId },
                    data: { atsScore: res.score, atsDetail: res }
                })
            )
        );

        console.log('[ATS Score] Completed successfully');
        return NextResponse.json({ results });
    } catch (e: any) {
        console.error('[ATS Score] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
