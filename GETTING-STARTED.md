# Quick Start Guide

## Setup (5 minutes)

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start database:
   ```bash
   cd infra && docker compose up -d
   ```

3. Initialize database:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

4. Build packages:
   ```bash
   pnpm -r build
   ```

5. Start the app:
   ```bash
   cd apps/web && pnpm dev
   ```

Visit http://localhost:3000

## Common Issues

**Database connection error?**
- Check if Docker is running
- Make sure PostgreSQL is on port 5432
- DATABASE_URL should start with `postgresql://`

**File upload not working?**
- Supported formats: PDF, DOC, DOCX, TXT
- Check file size (max 10MB per file)
- Look for console logs showing `[JD Upload]` or `[Resume Upload]`

**ATS scoring taking too long?**
- First run downloads models (be patient)
- Check if Ollama is running (optional but faster)
- Logs will show `[ATS Score]` progress

## Environment Setup

Copy `.env.local.example` to `.env.local` and update:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/autofile
REDIS_URL=redis://localhost:6379
OLLAMA_HOST=http://localhost:11434  # optional
OLLAMA_MODEL=llama3                  # optional
```

## Tips

- Use console logs to debug - they're everywhere now
- Resume uploads work in batch - select multiple files
- ATS threshold of 70-75% is a good starting point
- Interview questions use the job description you provide

Need help? Check the logs in your terminal - they'll tell you what's happening.
