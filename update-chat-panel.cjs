const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

// 1. Update the Right container wrapper
content = content.replace(
  "{/* Right: Detailed Dossier & Live Two-Way Chat */}\n            <div className={`flex-1 flex flex-col bg-neutral-100/60 dark:bg-neutral-900/60 relative ${!selectedApp ? 'hidden md:flex' : 'flex'}`}>",
  `{/* Right: Detailed Dossier & Live Two-Way Chat */}\n            <div className={\`flex flex-col bg-neutral-100/60 dark:bg-neutral-900/60 transition-all duration-300 \${!selectedApp ? 'hidden md:flex flex-1 relative' : (isAppChatExpanded ? 'fixed inset-0 z-[100] h-[100dvh]' : 'flex-1 relative flex')}\`}>`
);

// 2. Add the Expand/Collapse button to the Header Banner
content = content.replace(
  `<button \n                        type="button"\n                        onClick={() => setSelectedAppId(null)}`,
  `<button\n                        type="button"\n                        onClick={() => setIsAppChatExpanded(!isAppChatExpanded)}\n                        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"\n                        title={isAppChatExpanded ? "Collapse view" : "Expand to fullscreen"}\n                      >\n                        {isAppChatExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}\n                      </button>\n                      <button \n                        type="button"\n                        onClick={() => setSelectedAppId(null)}`
);

// 3. Update the input to a textarea and change its class
content = content.replace(
  `                      <input\n                        type="text"\n                        value={adminChatText}\n                        onChange={e => setAdminChatText(e.target.value)}\n                        placeholder={\`Reply directly to \${selectedApp.ign} (e.g. "Join room #5020 for tandem tryouts")...\`}\n                        className="flex-1 bg-neutral-100 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"\n                      />`,
  `                      <textarea\n                        rows={isAppChatExpanded ? 3 : 1}\n                        value={adminChatText}\n                        onChange={e => setAdminChatText(e.target.value)}\n                        onKeyDown={e => {\n                          if (e.key === 'Enter' && !e.shiftKey) {\n                            e.preventDefault();\n                            if (adminChatText.trim()) {\n                              sendApplicationMessage(selectedApp.id, 'admin', 'WDS Recruiter', adminChatText.trim());\n                              setApplications(getStoredApplications());\n                              setAdminChatText('');\n                              showToast('Reply beamed directly to applicant ticket.');\n                            }\n                          }\n                        }}\n                        placeholder={\`Reply directly to \${selectedApp.ign} (e.g. "Join room #5020 for tandem tryouts")...\`}\n                        className={\`flex-1 bg-neutral-100 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none custom-scrollbar resize-none \${isAppChatExpanded ? 'h-[80px]' : 'h-[40px]'}\`}\n                      />`
);


// Also hide the Info strip when expanded to save space on mobile
content = content.replace(
  "{/* Applicant Details Info Strip */}\n                  <div className=\"grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-neutral-200/50 dark:bg-black/20 border-b border-transparent dark:border-white/5 text-xs\">",
  "{/* Applicant Details Info Strip */}\n                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-neutral-200/50 dark:bg-black/20 border-b border-transparent dark:border-white/5 text-xs ${isAppChatExpanded ? 'hidden sm:grid' : ''}`}>"
);


fs.writeFileSync('src/components/AdminPage.tsx', content);
