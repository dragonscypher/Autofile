import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateProjectSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    jobDescription: z.string().min(1, 'Job description is required'),
    requiredSkills: z.array(z.string()).optional().default([]),
    bonusSkills: z.array(z.string()).optional().default([]),
    atsThreshold: z.number().int().min(0).max(100).optional().default(70),
    llmConfig: z
        .object({ provider: z.string().optional(), model: z.string().optional() })
        .partial()
        .optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[Project Create] New project request:', body.title);

        const data = CreateProjectSchema.parse(body);

        // Get or create demo user
        const owner = await prisma.user.upsert({
            where: { id: 'demo-user' },
            update: {},
            create: {
                id: 'demo-user',
                email: 'demo@example.com',
                name: 'Demo User',
                role: 'OWNER' as any
            },
        });

        // Create the project
        const project = await prisma.project.create({
            data: {
                title: data.title,
                jobDescription: data.jobDescription,
                requiredSkills: data.requiredSkills,
                bonusSkills: data.bonusSkills,
                atsThreshold: data.atsThreshold,
                owner: { connect: { id: owner.id } },
            },
        });

        console.log('[Project Create] Project created successfully:', project.id);
        return NextResponse.json(project);
    } catch (e: any) {
        console.error('[Project Create] Error:', e);
        return NextResponse.json(
            { error: e.message || 'Failed to create project' },
            { status: 400 }
        );
    }
}
