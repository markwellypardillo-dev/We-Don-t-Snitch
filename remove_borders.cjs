const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/*.tsx');
files.push('src/App.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace standard borders on components
  // border border-white/10 -> shadow-md
  // border border-white/15 -> shadow-md
  // border border-white/20 -> shadow-lg
  // border border-white/5 -> shadow-sm
  
  content = content.replace(/border border-white\/(?:5|10|15|20|25|30)/g, 'shadow-lg shadow-black/20');
  content = content.replace(/border border-red-500\/(?:20|30)/g, 'shadow-lg shadow-red-900/20');
  content = content.replace(/border border-emerald-500\/(?:20|30)/g, 'shadow-lg shadow-emerald-900/20');
  content = content.replace(/border border-amber-500\/(?:20|30)/g, 'shadow-lg shadow-amber-900/20');
  content = content.replace(/border border-rose-500\/(?:20|25|30)/g, 'shadow-lg shadow-rose-900/20');
  content = content.replace(/border border-dashed border-white\/(?:15|20)/g, 'border-dashed border-white/10 shadow-lg');
  
  // also clean up any duplicate shadows if we just added one and there was already one
  content = content.replace(/shadow-lg shadow-black\/20 shadow-lg/g, 'shadow-lg shadow-black/20');

  fs.writeFileSync(file, content, 'utf8');
});
console.log("Borders removed and replaced with shadows");
