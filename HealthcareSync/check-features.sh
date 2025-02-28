
#!/bin/bash

echo "=== Healthcare Platform Feature Verification ==="
echo "Checking for implementation of core features..."

# Check for Authentication System
echo -e "\n1. Authentication System:"
if grep -q "authenticateJWT" server/index.ts && [ -d "server/middleware" ]; then
  echo "✅ Authentication middleware found"
else
  echo "❌ Authentication system implementation incomplete"
fi

# Check for Medical Records Management
echo -e "\n2. Medical Records Management:"
if grep -q "medical\|record\|patient" prisma/schema.prisma 2>/dev/null; then
  echo "✅ Medical records schema found"
else
  echo "❌ Medical records management implementation incomplete"
fi

# Check for Patient Management
echo -e "\n3. Patient Management:"
if grep -q "appointment\|schedule\|patient" prisma/schema.prisma 2>/dev/null; then
  echo "✅ Patient management schema found" 
else
  echo "❌ Patient management implementation incomplete"
fi

# Check for Health Metrics Tracking
echo -e "\n4. Health Metrics Tracking:"
if grep -q "metrics\|blood_pressure\|heart_rate" prisma/schema.prisma 2>/dev/null; then
  echo "✅ Health metrics schema found"
else
  echo "❌ Health metrics tracking implementation incomplete"
fi

# Check for AI Integration
echo -e "\n5. AI Integration:"
if grep -q "openai\|ai\|insight" server/services 2>/dev/null || grep -q "openai" package.json; then
  echo "✅ AI integration found"
else
  echo "❌ AI integration implementation incomplete"
fi

# Check for Real-time Features
echo -e "\n6. Real-time Features:"
if [ -f "server/websocket.ts" ] || grep -q "socket\|websocket\|realtime" server/ 2>/dev/null; then
  echo "✅ Real-time functionality foundation found"
else
  echo "❌ Real-time features implementation incomplete"
fi

# Check for Emergency Features
echo -e "\n7. Emergency Alert System:"
if grep -q "emergency\|alert\|critical" server/ 2>/dev/null; then
  echo "✅ Emergency alert system found"
else
  echo "❌ Emergency alert system implementation incomplete"
fi

# Check for Medical Imaging
echo -e "\n8. Medical Imaging System:"
if grep -q "image\|imaging\|scan" server/ 2>/dev/null; then
  echo "✅ Medical imaging system found"
else
  echo "❌ Medical imaging system implementation incomplete"
fi

# Check for Secure Messaging
echo -e "\n9. Secure Messaging:"
if grep -q "message\|messaging\|chat" server/ 2>/dev/null; then
  echo "✅ Secure messaging system found"
else
  echo "❌ Secure messaging system implementation incomplete"
fi

# Check for Prescription Management
echo -e "\n10. Advanced Prescription Management:"
if grep -q "prescription\|pharmacy\|medication" server/ 2>/dev/null && grep -q "workflow" server/ 2>/dev/null; then
  echo "✅ Advanced prescription management workflow found"
else
  echo "❌ Advanced prescription management workflow incomplete"
fi

echo -e "\n=== Summary ==="
echo "Core features appear to be partially implemented."
echo "Several 'Areas That Need Attention' require implementation work."
echo "Run 'npm run dev' to start the server once Node.js issues are resolved."
