import { prisma } from '@/lib/db';
import { extractText, normalizeWhitespace } from '@autofile/utils';
import { extractCandidateInfo } from '@autofile/utils/src/name';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');

        console.log('[Resume Upload] Starting batch upload for project:', projectId);

        if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

        const form = await req.formData();
        const files = form.getAll('files');

        console.log('[Resume Upload] Processing', files.length, 'files');

        const resumes: any[] = [];

        for (const f of files) {
            if (!(f instanceof File)) continue;

            console.log('[Resume Upload] Processing:', f.name, 'Type:', f.type, 'Size:', f.size);

            const arrayBuffer = await f.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            let text = '';
            let meta: any = {};
            let parseError = false;

            try {
                const parsed = await extractText(buffer, f.type || 'application/octet-stream');
                text = normalizeWhitespace(parsed.text);
                meta = parsed.meta;

                if (!text || text.trim().length === 0) {
                    console.warn('[Resume Upload] Empty text extracted from:', f.name);
                    parseError = true;
                } else {
                    console.log('[Resume Upload] Successfully extracted', text.length, 'characters from:', f.name);
                }
            } catch (e) {
                console.error('[Resume Upload] Extraction failed for', f.name, ':', e);
                text = '';
                meta = { error: (e as Error).message };
                parseError = true;
            }

            const resume = await prisma.resume.create({
                data: { projectId, filename: f.name, mimeType: f.type, text, parsedMeta: meta },
            });

            if (!parseError && text) {
                const info = extractCandidateInfo(text);
                console.log('[Resume Upload] Extracted candidate info:', info);
                await prisma.candidate.create({
                    data: {
                        resumeId: resume.id,
                        name: info.name,
                        email: info.email,
                        phone: info.phone,
                    },
                });
            }

            resumes.push({
                id: resume.id,
                filename: f.name,
                parseError,
                atsScore: null,
                shortlisted: false,
            });
        }

        return NextResponse.json({ resumes });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
