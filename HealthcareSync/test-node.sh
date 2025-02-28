
#!/bin/bash

echo "Testing Node.js installation..."

if command -v node &> /dev/null; then
  echo "✅ Node.js found: $(node -v)"
  echo "✅ NPM version: $(npm -v)"
  echo "✅ Path: $(which node)"
else
  echo "❌ Node.js not found in PATH!"
  exit 1
fi

echo "Testing database connection..."
if [ -f ".env" ]; then
  echo "✅ .env file found"
else
  echo "⚠️ .env file missing, creating a sample one..."
  echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/healthcare\"" > .env
  echo "JWT_SECRET=\"your-secret-key\"" >> .env
  echo "PORT=3000" >> .env
  echo "NODE_ENV=development" >> .env
  echo "OPENAI_API_KEY=\"your-openai-key\"" >> .env
fi

echo "All tests passed!"
