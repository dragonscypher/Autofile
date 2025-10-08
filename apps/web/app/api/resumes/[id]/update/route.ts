import { prisma } from '@/lib/db';
import { extractCandidateInfo } from '@autofile/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { text } = await req.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
        }

        // Update resume text
        await prisma.resume.update({
            where: { id: params.id },
            data: { text },
        });

        // Extract candidate info
        const info = extractCandidateInfo(text);
        await prisma.candidate.upsert({
            where: { resumeId: params.id },
            update: {
                name: info.name || null,
                email: info.email || null,
                phone: info.phone || null,
            },
            create: {
                resumeId: params.id,
                name: info.name || null,
                email: info.email || null,
                phone: info.phone || null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update resume error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
