# Set environment variables for development
$env:DATABASE_URL="postgresql://user:pass@localhost:5432/autofile"
$env:REDIS_URL="redis://localhost:6379"
$env:NEXT AUTH_SECRET="devsecret"
$env:NEXTAUTH_URL="http://localhost:3000"
$env:OLLAMA_HOST="http://localhost:11434"
$env:OLLAMA_MODEL="llama3"

# Start the development server
pnpm dev
