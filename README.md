# 🤖 Autofile - AI Recruitment Assist 🎯 Getting Started

### Prerequisites
- 📦 Node.js 1## 📁 Project Structure

```
Autofile/
├── apps/
│   ├── web/          # 🌐 Main Next.js application
│   └── workers/      # ⚙️ Background job processing
│
├── packages/
│   ├── ats/          # 📊 Resume scoring logic
│   ├── llm/          # 🤖 AI provider integrations (Ollama)
│   └── utils/        # 🛠️ Helper functions (text extraction, parsing)
│
├── prisma/           # 🗄️ Database schema
├── infra/            # 🐳 Docker setup (PostgreSQL, Redis)
└── test-data/        # 📄 Sample data for testing
```

## 🧪 Testing it outcommended)
- 📦 pnpm package manager (`npm install -g pnpm`)
- 🐳 Docker Desktop (for PostgreSQL and Redis)
- 🤖 Ollama with llama3 (optional, for enhanced AI features)

### Quick Setup![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> A smart recruitment system that helps you screen resumes, shortlist candidates, and generate interview questions using AI.

## ✨ What does it do?

Autofile streamlines your hiring process by:
- 📊 **Automatically scoring resumes** against job descriptions
- 🎯 **Shortlisting candidates** based on customizable thresholds
- 💬 **Generating relevant interview questions** with unique keywords and model answers
- 📝 **Helping you evaluate candidates** systematically
- 📄 **Supporting multiple file formats** (PDF, DOC, DOCX, TXT)

Think of it as your AI-powered hiring assistant that handles the tedious parts of recruitment.

## 🚀 Features

- ✅ **Smart ATS Scoring** - AI-powered resume analysis with LLM or baseline algorithms
- ✅ **File Upload Support** - PDF, DOC, DOCX, and TXT file handling
- ✅ **Interview Generation** - Context-aware questions with realistic model answers
- ✅ **Keyword Extraction** - Unique, relevant keywords per question (no duplicates!)
- ✅ **Real-time Logging** - Comprehensive debugging and monitoring
- ✅ **Monorepo Architecture** - Clean separation of concerns with Turborepo
- ✅ **Type-Safe** - Full TypeScript implementation
- ✅ **Production Ready** - Docker setup included

## 🎯 Getting Started

### What you'll need
- Node.js 18 or higher (I'm using 20)
- pnpm package manager
- Docker Desktop (for the database)
- Optionally: Ollama with llama3 for enhanced AI features

### Quick setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start the database**
   ```bash
   cd infra
   docker compose up -d db redis
   ```

3. **Set up the database schema**
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev --name init
   ```

4. **Build the packages**
   ```bash
   pnpm -r build
   ```

5. **Start the dev server**
   ```bash
   cd apps/web
   pnpm dev
   ```

Open http://localhost:3000 and you're ready to go! 🎉

## 📖 How it works

The workflow is intuitive and straightforward:

1. 📋 **Create a project** with your job description and requirements
2. 📤 **Upload resumes** (PDF, DOC, DOCX, or TXT) or paste text
3. 🎚️ **Set a threshold** (e.g., 75%) for automatic filtering
4. 👥 **Review shortlisted candidates** who meet your criteria
5. 💡 **Generate interview questions** tailored to the role with AI
6. ⭐ **Score candidates** using keyword matching and manual evaluation
7. ✅ **Select finalists** based on your cutoff score

## 📁 Project Structure

```
Autofile/
├── apps/
│   ├── web/          # The main Next.js application
│   └── workers/      # Background job processing
│
├── packages/
│   ├── ats/          # Resume scoring logic
│   ├── llm/          # AI provider integrations
│   └── utils/        # Helper functions
│
├── prisma/           # Database schema
├── infra/            # Docker setup
└── test-data/        # Sample data for testing
```

## 🧪 Testing it out

I've included some mock data in the `test-data/` folder so you can try it without real resumes:
- 📝 One job description for a Senior Software Engineer role
- 👔 Five sample resumes with varying qualification levels

Just copy-paste the text into the application to see how it works!

## 🛠️ Tech Stack

Built with modern, reliable tools:
- **Next.js 14** - React framework with App Router
- **Prisma** + **PostgreSQL** - Type-safe ORM and database
- **Redis** - Caching and session management
- **Ollama** (optional) - Local AI inference with llama3
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Full type safety throughout
- **Turborepo** - Monorepo build system
- **Docker** - Containerized infrastructure

## ⚙️ Environment Setup

Create a `.env.local` file in `apps/web/` with:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/autofile"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth (generate a secret: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Ollama (optional - for AI features)
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3"
```

> **⚠️ Security Note:** Never commit `.env` files to version control! They are automatically ignored by `.gitignore`.

## 🐛 Troubleshooting

**Database connection fails?**  
Make sure Docker is running and the containers are up:
```bash
docker compose ps
```

**Ollama not found?**  
No problem! The system falls back to a baseline TF-IDF algorithm that works great for most cases.

**Port 3000 already in use?**  
You can change the port in the dev command:
```bash
next dev -p 3001
```

**Text extraction errors?**  
TXT files are now fully supported. Check `TXT-FILE-FIX.md` for implementation details.

## 🚀 Recent Improvements

- ✅ **Interview Generation** - Unique keywords per question, no duplicates
- ✅ **Realistic Model Answers** - Specific examples with metrics instead of templates
- ✅ **TXT File Support** - Direct text extraction without external dependencies
- ✅ **Enhanced Logging** - Comprehensive debugging throughout the application
- ✅ **Custom Icons** - No external icon dependencies, faster load times

See `INTERVIEW-IMPROVEMENTS.md` and `CHANGES.md` for detailed documentation.

## 🎯 Roadmap

## 🎯 Roadmap

This is a working prototype with all core features implemented. Future enhancements could include:

- 📧 Email notifications for candidates
- 👥 Team collaboration features
- 🔗 Integration with job boards (LinkedIn, Indeed)
- 📹 Video interview scheduling
- 📊 Advanced analytics dashboard
- 🌍 Multi-language support
- 🔐 Role-based access control
- 📱 Mobile-responsive improvements

## 🤝 Contributing

Found a bug or have an idea? Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read `CONTRIBUTING.md` for details on our code of conduct and development process.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Ollama](https://ollama.ai/) for local AI inference
- Database management by [Prisma](https://www.prisma.io/)
- Icons created as custom SVG components

## 📚 Documentation

- `GETTING-STARTED.md` - Detailed setup guide
---

**Built with curiosity and lots of coffee ☕**

*Automate your recruitment, focus on what matters - finding the right talent.*
