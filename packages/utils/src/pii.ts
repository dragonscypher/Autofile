export function redactPII(text: string): { redacted: string; removed: { emails: string[]; phones: string[] } } {
    const emails = Array.from(text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).map((m) => m[0]);
    const phones = Array.from(text.matchAll(/\+?\d[\d\s().-]{7,}\d/g)).map((m) => m[0]);
    let redacted = text;
    for (const e of emails) redacted = redacted.split(e).join('[REDACTED_EMAIL]');
    for (const p of phones) redacted = redacted.split(p).join('[REDACTED_PHONE]');
    return { redacted, removed: { emails, phones } };
}
