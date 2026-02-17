
const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('create-bounty-form')) {
        console.log(`Found at line ${index + 1}: ${line.trim()}`);
    }
    if (line.includes('admin-log') || line.includes('notification')) {
        // console.log(`Notification at line ${index + 1}: ${line.trim()}`);
    }
});
