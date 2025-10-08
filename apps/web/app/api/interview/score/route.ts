import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Req = z.object({ interviewId: z.string(), answers: z.array(z.object({ questionId: z.string(), notes: z.string().optional().default(''), matchedKeywords: z.array(z.string()).default([]), score: z.number().min(0).max(5) })) });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = Req.parse(body);
        const interview = await prisma.interview.update({ where: { id: data.interviewId }, data: { responses: data.answers as any, totalScore: data.answers.reduce((s, a) => s + a.score, 0) } });
        return NextResponse.json({ ok: true, totalScore: interview.totalScore });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
