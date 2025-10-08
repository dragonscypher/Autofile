import { BaselineATS } from '@autofile/ats';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const worker = new Worker(
    'ats-score',
    async (job) => {
        const scanner = new BaselineATS();
        const { resumeId, resumeText, jobDescription, requiredSkills, bonusSkills } = job.data;
        return scanner.scoreResume({ resumeId, resumeText, jobDescription, requiredSkills, bonusSkills });
    },
    { connection: connection as any }
);

worker.on('completed', (job) => {
    console.log('Completed job', job.id);
});
