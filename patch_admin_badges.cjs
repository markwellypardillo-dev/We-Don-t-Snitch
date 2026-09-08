const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

// Inactivity days badge (1417-1425)
code = code.replace(
  '<span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono border ${\n                            days === 0\n                              ? \'bg-emerald-500/10 border-emerald-500/20 text-emerald-300\'\n                              : days === 1\n                                ? \'bg-red-500/10 border-red-500/20 text-red-300\'\n                                : days < 7\n                                  ? \'bg-amber-500/10 border-amber-500/30 text-amber-300\'\n                                  : \'bg-rose-500/10 border-rose-500/30 text-rose-400\'\n                          }`}>',
  '<span className={`inline-block text-[10px] font-bold uppercase tracking-widest ${\n                            days === 0\n                              ? \'text-emerald-500\'\n                              : days === 1\n                                ? \'text-red-500\'\n                                : days < 7\n                                  ? \'text-amber-500\'\n                                  : \'text-rose-500\'\n                          }`}>'
);

// Present Yesterday
code = code.replace(
  '<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">',
  '<span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">'
);

// Absent Yesterday
code = code.replace(
  '<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">',
  '<span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest">'
);

// attendanceCount present
code = code.replace(
  '<span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">',
  '<span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">'
);

// record.attendees.length present
code = code.replace(
  '<span className="px-2 py-0.5 rounded-lg bg-white/10 text-white font-mono text-xs font-bold shrink-0">',
  '<span className="text-emerald-500 font-bold text-xs uppercase tracking-widest shrink-0">'
);

fs.writeFileSync('src/components/AdminPage.tsx', code);
console.log("Admin badges patched");
