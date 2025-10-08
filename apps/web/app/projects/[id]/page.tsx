import RecruitmentWorkflow from '@/components/RecruitmentWorkflow';
import { prisma } from '@/lib/db';

export default async function ProjectDetail({ params }: { params: { id: string } }) {
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            resumes: {
                select: {
                    id: true,
                    filename: true,
                    atsScore: true,
                    shortlisted: true,
                },
            },
        },
    });

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
                    <p className="text-gray-600">The project you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <RecruitmentWorkflow
            projectId={project.id}
            initialJD={project.jobDescription || undefined}
            initialResumes={project.resumes.map(r => ({
                ...r,
                atsScore: r.atsScore ?? undefined,
            }))}
        />
    );
}
