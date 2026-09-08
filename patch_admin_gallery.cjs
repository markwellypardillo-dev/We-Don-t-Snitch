const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf-8');

// Replace handleGalleryFileChange to allow videos
code = code.replace(
  /if \(!file\.type\.startsWith\('image\/'\)\) \{\s*setToast\(\{ message: 'Please select a valid image file\.', type: 'error' \}\);\s*return;\s*\}/,
  `if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setToast({ message: 'Please select a valid image or video file.', type: 'error' });
        return;
      }`
);

// Replace accept attribute
code = code.replace(/accept="image\/\*"/, `accept="image/*,video/*"`);

// Replace render in AdminPage for gallery cars
code = code.replace(
  /<img\s+src=\{car\.imageUrl\}\s+alt=\{car\.carName\}\s+className="w-full h-full object-cover"\s+\/>/,
  `{car.imageUrl.startsWith('data:video/') || car.imageUrl.startsWith('blob:') || car.imageUrl.match(/\\.(mp4|webm|ogg)$/i) ? (
                            <video src={car.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={car.imageUrl} alt={car.carName} className="w-full h-full object-cover" />
                          )}`
);

// Replace render in Gallery form preview
code = code.replace(
  /<img src=\{galleryForm\.imageUrl\} alt="Preview" className="w-full h-full object-cover" \/>/,
  `{galleryForm.imageUrl.startsWith('data:video/') || galleryForm.imageUrl.startsWith('blob:') || galleryForm.imageUrl.match(/\\.(mp4|webm|ogg)$/i) ? (
                        <video src={galleryForm.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={galleryForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}`
);


fs.writeFileSync('src/components/AdminPage.tsx', code);
console.log('done');
