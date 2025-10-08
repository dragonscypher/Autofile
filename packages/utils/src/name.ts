export function extractCandidateInfo(text: string): { name?: string; email?: string; phone?: string } {
    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phoneMatch = text.match(/\+?\d[\d\s().-]{7,}\d/);
    // Heuristic: take the first non-empty line, up to 5 words, likely the name
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let name: string | undefined;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const l = lines[i];
        if (/^(email|e-mail|phone|mobile|contact|curriculum|resume|cv)\b/i.test(l)) continue;
        const words = l.split(/\s+/);
        if (words.length <= 6 && /^[A-Za-z ,.'-]+$/.test(l) && /[A-Z][a-z]+/.test(l)) {
            name = l.replace(/[,;]+$/, '');
            break;
        }
    }
    // Fallback to email local part
    if (!name && emailMatch) name = emailMatch[0].split('@')[0].replace(/[._-]+/g, ' ');
    return { name, email: emailMatch?.[0], phone: phoneMatch?.[0] };
}

