const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

code = code.replace(
  '<span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${\n                      member.category === \'owner\'\n                        ? \'bg-amber-500/15 text-amber-300 border-amber-500/30\'\n                        : member.category === \'developer\'\n                        ? \'bg-cyan-500/15 text-cyan-300 border-cyan-500/30\'\n                        : \'bg-emerald-500/15 text-emerald-300 border-emerald-500/30\'\n                    }`}>',
  '<span className={`text-[10px] uppercase font-bold tracking-widest ${\n                      member.category === \'owner\'\n                        ? \'text-amber-500\'\n                        : member.category === \'developer\'\n                        ? \'text-cyan-500\'\n                        : \'text-emerald-500\'\n                    }`}>'
);

fs.writeFileSync('src/components/AdminPage.tsx', code);
console.log("Admin roles patched");
