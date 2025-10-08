import ProjectForm from '@/components/ProjectForm';

export default function ProjectsPage() {
    return (
        <main className="p-8 space-y-6">
            <h1 className="text-2xl font-semibold">Create Project</h1>
            <ProjectForm />
        </main>
    );
}
