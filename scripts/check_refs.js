const path = require('path');
const fs = require('fs');
const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('main.js') || line.includes('/js/') || line.includes('src="js/')) {
    console.log(idx + 1, line.trim());
  }
});
