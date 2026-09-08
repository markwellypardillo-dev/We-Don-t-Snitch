const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Replace button classes lacking shadows
code = code.replace(
  'className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md active:scale-95"',
  'className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md shadow-lg active:scale-95"'
);

// Any other buttons...
code = code.replace(
  'className="text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"',
  'className="text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer drop-shadow-md"'
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Landing buttons patched");
