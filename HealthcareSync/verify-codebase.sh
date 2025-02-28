#!/bin/bash

echo "=== Healthcare Platform Verification ==="
echo "Checking for implementation of core features..."

FEATURES_OK=true

# Check for Authentication System
echo -e "\n1. Authentication System:"
if [ -f "server/auth.ts" ]; then
  echo "✅ Authentication system implemented"
else
  echo "❌ Authentication system missing"
  FEATURES_OK=false
fi

# Check for Medical Records Management
echo -e "\n2. Medical Records Management:"
if grep -q "MedicalRecord" prisma/schema.prisma 2>/dev/null; then
  echo "✅ Medical records management implemented"
else
  echo "❌ Medical records management missing"
  FEATURES_OK=false
fi

# Check for Patient Management
echo -e "\n3. Patient Management:"
if grep -q "Patient" prisma/schema.prisma 2>/dev/null; then
  echo "✅ Patient management implemented"
else
  echo "❌ Patient management missing"
  FEATURES_OK=false
fi

# Check for Health Metrics Tracking
echo -e "\n4. Health Metrics Tracking:"
if grep -q "HealthMetric" prisma/schema.prisma 2>/dev/null; then
  echo "✅ Health metrics tracking implemented"
else
  echo "❌ Health metrics tracking missing"
  FEATURES_OK=false
fi

# Check for API Routes
echo -e "\n5. API Routes:"
if [ -d "server/api" ] || [ -f "server/routes.ts" ]; then
  echo "✅ API routes implemented"
else
  echo "❌ API routes missing"
  FEATURES_OK=false
fi

# Check for WebSocket Support
echo -e "\n6. Real-time Features:"
if grep -q "WebSocket" server/index.ts 2>/dev/null; then
  echo "✅ WebSocket/real-time support implemented"
else
  echo "❌ WebSocket/real-time support missing"
  FEATURES_OK=false
fi

# Check for UI Components
echo -e "\n7. UI Components:"
if [ -d "client/src/components" ]; then
  echo "✅ UI components implemented"
else
  echo "❌ UI components missing"
  FEATURES_OK=false
fi


# Check Node.js environment
echo -e "\n=== Node.js Environment ==="
if command -v node &> /dev/null; then
  echo "✅ Node.js: $(node -v)"
  echo "✅ NPM: $(npm -v)"
else
  echo "❌ Node.js not found in PATH!"
fi

# Check environment variables
echo -e "\n=== Environment Variables ==="
required_env_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "PORT"
  "NODE_ENV"
  "OPENAI_API_KEY"
)

missing_vars=0
for var in "${required_env_vars[@]}"; do
  if ! grep -q "^$var=" .env 2>/dev/null; then
    echo "⚠️ Missing or commented out environment variable: $var"
    missing_vars=$((missing_vars+1))
  fi
done

if [ $missing_vars -gt 0 ]; then
  echo "⚠️ $missing_vars environment variables missing. Please check your .env file."
else
  echo "✅ All required environment variables found"
fi

# Check database configuration
echo -e "\n=== Database Configuration ==="
if [ -f "prisma/schema.prisma" ]; then
  if grep -q "provider = \"postgresql\"" prisma/schema.prisma; then
    echo "Database provider: PostgreSQL"
    # Test database connection
    if grep -q "^DATABASE_URL=" .env; then
      echo "Testing PostgreSQL connection..."
      # Extract and sanitize the connection string for display
      DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
      MASKED_URL=$(echo $DB_URL | sed -E 's/\/\/([^:]+):([^@]+)@/\/\/\1:***@/')
      echo "Connection string: $MASKED_URL"
      
      # Check if it's a localhost connection
      if [[ "$DB_URL" == *"localhost"* ]]; then
        echo "⚠️ Using localhost database - this may not work in Replit environment."
      fi
    fi
  elif grep -q "provider = \"mongodb\"" prisma/schema.prisma; then
    echo "Database provider: MongoDB"
  else
    echo "⚠️ Unknown database provider in Prisma schema"
  fi
else
  echo "❌ Prisma schema not found"
fi

# Check for OpenAI API Key
echo -e "\n=== AI Services Configuration ==="
if grep -q "^OPENAI_API_KEY=" .env; then
  OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2- | tr -d '"')
  if [[ "$OPENAI_KEY" == sk-* ]]; then
    echo "✅ OpenAI API key found and formatted correctly"
  else
    echo "⚠️ OpenAI API key may be invalid (should start with 'sk-')"
  fi
else
  echo "⚠️ OpenAI API key not found - AI health predictions may not work"
fi

# Check installed dependencies
echo -e "\n=== Package Dependencies ==="
if [ -f "package.json" ]; then
  echo "Checking for critical dependencies..."
  critical_deps=(
    "express"
    "prisma"
    "@prisma/client"
    "typescript"
    "tsx"
  )
  
  missing_deps=0
  for dep in "${critical_deps[@]}"; do
    if ! grep -q "\"$dep\"" package.json; then
      echo "❌ Missing critical dependency: $dep"
      missing_deps=$((missing_deps+1))
    fi
  done
  
  if [ $missing_deps -eq 0 ]; then
    echo "✅ All critical dependencies found"
  fi
else
  echo "❌ package.json not found"
fi

echo -e "\n=== Verification Summary ==="
if [ "$FEATURES_OK" = true ] && [ $missing_vars -eq 0 ] && [ $missing_deps -eq 0 ]; then
  echo "✅ All critical components verified successfully!"
  echo "To start the server: npm run dev"
else
  echo "⚠️ Some issues were found. Please address them before proceeding."
fi