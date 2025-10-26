const replace = require('replace-in-file');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const sourceDir = '.';  // The folder containing your site (index.html, js/, etc.)
const distDir = 'dist'; // The folder Netlify will publish

// --- Script Logic ---

console.log(`Starting build process...`);

// 1. Clean the output directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log(`Cleaned existing '${distDir}' directory.`);
}
fs.mkdirSync(distDir);

// 2. Copy all necessary site files from the source directory
// Only copy the essential files and directories
const filesToCopy = ['index.html', 'style.css', 'js', 'SupplySync_logo.png'];
filesToCopy.forEach(file => {
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(distDir, file);
    if (fs.existsSync(srcPath)) {
        if (fs.lstatSync(srcPath).isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
        console.log(`Copied ${file} to '${distDir}'.`);
    }
});

// 3. Define the replacement options for API keys
const options = {
  files: path.join(distDir, 'js', 'firebase-config.js'),
  from: [
    /__FIREBASE_API_KEY__/g,
    /__FIREBASE_AUTH_DOMAIN__/g,
    /__FIREBASE_PROJECT_ID__/g,
    /__FIREBASE_STORAGE_BUCKET__/g,
    /__FIREBASE_MESSAGING_SENDER_ID__/g,
    /__FIREBASE_APP_ID__/g,
  ],
  to: [
    process.env.FIREBASE_API_KEY,
    process.env.FIREBASE_AUTH_DOMAIN,
    process.env.FIREBASE_PROJECT_ID,
    process.env.FIREBASE_STORAGE_BUCKET,
    process.env.FIREBASE_MESSAGING_SENDER_ID,
    process.env.FIREBASE_APP_ID,
  ],
};

// 4. Run the replacement and handle errors
try {
  // Check if any environment variables are missing
  const missingVars = options.to.filter(val => !val);
  if (missingVars.length > 0) {
      throw new Error(`Build failed: Missing required environment variables in Netlify. Please check your site settings.`);
  }

  const results = replace.sync(options);
  console.log('Successfully replaced API key placeholders:', results);
  console.log('Build finished successfully!');

} catch (error) {
  console.error('ERROR during build process:', error);
  process.exit(1); // Exit with an error code to fail the Netlify build
}