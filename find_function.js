
const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('function addNotification')) {
        console.log(`Found at line ${index + 1}: ${line.trim()}`);
    }
});
