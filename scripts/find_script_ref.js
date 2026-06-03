const path = require('path');
const fs = require('fs');
const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
console.log('src/index.html contains main.js:', html.includes('main.js'));
console.log('src/index.html contains initApp:', html.includes('initApp'));
console.log('src/index.html contains js/main.js:', html.includes('js/main.js'));
const matches = html.match(/<script[^>]*src=[^>]*>/gi);
console.log('All script tags with src:', matches);
