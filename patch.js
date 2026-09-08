const fs = require('fs');

let landing = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
landing = landing.replace(
  /The premier Car Parking Multiplayer community\. Daily car meets, organized cruises, and zero toxicity\./g,
  "Elite CPM Drivers. Daily meets, zero toxicity."
);
fs.writeFileSync('src/components/LandingPage.tsx', landing);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  /Premier CPM Community\. Clean builds, competitive racing, mutual respect\./g,
  "Elite CPM Drivers. Clean builds, competitive racing."
);
fs.writeFileSync('src/App.tsx', app);
