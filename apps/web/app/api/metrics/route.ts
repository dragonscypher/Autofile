import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
    const body = `# HELP autofile_dummy 1 if up\n# TYPE autofile_dummy gauge\nautofile_dummy 1`;
    return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; version=0.0.4' } });
}
