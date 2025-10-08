export async function retrieve(_input: { jd: string; docs: string[]; topK?: number }): Promise<string[]> {
    // Placeholder: return first few docs; replace with FAISS/Chroma later
    return (_input.docs || []).slice(0, _input.topK ?? 3);
}
