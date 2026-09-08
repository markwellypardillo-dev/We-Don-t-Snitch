const fs = require('fs');
let code = fs.readFileSync('src/components/AboutPage.tsx', 'utf8');

// Owner
code = code.replace(
  '<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider">\n          <Crown className="w-3 h-3 text-white" />\n          <span>{roleTitle || \'Owner\'}</span>\n        </span>',
  '<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-yellow-500">\n          <Crown className="w-3.5 h-3.5" />\n          <span>{roleTitle || \'Owner\'}</span>\n        </span>'
);

// Admin
code = code.replace(
  '<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider">\n          <ShieldCheck className="w-3 h-3 text-white" />\n          <span>{roleTitle || \'Admin\'}</span>\n        </span>',
  '<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">\n          <ShieldCheck className="w-3.5 h-3.5" />\n          <span>{roleTitle || \'Admin\'}</span>\n        </span>'
);

// Developer
code = code.replace(
  '<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider">\n          <Code2 className="w-3 h-3 text-white" />\n          <span>{roleTitle || \'Developer\'}</span>\n        </span>',
  '<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">\n          <Code2 className="w-3.5 h-3.5" />\n          <span>{roleTitle || \'Developer\'}</span>\n        </span>'
);

fs.writeFileSync('src/components/AboutPage.tsx', code);
console.log("About roles patched");
