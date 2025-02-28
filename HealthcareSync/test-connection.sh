
#!/bin/bash

echo "Testing Healthcare Platform server connection..."

# Wait for server to start (max 30 seconds)
MAX_TRIES=30
COUNTER=0
SERVER_UP=false

# Try to connect to the health endpoint
while [ $COUNTER -lt $MAX_TRIES ]; do
  echo "Attempting to connect to server (try $((COUNTER+1))/$MAX_TRIES)..."
  
  # Use curl to check if the server is responding
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://0.0.0.0:5000/health 2>/dev/null)
  
  if [ "$RESPONSE" = "200" ]; then
    SERVER_UP=true
    echo "✅ Server is up and running!"
    echo "Health endpoint responding with HTTP 200"
    
    # Get the full response
    HEALTH_DATA=$(curl -s http://0.0.0.0:5000/health)
    echo "Health check data: $HEALTH_DATA"
    break
  fi
  
  COUNTER=$((COUNTER+1))
  sleep 1
done

if [ "$SERVER_UP" = false ]; then
  echo "❌ Server did not respond after $MAX_TRIES attempts."
  echo "Check server logs for errors."
  
  # Check if server process is running
  if pgrep -f "tsx server/index.ts" > /dev/null; then
    echo "Server process is running but not responding."
    echo "This might indicate the server is stuck during initialization."
  else
    echo "Server process is not running. It may have crashed or failed to start."
  fi
  
  # Display recent logs
  echo -e "\nRecent server logs:"
  tail -n 20 *.log 2>/dev/null || echo "No log files found."
  
  exit 1
else
  exit 0
fi
