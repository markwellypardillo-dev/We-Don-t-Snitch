const fs = require('fs');

let landing = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Patch Recruitment Open badge
landing = landing.replace(
  'className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-neutral-300 text-xs"',
  'className="inline-flex items-center gap-2 text-neutral-400 text-xs font-semibold tracking-widest uppercase"'
);

// Patch event.type badge in LandingPage
landing = landing.replace(
  'className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider"',
  'className="text-red-500 text-[10px] font-bold uppercase tracking-widest"'
);

fs.writeFileSync('src/components/LandingPage.tsx', landing);

let admin = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

// Patch event.type badge in AdminPage
admin = admin.replace(
  'className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider"',
  'className="text-red-500 text-[10px] font-bold uppercase tracking-widest"'
);

fs.writeFileSync('src/components/AdminPage.tsx', admin);

console.log("Patched successfully");
