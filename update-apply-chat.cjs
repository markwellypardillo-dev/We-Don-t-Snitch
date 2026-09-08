const fs = require('fs');

let content = fs.readFileSync('src/components/ApplyPage.tsx', 'utf8');

content = content.replace(
  `                <input\n                  type="text"\n                  value={chatMessage}\n                  onChange={e => setChatMessage(e.target.value)}\n                  placeholder="Reply to recruiters..."\n                  className="flex-1 bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none shadow-sm dark:shadow-none"\n                />`,
  `                <textarea\n                  rows={2}\n                  value={chatMessage}\n                  onChange={e => setChatMessage(e.target.value)}\n                  onKeyDown={e => {\n                    if (e.key === 'Enter' && !e.shiftKey) {\n                      e.preventDefault();\n                      handleSendApplicantMessage(e);\n                    }\n                  }}\n                  placeholder="Reply to recruiters..."\n                  className="flex-1 bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none shadow-sm dark:shadow-none min-h-[44px] resize-y custom-scrollbar"\n                />`
);

fs.writeFileSync('src/components/ApplyPage.tsx', content);
