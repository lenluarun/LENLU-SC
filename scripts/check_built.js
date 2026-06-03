const path = require('path');
const fs = require('fs');
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
console.log('Contains initApp:', html.includes('initApp'));
console.log('Contains initNewFeatures:', html.includes('initNewFeatures'));
console.log('Contains globalSearch:', html.includes('globalSearch'));
console.log('Contains generatePasswords:', html.includes('generatePasswords'));
