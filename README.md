# Autofile

Screening resumes by hand is slow and inconsistent, so I built Autofile: a recruiting assistant that scores resumes against a job description, shortlists the strong ones, and drafts interview questions for them. It is a working prototype that I use to test ideas about applied LLMs and ATS-style scoring.

## What it does

- Scores each resume against a job description, using a local LLM when Ollama is available and a TF-IDF baseline when it is not.
- Shortlists candidates by a threshold you set (for example 75%).
- Generates role-specific interview questions with keywords and model answers, with no repeated keywords across questions.
- Accepts PDF, DOC, DOCX and TXT uploads, or pasted text.

## How I built it

A TypeScript monorepo (pnpm and Turborepo):

```
apps/web        Next.js 14 app (App Router, Tailwind)
apps/workers    background jobs
packages/ats    resume scoring
packages/llm    Ollama integration
packages/utils  text extraction and parsing
prisma/         PostgreSQL schema
infra/          Docker compose for Postgres and Redis
test-data/      one job description and five sample resumes
```

Prisma and PostgreSQL hold projects and candidates, Redis handles caching, and Ollama (llama3) is optional. If the LLM is down, scoring falls back to the baseline, so the app keeps working.

## Run it

You need Node 18+, pnpm, Docker Desktop and optionally Ollama.

```bash
pnpm install
cd infra && docker compose up -d db redis && cd ..
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm -r build
cd apps/web && pnpm dev
```

Open http://localhost:3000. Create `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/autofile"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate with: openssl rand -base64 32"
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3"
```

`.env` files are gitignored. Try it with the files in `test-data/`. More setup detail is in [GETTING-STARTED.md](GETTING-STARTED.md).

## Next steps

Candidate email, role-based access, job-board imports, and a better analytics view.

## License

MIT, see [LICENSE](LICENSE).
