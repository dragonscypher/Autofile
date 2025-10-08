import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const project = await prisma.project.findUnique({ where: { id: projectId }, include: { resumes: true } });
    if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const rows = [['filename', 'atsScore', 'shortlisted']].concat(
        project.resumes.map((r) => [r.filename, String(r.atsScore ?? ''), r.shortlisted ? 'true' : 'false'])
    );
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replaceAll('"', '""') + '"').join(',')).join('\n');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=project_${project.id}.csv` } });
}
