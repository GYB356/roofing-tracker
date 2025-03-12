const fs = require('fs');
const path = require('path');

// Files that need Heroicons imports updated
const filesToFix = [
  'src/components/auth/Login.js',
  'src/components/dashboard/PatientDashboard.js',
  // Add other files using Heroicons here
];

// Process each file
filesToFix.forEach(filePath => {
  try {
    const fullPath = path.resolve(filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Update import from v1 to v2 format
    if (content.includes("from '@heroicons/react/outline'") || content.includes("from '@heroicons/react/solid'")) {
      // Replace outline imports
      content = content.replace(
        /import\s*\{\s*([\w\s,]+)\s*\}\s*from\s*['"]@heroicons\/react\/outline['"]/g,
        "import { $1 } from '@heroicons/react/24/outline'"
      );
      
      // Replace solid imports
      content = content.replace(
        /import\s*\{\s*([\w\s,]+)\s*\}\s*from\s*['"]@heroicons\/react\/solid['"]/g,
        "import { $1 } from '@heroicons/react/24/solid'"
      );
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated Heroicons imports in: ${filePath}`);
    } else {
      console.log(`⚠️ No Heroicons imports found in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('Heroicons import update completed!'); 