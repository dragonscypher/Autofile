import { prisma } from '@/lib/db';
import { extractText } from '@autofile/utils';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('jd') as File;
        const projectId = formData.get('projectId') as string;

        console.log('[JD Upload] Starting upload:', {
            filename: file?.name,
            fileType: file?.type,
            fileSize: file?.size,
            projectId
        });

        if (!file || !projectId) {
            console.error('[JD Upload] Missing required fields');
            return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
            console.error('[JD Upload] Invalid file type:', file.type);
            return NextResponse.json({
                error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.'
            }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';
        let parseError = false;

        console.log('[JD Upload] Extracting text from file...');

        try {
            const result = await extractText(buffer, file.type || 'application/pdf');
            text = result.text;
            console.log('[JD Upload] Text extracted successfully, length:', text.length);
        } catch (err) {
            console.error('[JD Upload] Failed to extract text:', err);
            parseError = true;
        }

        // Update project with JD text if successfully parsed
        if (text && !parseError) {
            await prisma.project.update({
                where: { id: projectId },
                data: { jobDescription: text },
            });
            console.log('[JD Upload] Project updated with JD text');
        }

        return NextResponse.json({ text, parseError });
    } catch (error) {
        console.error('[JD Upload] Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
