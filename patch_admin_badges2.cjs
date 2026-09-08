const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

code = code.replace(
  '<span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 transition-all ${\n                            days === 0\n                              ? \'bg-emerald-500/10 border-emerald-500/30 text-emerald-400\'\n                              : days < 3\n                                ? \'bg-red-500/10 border-red-500/20 text-red-300\'\n                                : days < 7\n                                  ? \'bg-amber-500/10 border-amber-500/30 text-amber-300\'\n                                  : \'bg-rose-500/10 border-rose-500/30 text-rose-400\'\n                          }`}>',
  '<span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all shadow-lg ${\n                            days === 0\n                              ? \'bg-emerald-500/20 text-emerald-400 shadow-emerald-900/20\'\n                              : days < 3\n                                ? \'bg-red-500/20 text-red-300 shadow-red-900/20\'\n                                : days < 7\n                                  ? \'bg-amber-500/20 text-amber-300 shadow-amber-900/20\'\n                                  : \'bg-rose-500/20 text-rose-400 shadow-rose-900/20\'\n                          }`}>'
);

fs.writeFileSync('src/components/AdminPage.tsx', code);
console.log("Admin badges 2 patched");
