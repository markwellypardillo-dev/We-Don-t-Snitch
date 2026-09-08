const fs = require('fs');

let content = fs.readFileSync('src/components/MontagesPage.tsx', 'utf8');

content = content.replace(
  "import { useState, useEffect, useMemo } from 'react';",
  "import { useState, useEffect, useMemo, useDeferredValue } from 'react';"
);

content = content.replace(
  "const [searchQuery, setSearchQuery] = useState('');",
  "const [searchQuery, setSearchQuery] = useState('');\n  const deferredSearchQuery = useDeferredValue(searchQuery);"
);

content = content.replace(
  "const titleMatch = (v.title || '').toLowerCase().includes(searchQuery.toLowerCase());",
  "const titleMatch = (v.title || '').toLowerCase().includes(deferredSearchQuery.toLowerCase());"
);

content = content.replace(
  "const descMatch = (v.description || '').toLowerCase().includes(searchQuery.toLowerCase());",
  "const descMatch = (v.description || '').toLowerCase().includes(deferredSearchQuery.toLowerCase());"
);

content = content.replace(
  "const matchesSearch = !searchQuery.trim() || titleMatch || descMatch;",
  "const matchesSearch = !deferredSearchQuery.trim() || titleMatch || descMatch;"
);

content = content.replace(
  "[videos, searchQuery, selectedFilter]",
  "[videos, deferredSearchQuery, selectedFilter]"
);


fs.writeFileSync('src/components/MontagesPage.tsx', content);
