import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                resumes: {
                    select: {
                        id: true,
                        filename: true,
                        text: true,
                        atsScore: true,
                        shortlisted: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...project,
            resumes: project.resumes.map((r: any) => ({
                id: r.id,
                filename: r.filename,
                text: r.text,
                atsScore: r.atsScore ?? undefined,
                shortlisted: r.shortlisted,
            })),
        });
    } catch (error) {
        console.error('Get project error:', error);
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}
