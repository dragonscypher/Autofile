import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const owner = await prisma.user.upsert({ where: { id: 'demo-user' }, update: {}, create: { id: 'demo-user', email: 'demo@example.com', name: 'Demo', role: 'OWNER' as any } });
    const project = await prisma.project.create({
        data: {
            ownerId: owner.id,
            title: 'Backend Engineer – London',
            jobDescription: 'We seek a backend engineer with Node.js, TypeScript, PostgreSQL, and cloud experience. Nice to have: Redis, Docker, Kubernetes.',
            requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL'],
            bonusSkills: ['Redis', 'Docker', 'Kubernetes'],
            atsThreshold: 70,
        },
    });
    const resumes = Array.from({ length: 5 }).map((_, i) => ({
        filename: `resume_${i + 1}.txt`,
        mimeType: 'text/plain',
        text: `Candidate ${i + 1} has experience in Node.js and TypeScript. PostgreSQL knowledge. Some Redis and Docker.`,
        parsedMeta: {},
        projectId: project.id,
    }));
    await prisma.resume.createMany({ data: resumes });
    console.log('Seeded project', project.id);
}

main().finally(async () => prisma.$disconnect());
