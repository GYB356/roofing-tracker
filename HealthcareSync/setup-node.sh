
#!/bin/bash

echo "Setting up Node.js environment..."

# Check if Node.js is already installed
if command -v node &> /dev/null; then
  echo "✅ Node.js already installed: $(node -v)"
  echo "✅ NPM version: $(npm -v)"
else
  echo "Node.js not found, using Replit's built-in Node.js..."
  
  # Try using Replit's environment
  export PATH=$PATH:/home/runner/.nix-profile/bin:/nix/var/nix/profiles/default/bin
  
  # Check again after PATH updates
  if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node -v)"
    echo "✅ NPM version: $(npm -v)"
  else
    echo "⚠️ Trying alternative Node.js setup..."
    # Use npm directly which should be available on Replit
    npm --version || {
      echo "⚠️ Cannot find Node.js or npm. Please contact Replit support."
      exit 1
    }
  fi
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
  echo "Installing dependencies..."
  npm install || {
    echo "Failed to install dependencies"
    exit 1
  }
  
  # Generate Prisma client if Prisma exists
  if grep -q "prisma" package.json; then
    echo "Generating Prisma client..."
    npx prisma generate || echo "Prisma generation failed, but continuing..."
  fi
fi

echo "Setup complete!"
