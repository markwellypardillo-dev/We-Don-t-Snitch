const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

content = content.replace(
  'className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[11px] font-semibold"',
  'className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-900/20 text-[11px] font-semibold"'
);

content = content.replace(
  'className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold"',
  'className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-900/20 font-semibold"'
);

fs.writeFileSync('src/components/AdminPage.tsx', content);
console.log("Badges patched");
