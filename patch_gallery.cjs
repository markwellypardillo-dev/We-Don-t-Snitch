const fs = require('fs');
let code = fs.readFileSync('src/lib/galleryStorage.ts', 'utf-8');
const replacement = `
import { saveToFirestore } from './firestoreSync';
import { saveVideoBlobToIndexedDB, getVideoBlobFromIndexedDB, videoBinaryCache } from './videoStorage';

export interface GalleryCar {
  id: string;
  imageUrl: string;
  carName: string;
  ownerName: string;
  type: 'link' | 'upload';
  createdAt: number;
}

const STORAGE_KEY = 'wds_car_gallery';

export function getGalleryCars(): GalleryCar[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          const id = item.id || \`car-\${idx}-\${Date.now()}\`;
          let imageUrl = item.imageUrl || '';
          if (videoBinaryCache.has(id)) {
            imageUrl = videoBinaryCache.get(id)!;
          }
          return {
            id,
            imageUrl,
            carName: item.carName || '',
            ownerName: item.ownerName || '',
            type: item.type || (imageUrl.startsWith('data:') || imageUrl.startsWith('idb:') ? 'upload' : 'link'),
            createdAt: item.createdAt || Date.now()
          };
        }).filter(c => c.imageUrl);
      }
    }
  } catch (error) {
    console.error('Failed to load gallery cars:', error);
  }
  return [];
}

export function saveGalleryCars(cars: GalleryCar[]): void {
  try {
    const persistable = cars.map(v => {
      if (v.type === 'upload' && v.imageUrl.startsWith('data:')) {
        saveVideoBlobToIndexedDB(v.id, v.imageUrl);
        if (v.imageUrl.length > 1.5 * 1024 * 1024) {
          return { ...v, imageUrl: \`idb:\${v.id}\` };
        }
      }
      return v;
    });
    const sorted = [...persistable].sort((a, b) => b.createdAt - a.createdAt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));

    const firestoreSafe = sorted.map(v => {
      const isLarge = v.type === 'upload' && v.imageUrl && v.imageUrl.length > 800 * 1024;
      return {
        ...v,
        imageUrl: isLarge ? 'local-upload' : (v.imageUrl || '')
      };
    });
    
    saveToFirestore('gallery', firestoreSafe);
    
    window.dispatchEvent(new CustomEvent('wds_gallery_changed', { detail: sorted }));
  } catch (error) {
    console.error('Failed to save gallery cars:', error);
  }
}

export async function hydrateGalleryFromIndexedDB(): Promise<GalleryCar[]> {
  const current = getGalleryCars();
  let changed = false;
  for (const v of current) {
    if (v.type === 'upload' && (!v.imageUrl || v.imageUrl.startsWith('idb:'))) {
      const data = await getVideoBlobFromIndexedDB(v.id);
      if (data) {
        v.imageUrl = data;
        videoBinaryCache.set(v.id, data);
        changed = true;
      }
    } else if (v.type === 'upload' && v.imageUrl.startsWith('data:')) {
      saveVideoBlobToIndexedDB(v.id, v.imageUrl);
    }
  }
  if (changed) {
    window.dispatchEvent(new CustomEvent('wds_gallery_changed', { detail: current }));
  }
  return current;
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    hydrateGalleryFromIndexedDB().catch(console.error);
  }, 100);
}

export async function compressGalleryImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.8));
        } else {
          resolve(img.src);
        }
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}
`;
fs.writeFileSync('src/lib/galleryStorage.ts', replacement);
console.log('done');
