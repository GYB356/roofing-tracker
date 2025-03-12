import fs from 'fs';
import path from 'path';

// Files that need to be modified
const filesToFix = [
  'src/contexts/AppointmentsContext.js',
  'src/contexts/MedicalRecordsContext.js',
  'src/components/auth/Login.js',
  'src/components/auth/Register.js',
  'src/components/dashboard/Dashboard.js',
  'src/components/dashboard/ProviderDashboard.js',
  'src/components/layout/Sidebar.js'
];

// Process each file
filesToFix.forEach(filePath => {
  try {
    // Read the file
    const fullPath = path.resolve(filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // AppointmentsContext.js
    if (filePath.includes('AppointmentsContext.js')) {
      if (content.includes("from '../services/appointmentService'")) {
        content = content.replace("from '../services/appointmentService'", "from '../services/appointmentService.js'");
        modified = true;
      }
    }
    
    // MedicalRecordsContext.js
    if (filePath.includes('MedicalRecordsContext.js')) {
      if (content.includes("from './AuthContext'")) {
        content = content.replace("from './AuthContext'", "from './AuthContext.js'");
        modified = true;
      }
      if (content.includes("from '../utils/security'")) {
        content = content.replace("from '../utils/security'", "from '../utils/security.js'");
        modified = true;
      }
    }
    
    // Components with AuthContext imports
    if (content.includes("from '../../contexts/AuthContext'")) {
      content = content.replace(/from '\.\.\/\.\.\/contexts\/AuthContext'/g, "from '../../contexts/AuthContext.js'");
      modified = true;
    }
    
    // Register.js
    if (filePath.includes('Register.js') && content.includes("from '../../services/AuthService'")) {
      content = content.replace("from '../../services/AuthService'", "from '../../services/AuthService.js'");
      modified = true;
    }
    
    // Dashboard.js
    if (filePath.includes('Dashboard.js')) {
      if (content.includes("from './AdminDashboard'")) {
        content = content.replace("from './AdminDashboard'", "from './AdminDashboard.js'");
        modified = true;
      }
      if (content.includes("from './ProviderDashboard'")) {
        content = content.replace("from './ProviderDashboard'", "from './ProviderDashboard.js'");
        modified = true;
      }
      if (content.includes("from './PatientDashboard'")) {
        content = content.replace("from './PatientDashboard'", "from './PatientDashboard.js'");
        modified = true;
      }
    }
    
    // ProviderDashboard.js
    if (filePath.includes('ProviderDashboard.js') && content.includes("from '../../services/ProviderService'")) {
      content = content.replace("from '../../services/ProviderService'", "from '../../services/ProviderService.js'");
      modified = true;
    }
    
    // Write the modified content back to the file
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
    } else {
      console.log(`⚠️ No changes needed in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('Import fixing process completed!'); 