const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/focus:border-white\/30/g, 'focus:ring-1 focus:ring-white/30');

  fs.writeFileSync(file, content, 'utf8');
});
console.log("Focus states updated");
