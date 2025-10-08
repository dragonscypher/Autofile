export async function extractText(buffer: Buffer, mimeType: string): Promise<{ text: string; meta: Record<string, unknown> }> {
    // Handle plain text files directly
    if (mimeType.includes('text/plain') || mimeType.includes('text/')) {
        const text = buffer.toString('utf-8');
        console.log('[extractText] Plain text file, length:', text.length);
        return { text, meta: { mimeType } };
    }

    // Handle PDF files
    if (mimeType.includes('pdf')) {
        // @ts-ignore - dynamic import to avoid build-time evaluation
        const pdf = (await import('pdf-parse')).default;
        const data: any = await pdf(buffer);
        console.log('[extractText] PDF parsed, length:', data.text.length);
        return { text: data.text, meta: { info: data.info } };
    }

    // Handle DOC/DOCX and other formats via textract
    console.log('[extractText] Using textract for mime type:', mimeType);
    // @ts-ignore - dynamic import to avoid build-time evaluation
    const textract = await import('textract');
    const text: string = await new Promise((resolve, reject) => {
        (textract as any).fromBufferWithName('file', buffer, (err: Error | null, text?: string) => {
            if (err) return reject(err);
            resolve(text || '');
        });
    });
    return { text, meta: {} };
}

export function normalizeWhitespace(text: string) {
    return text.replace(/\s+/g, ' ').trim();
}
