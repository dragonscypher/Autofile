import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';

const Body = z.object({
    title: z.string().optional(),
    jobDescription: z.string().optional(),
    requiredSkills: z.array(z.string()).optional(),
    bonusSkills: z.array(z.string()).optional(),
    atsThreshold: z.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const data = Body.parse(body);
        const project = await prisma.project.update({ where: { id: params.id }, data });
        return NextResponse.json(project);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

