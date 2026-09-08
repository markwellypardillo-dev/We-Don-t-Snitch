const fs = require('fs');
const glob = require('glob');

// Use hardcoded files if glob is not easy, or basic script:
const files = [
  'src/components/AdminPage.tsx',
  'src/components/ApplyPage.tsx',
  'src/components/MeetsPage.tsx',
  'src/components/LandingPage.tsx',
  'src/components/AboutPage.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/MontagesPage.tsx',
  'src/components/GalleryPage.tsx',
  'src/App.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Remove the border border-neutral-200 or 300 
  content = content.replace(/border border-neutral-200(\/80)? dark:border-white\/(5|10|20)/g, 'border-transparent dark:border-white/$2');
  content = content.replace(/border border-neutral-300(\/80)? dark:border-white\/(5|10|20)/g, 'border-transparent dark:border-white/$2');

  // Inputs and selects that had border-neutral-200/300
  content = content.replace(/border border-neutral-200 dark:border-transparent/g, 'border border-transparent');
  content = content.replace(/border border-neutral-300 dark:border-transparent/g, 'border border-transparent');
  
  // Also any stray border-neutral-200/300 that isn't caught
  content = content.replace(/border-neutral-200 dark:border-white\/(5|10|20)/g, 'border-transparent dark:border-white/$1');
  content = content.replace(/border-neutral-300 dark:border-white\/(5|10|20)/g, 'border-transparent dark:border-white/$1');

  // Some had border-2 border-neutral-200
  content = content.replace(/border-2 border-neutral-200/g, 'border-2 border-transparent');
  content = content.replace(/border-2 border-neutral-300/g, 'border-2 border-transparent');

  // Specific colored ghost buttons
  content = content.replace(/border border-blue-[0-9]+\/[0-9]+/g, 'border border-transparent');
  content = content.replace(/border border-amber-[0-9]+\/[0-9]+/g, 'border border-transparent');
  content = content.replace(/border border-red-[0-9]+\/[0-9]+/g, 'border border-transparent');
  content = content.replace(/border border-rose-[0-9]+\/[0-9]+/g, 'border border-transparent');
  content = content.replace(/border border-emerald-[0-9]+\/[0-9]+/g, 'border border-transparent');

  fs.writeFileSync(file, content);
});

console.log("Replaced outlines.");
