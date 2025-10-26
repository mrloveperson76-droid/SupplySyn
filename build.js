const replace = require('replace-in-file');
const fs = require('fs');

// Create a 'dist' directory if it doesn't exist
if (!fs.existsSync('dist')){
    fs.mkdirSync('dist');
}

// Copy all files from the root to the 'dist' directory
fs.cpSync('./', './dist', { recursive: true });

// The file we want to modify is now in the 'dist' directory
const options = {
  files: 'dist/js/firebase-config.js',
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

try {
  const results = replace.sync(options);
  console.log('Replacement results:', results);
} catch (error) {
  console.error('Error occurred:', error);
}