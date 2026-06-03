const path = require('path');
const fs = require('fs');
const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scripts = [];
while ((match = regex.exec(html)) !== null) {
  scripts.push(match[1]);
}
// The last script is the unminified one
const lastScript = scripts[scripts.length - 1];
fs.writeFileSync(path.resolve(__dirname, '../extracted_bottom_script.js'), lastScript, 'utf8');
console.log('Wrote last script to extracted_bottom_script.js. Length:', lastScript.length);
