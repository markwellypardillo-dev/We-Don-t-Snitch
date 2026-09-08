const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPage.tsx', 'utf8');

// Insert deferred values right after state declarations for memberSearch and appSearch

content = content.replace(
  "const [memberSearch, setMemberSearch] = useState('');",
  "const [memberSearch, setMemberSearch] = useState('');\n  const deferredMemberSearch = useDeferredValue(memberSearch);"
);

content = content.replace(
  "const [appSearch, setAppSearch] = useState('');",
  "const [appSearch, setAppSearch] = useState('');\n  const deferredAppSearch = useDeferredValue(appSearch);"
);

// Update filtering logic to use deferred variables
content = content.replace(
  /const q = memberSearch.trim\(\).toLowerCase\(\);/g,
  "const q = deferredMemberSearch.trim().toLowerCase();"
);

content = content.replace(
  /const q = appSearch.toLowerCase\(\);/g,
  "const q = deferredAppSearch.toLowerCase();"
);

// Update useMemo dependencies
content = content.replace(
  /\[members, memberFilter, memberSearch, sortBy, todayStr, yesterdayStr\]/g,
  "[members, memberFilter, deferredMemberSearch, sortBy, todayStr, yesterdayStr]"
);

content = content.replace(
  /\[applications, appFilter, appSearch\]/g,
  "[applications, appFilter, deferredAppSearch]"
);


fs.writeFileSync('src/components/AdminPage.tsx', content);
console.log("Updated to useDeferredValue.");
