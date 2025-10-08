'use client';

import { useState } from 'react';

export default function ProjectForm() {
    const [title, setTitle] = useState('Backend Engineer – London');
    const [jd, setJd] = useState('We seek a backend engineer with Node.js, TypeScript, PostgreSQL.');
    const [requiredSkills, setRequired] = useState('Node.js, TypeScript, PostgreSQL');
    const [bonusSkills, setBonus] = useState('Redis, Docker');
    const [threshold, setThreshold] = useState(70);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                jobDescription: jd,
                requiredSkills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
                bonusSkills: bonusSkills.split(',').map((s) => s.trim()).filter(Boolean),
                atsThreshold: threshold,
            }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setMsg(data.error || 'Failed');
        setMsg('Created project: ' + data.id);
        window.location.href = `/projects/${data.id}`;
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
            <div>
                <label className="block text-sm font-medium">Title</label>
                <input className="mt-1 w-full border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
                <label className="block text-sm font-medium">Job Description</label>
                <textarea className="mt-1 w-full border rounded p-2 h-40" value={jd} onChange={(e) => setJd(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Required Skills (comma-separated)</label>
                    <input className="mt-1 w-full border rounded p-2" value={requiredSkills} onChange={(e) => setRequired(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Bonus Skills (comma-separated)</label>
                    <input className="mt-1 w-full border rounded p-2" value={bonusSkills} onChange={(e) => setBonus(e.target.value)} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">ATS Threshold: {threshold}</label>
                <input type="range" min={0} max={100} value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full" />
            </div>
            <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Creating…' : 'Create Project'}</button>
            {msg && <p className="text-sm text-gray-600">{msg}</p>}
        </form>
    );
}
