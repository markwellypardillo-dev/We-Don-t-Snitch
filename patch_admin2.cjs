const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPage.tsx', 'utf-8');

code = code.replace(
  /accept="image\/\*"\s*ref=\{galleryFileInputRef\}/g,
  `accept="image/*,video/*"\n                        ref={galleryFileInputRef}`
);

// We should also replace the label from "Image File *" to "Media File *"
code = code.replace(
  /label className="text-\[10px\] font-bold text-neutral-400 uppercase tracking-wider pl-1">Image File \*/g,
  `label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-1">Media File *`
);

// We should also update "Click or drag image to upload"
code = code.replace(
  /'Image Selected' : 'Click or drag image to upload'/g,
  `'Media Selected' : 'Click or drag image/video to upload'`
);

fs.writeFileSync('src/components/AdminPage.tsx', code);

// Now for GalleryPage.tsx
let code2 = fs.readFileSync('src/components/GalleryPage.tsx', 'utf-8');
code2 = code2.replace(
  /<img\s*src=\{car\.imageUrl\}\s*alt=\{car\.carName\}\s*className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"\s*loading="lazy"\s*\/>/g,
  `{car.imageUrl && (car.imageUrl.startsWith('data:video/') || car.imageUrl.startsWith('blob:') || car.imageUrl.match(/\\.(mp4|webm|ogg)$/i)) ? (
                      <video src={car.imageUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    ) : (
                      <img src={car.imageUrl} alt={car.carName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" loading="lazy" />
                    )}`
);

fs.writeFileSync('src/components/GalleryPage.tsx', code2);

console.log('done2');
