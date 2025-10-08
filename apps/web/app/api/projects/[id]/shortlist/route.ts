import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const runtime = 'nodejs';

const Body = z.object({ threshold: z.number().min(0).max(100) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const data = Body.parse(body);
        const project = await prisma.project.findUnique({ where: { id: params.id } });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        await prisma.project.update({ where: { id: params.id }, data: { atsThreshold: data.threshold } });
        const resumes = await prisma.resume.findMany({ where: { projectId: params.id } });
        await Promise.all(
            resumes.map((r) =>
                prisma.resume.update({ where: { id: r.id }, data: { shortlisted: (r.atsScore ?? 0) >= data.threshold } })
            )
        );
        const selected = await prisma.resume.findMany({ where: { projectId: params.id, shortlisted: true } });
        return NextResponse.json({ selected: selected.map((r) => ({ id: r.id, filename: r.filename })) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

