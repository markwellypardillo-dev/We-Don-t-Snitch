const fs = require('fs');

let content = fs.readFileSync('src/components/MeetsPage.tsx', 'utf8');

// Insert import
content = content.replace(
  "import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react';",
  "import { useState, useEffect, useMemo, useRef, useDeferredValue, type ChangeEvent } from 'react';"
);
content = content.replace(
  "import { useState, useEffect, useMemo, useRef } from 'react';",
  "import { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';"
);

// Insert deferred
content = content.replace(
  "const [searchQuery, setSearchQuery] = useState('');",
  "const [searchQuery, setSearchQuery] = useState('');\n  const deferredSearchQuery = useDeferredValue(searchQuery);"
);

// Update query
content = content.replace(
  "const query = searchQuery.trim().toLowerCase();",
  "const query = deferredSearchQuery.trim().toLowerCase();"
);

content = content.replace(
  "[meets, selectedLocation, searchQuery]",
  "[meets, selectedLocation, deferredSearchQuery]"
);

fs.writeFileSync('src/components/MeetsPage.tsx', content);
