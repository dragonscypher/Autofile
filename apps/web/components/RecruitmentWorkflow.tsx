'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Award, CheckCircle, ClipboardList, FileText, Upload, Users } from './icons';

// Define the workflow steps
type Step = 'jd' | 'resumes' | 'ats' | 'interview' | 'score' | 'final';

// Resume data structure with optional fields populated as workflow progresses
type Resume = { id: string; filename: string; text?: string; atsScore?: number; shortlisted?: boolean; interviewScore?: number };

// Interview question structure with keywords for candidate evaluation
type Question = { id: string; text: string; keywords: string[]; modelAnswer: string };

// Candidate information extracted from resumes
type Candidate = { resumeId: string; name: string; email: string; phone: string };

interface Props {
    projectId: string;
    initialJD?: string;
    initialResumes?: Resume[];
}

export default function RecruitmentWorkflow({ projectId, initialJD, initialResumes = [] }: Props) {
    // Workflow state
    const [step, setStep] = useState<Step>('jd');

    // Job description state
    const [jdText, setJdText] = useState(initialJD || '');
    const [jdFile, setJdFile] = useState<File | null>(null);

    // Resume state
    const [resumes, setResumes] = useState<Resume[]>(initialResumes);
    const [resumeFiles, setResumeFiles] = useState<File[]>([]);

    // ATS scoring state
    const [atsThreshold, setAtsThreshold] = useState(75);

    // Interview state
    const [questionCount, setQuestionCount] = useState(5);
    const [questions, setQuestions] = useState<Question[]>([]);

    // Scoring state
    const [selectedKeywords, setSelectedKeywords] = useState<Record<string, string[]>>({});
    const [candidateScores, setCandidateScores] = useState<Record<string, { keywordScore: number; manualScore: number }>>({});
    const [finalCutoff, setFinalCutoff] = useState(7);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [parseError, setParseError] = useState(false);
    const [manualResumeEntry, setManualResumeEntry] = useState<Record<string, string>>({});

    const shortlistedResumes = resumes.filter(r => r.shortlisted);

    const steps: { key: Step; label: string; icon: any }[] = [
        { key: 'jd', label: 'Job Description', icon: FileText },
        { key: 'resumes', label: 'Upload Resumes', icon: Upload },
        { key: 'ats', label: 'ATS Screening', icon: Users },
        { key: 'interview', label: 'Interview Setup', icon: ClipboardList },
        { key: 'score', label: 'Score Candidates', icon: Award },
        { key: 'final', label: 'Final Selection', icon: CheckCircle },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    async function handleJDSubmit() {
        setLoading(true);
        setError('');
        try {
            if (jdFile) {
                // Upload JD file
                const formData = new FormData();
                formData.append('jd', jdFile);
                formData.append('projectId', projectId);
                const res = await fetch('/api/projects/jd/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Upload failed');
                if (data.parseError) {
                    setParseError(true);
                    setError('Could not parse JD. Please enter text manually below.');
                    return;
                }
                setJdText(data.text);
            } else if (!jdText.trim()) {
                setError('Please upload a JD file or enter text manually');
                return;
            }
            // Update project with JD
            await fetch(`/api/projects/${projectId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobDescription: jdText }),
            });
            setStep('resumes');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleResumeUpload() {
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            resumeFiles.forEach(file => formData.append('files', file));
            const res = await fetch(`/api/resumes/upload?projectId=${projectId}`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            // Check for parse errors
            const failedResumes = data.resumes?.filter((r: any) => r.parseError) || [];
            if (failedResumes.length > 0) {
                setParseError(true);
                setError(`Could not parse ${failedResumes.length} resume(s). Please enter text manually.`);
                // Set up manual entry fields
                const manualEntries: Record<string, string> = {};
                failedResumes.forEach((r: any) => {
                    manualEntries[r.id] = '';
                });
                setManualResumeEntry(manualEntries);
            }

            setResumes(data.resumes || []);
            setStep('ats');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleManualResumeSubmit() {
        setLoading(true);
        setError('');
        try {
            // Submit manual resume text
            const entries = Object.entries(manualResumeEntry).filter(([_, text]) => text.trim());
            for (const [resumeId, text] of entries) {
                await fetch(`/api/resumes/${resumeId}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                });
            }
            // Refresh resumes
            const res = await fetch(`/api/projects/${projectId}`);
            const data = await res.json();
            setResumes(data.resumes || []);
            setParseError(false);
            setStep('ats');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleATSScore() {
        setLoading(true);
        setError('');
        try {
            // Run ATS scoring
            await fetch('/api/ats/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, useLLM: true }),
            });

            // Apply threshold and shortlist
            await fetch(`/api/projects/${projectId}/shortlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threshold: atsThreshold }),
            });

            // Refresh resumes
            const res = await fetch(`/api/projects/${projectId}`);
            const data = await res.json();
            setResumes(data.resumes || []);
            setStep('interview');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateQuestions() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/interview/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, count: questionCount }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');

            // Parse questions from response
            const generatedQuestions: Question[] = data.questions || [];
            setQuestions(generatedQuestions);

            // Initialize keyword selections
            const keywords: Record<string, string[]> = {};
            shortlistedResumes.forEach(r => {
                keywords[r.id] = [];
            });
            setSelectedKeywords(keywords);

            setStep('score');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function toggleKeyword(resumeId: string, keyword: string) {
        setSelectedKeywords(prev => {
            const current = prev[resumeId] || [];
            const updated = current.includes(keyword)
                ? current.filter(k => k !== keyword)
                : [...current, keyword];
            return { ...prev, [resumeId]: updated };
        });
    }

    function updateManualScore(resumeId: string, score: number) {
        setCandidateScores(prev => ({
            ...prev,
            [resumeId]: { ...prev[resumeId], manualScore: score },
        }));
    }

    async function handleFinalizeScores() {
        setLoading(true);
        setError('');
        try {
            // Calculate keyword scores (out of 10)
            const allKeywords = questions.flatMap(q => q.keywords);
            const scores: Record<string, { keywordScore: number; manualScore: number }> = {};

            shortlistedResumes.forEach(r => {
                const selected = selectedKeywords[r.id] || [];
                const keywordScore = allKeywords.length > 0
                    ? Math.round((selected.length / allKeywords.length) * 10)
                    : 0;
                scores[r.id] = {
                    keywordScore,
                    manualScore: candidateScores[r.id]?.manualScore || 0,
                };
            });

            setCandidateScores(scores);

            // Submit scores to backend
            for (const r of shortlistedResumes) {
                const totalScore = scores[r.id].keywordScore + scores[r.id].manualScore;
                await fetch('/api/interview/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resumeId: r.id,
                        answers: [], // Not collecting full text answers in this flow
                        totalScore,
                    }),
                });
            }

            // Refresh resumes with scores
            const res = await fetch(`/api/projects/${projectId}`);
            const data = await res.json();
            setResumes(data.resumes || []);

            setStep('final');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const selectedCandidates = shortlistedResumes.filter(r => {
        const score = candidateScores[r.id];
        if (!score) return false;
        const total = score.keywordScore + score.manualScore;
        return total >= finalCutoff;
    });

    async function handleExportCSV() {
        window.open(`/api/export/csv?projectId=${projectId}`, '_blank');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">AI-Powered Recruitment Workflow</h1>
                </div>
            </div>

            {/* Stepper */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-12">
                    {steps.map((s, i) => {
                        const Icon = s.icon;
                        const isActive = s.key === step;
                        const isComplete = i < currentStepIndex;
                        return (
                            <div key={s.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg scale-110'
                                            : isComplete
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        <Icon size={24} />
                                    </div>
                                    <span
                                        className={`mt-2 text-sm font-medium ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-500'
                                            }`}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div
                                        className={`h-0.5 flex-1 mx-2 ${isComplete ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {step === 'jd' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Upload Job Description</h2>
                            <p className="text-gray-600">Upload a PDF, DOC, DOCX, or TXT file, or paste the text manually.</p>

                            <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors rounded-xl p-8 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <label className="cursor-pointer">
                                    <span className="text-blue-600 hover:text-blue-700 font-medium">Choose a file</span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                console.log('JD file selected:', file.name, file.type, file.size);
                                                setJdFile(file);
                                            }
                                        }}
                                    />
                                </label>
                                {jdFile && (
                                    <div className="mt-3">
                                        <p className="text-sm font-medium text-gray-900">{jdFile.name}</p>
                                        <p className="text-xs text-gray-500">{(jdFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                )}
                            </div>

                            {(parseError || !jdFile) && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Or paste manually:</label>
                                    <textarea
                                        className="w-full h-40 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Paste job description here..."
                                        value={jdText}
                                        onChange={(e) => setJdText(e.target.value)}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleJDSubmit}
                                disabled={loading || (!jdFile && !jdText.trim())}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : 'Continue'}
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {step === 'resumes' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Upload Resumes</h2>
                            <p className="text-gray-600">Upload multiple PDF, DOC, DOCX, or TXT files.</p>

                            <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors rounded-xl p-8 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <label className="cursor-pointer">
                                    <span className="text-blue-600 hover:text-blue-700 font-medium">Choose files</span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            console.log('Resume files selected:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
                                            setResumeFiles(files);
                                        }}
                                    />
                                </label>
                                {resumeFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium text-gray-700">{resumeFiles.length} file(s) selected:</p>
                                        {resumeFiles.map((f, i) => (
                                            <div key={i} className="text-sm text-gray-600 flex justify-between items-center">
                                                <span>{f.name}</span>
                                                <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(2)} KB</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {parseError && Object.keys(manualResumeEntry).length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900">Enter text manually for failed resumes:</h3>
                                    {Object.keys(manualResumeEntry).map(resumeId => {
                                        const resume = resumes.find(r => r.id === resumeId);
                                        return (
                                            <div key={resumeId} className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    {resume?.filename || `Resume ${resumeId}`}
                                                </label>
                                                <textarea
                                                    className="w-full h-32 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Paste resume text here..."
                                                    value={manualResumeEntry[resumeId]}
                                                    onChange={(e) => setManualResumeEntry(prev => ({ ...prev, [resumeId]: e.target.value }))}
                                                />
                                            </div>
                                        );
                                    })}
                                    <button
                                        onClick={handleManualResumeSubmit}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Manual Entries'}
                                    </button>
                                </div>
                            )}

                            {!parseError && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('jd')}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={20} />
                                        Back
                                    </button>
                                    <button
                                        onClick={handleResumeUpload}
                                        disabled={loading || resumeFiles.length === 0}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Uploading...' : 'Continue'}
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'ats' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">ATS Screening</h2>
                            <p className="text-gray-600">Set a threshold to filter candidates based on AI-powered ATS scoring.</p>

                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        ATS Threshold:
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={atsThreshold}
                                        onChange={(e) => setAtsThreshold(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-lg font-bold text-blue-600 w-16 text-right">{atsThreshold}%</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Candidates with ATS scores above {atsThreshold}% will be shortlisted for interviews.
                                </p>
                            </div>

                            {resumes.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-medium text-gray-900">Uploaded Resumes ({resumes.length})</h3>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Filename</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {resumes.map(r => (
                                                    <tr key={r.id}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{r.filename}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">Ready</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('resumes')}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={handleATSScore}
                                    disabled={loading || resumes.length === 0}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Scoring...' : 'Run ATS & Continue'}
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'interview' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Interview Setup</h2>
                            <p className="text-gray-600">Configure interview questions for shortlisted candidates.</p>

                            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                <h3 className="font-medium text-green-900 mb-2">
                                    ✓ {shortlistedResumes.length} candidates shortlisted
                                </h3>
                                <div className="space-y-1">
                                    {shortlistedResumes.map(r => (
                                        <div key={r.id} className="text-sm text-green-700">
                                            {r.filename} - ATS Score: {r.atsScore}%
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Number of interview questions:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('ats')}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={handleGenerateQuestions}
                                    disabled={loading || shortlistedResumes.length === 0}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Generating...' : 'Generate Questions'}
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'score' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Score Candidates</h2>
                            <p className="text-gray-600">Review questions, select keyword checkboxes, and manually grade candidates.</p>

                            <div className="space-y-6">
                                {/* Questions Display */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                                    <h3 className="font-medium text-blue-900">Interview Questions</h3>
                                    {questions.map((q, i) => (
                                        <div key={q.id} className="bg-white rounded-lg p-4 space-y-2">
                                            <p className="font-medium text-gray-900">
                                                {i + 1}. {q.text}
                                            </p>
                                            <div className="text-sm text-gray-600">
                                                <strong>Model Answer:</strong> {q.modelAnswer}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {q.keywords.map(kw => (
                                                    <span
                                                        key={kw}
                                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                                    >
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Candidate Scoring */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900">Candidate Assessment</h3>
                                    {shortlistedResumes.map(r => {
                                        const allKeywords = questions.flatMap(q => q.keywords);
                                        const selected = selectedKeywords[r.id] || [];
                                        const keywordScore = allKeywords.length > 0
                                            ? Math.round((selected.length / allKeywords.length) * 10)
                                            : 0;
                                        const manualScore = candidateScores[r.id]?.manualScore || 0;

                                        return (
                                            <div key={r.id} className="border border-gray-300 rounded-xl p-6 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-gray-900">{r.filename}</h4>
                                                    <span className="text-sm text-gray-600">ATS: {r.atsScore}%</span>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                                        Select keywords found in interview answers:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {allKeywords.map((kw, idx) => {
                                                            const isSelected = selected.includes(kw);
                                                            return (
                                                                <label
                                                                    key={`${kw}-${idx}`}
                                                                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${isSelected
                                                                        ? 'bg-green-500 text-white'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="hidden"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleKeyword(r.id, kw)}
                                                                    />
                                                                    {kw}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        Keyword Score: {keywordScore}/10
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Manual Score (0-10):
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        value={manualScore}
                                                        onChange={(e) => updateManualScore(r.id, Number(e.target.value))}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div className="pt-2 border-t border-gray-200">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Total Score: {keywordScore + manualScore}/20
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('interview')}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={handleFinalizeScores}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Saving...' : 'Finalize Scores'}
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'final' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Final Selection</h2>
                            <p className="text-gray-600">Set a final cutoff score to select candidates.</p>

                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        Final Cutoff:
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        value={finalCutoff}
                                        onChange={(e) => setFinalCutoff(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-lg font-bold text-green-600 w-16 text-right">{finalCutoff}/20</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">
                                    Selected Candidates ({selectedCandidates.length})
                                </h3>

                                {selectedCandidates.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No candidates meet the current cutoff score.
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {selectedCandidates.map(r => {
                                            const score = candidateScores[r.id];
                                            const total = score ? score.keywordScore + score.manualScore : 0;
                                            return (
                                                <div
                                                    key={r.id}
                                                    className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 space-y-2"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-gray-900">{r.filename}</h4>
                                                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                                                            Score: {total}/20
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">ATS Score:</span>
                                                            <span className="ml-2 font-medium text-gray-900">{r.atsScore}%</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Keyword Score:</span>
                                                            <span className="ml-2 font-medium text-gray-900">{score?.keywordScore || 0}/10</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Manual Score:</span>
                                                            <span className="ml-2 font-medium text-gray-900">{score?.manualScore || 0}/10</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('score')}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    disabled={selectedCandidates.length === 0}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    Export to CSV
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
