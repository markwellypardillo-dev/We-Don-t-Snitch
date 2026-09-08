const fs = require('fs');
const glob = require('glob');

const files = [
  'src/components/AdminPage.tsx',
  'src/components/ApplyPage.tsx',
  'src/components/MeetsPage.tsx',
  'src/components/LandingPage.tsx',
  'src/components/AboutPage.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/MontagesPage.tsx',
  'src/components/GalleryPage.tsx',
  'src/App.tsx',
  'src/components/ThemeToggle.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace strictly all border-neutral-300 and 200 that are borders
  content = content.replaceAll('border-neutral-200/80', 'border-transparent');
  content = content.replaceAll('border border-neutral-300', 'border border-transparent');
  content = content.replaceAll('border border-neutral-200', 'border border-transparent');
  content = content.replaceAll('border-neutral-300/80', 'border-transparent');
  content = content.replaceAll('border-neutral-200', 'border-transparent');
  content = content.replaceAll('border-neutral-300', 'border-transparent');

  // Same for any button outlines that might still be there:
  content = content.replaceAll('border-blue-500/30', 'border-transparent');
  content = content.replaceAll('border-amber-500/30', 'border-transparent');
  content = content.replaceAll('border-red-500/30', 'border-transparent');
  content = content.replaceAll('border-rose-500/30', 'border-transparent');

  // Remove focus rings? Let's reduce focus rings to not have a rounded rectangle "outline" look
  // Or at least just rely on focus:ring-transparent if it was an issue, but focus ring is standard.
  // We'll leave focus rings unless specifically asked.

  fs.writeFileSync(file, content);
});

console.log("Replaced outlines phase 2.");
