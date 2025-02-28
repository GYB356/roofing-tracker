#!/bin/bash

echo "Starting Healthcare Platform Backend Server..."

# Function to start the server
start_server() {
  echo "Executing server with Node.js $(node -v)"
  echo "Starting server with tsx watch..."
  npx tsx watch src/index.ts
}

# Start the server
start_server

# Keep the script running
wait $!