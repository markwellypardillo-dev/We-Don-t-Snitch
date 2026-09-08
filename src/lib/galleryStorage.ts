
import { saveToFirestore } from './firestoreSync';

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
        return parsed.map((item, idx) => ({
          id: item.id || `car-${idx}-${Date.now()}`,
          imageUrl: item.imageUrl || '',
          carName: item.carName || '',
          ownerName: item.ownerName || '',
          type: item.type || (item.imageUrl?.startsWith('data:') ? 'upload' : 'link'),
          createdAt: item.createdAt || Date.now()
        })).filter(c => Boolean(c.imageUrl && !c.imageUrl.startsWith('idb:')));
      }
    }
  } catch (error) {
    console.error('Failed to load gallery cars:', error);
  }
  return [];
}

export function saveGalleryCars(cars: GalleryCar[]): void {
  try {
    const sorted = [...cars].sort((a, b) => b.createdAt - a.createdAt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));

    const firestoreSafe = sorted.map(v => {
      const isLarge = v.imageUrl && v.imageUrl.length > 800 * 1024;
      return {
        ...v,
        imageUrl: isLarge ? '' : (v.imageUrl || '')
      };
    }).filter(v => Boolean(v.imageUrl));
    
    saveToFirestore('gallery', firestoreSafe);
    window.dispatchEvent(new CustomEvent('wds_gallery_changed', { detail: sorted }));
  } catch (error) {
    console.error('Failed to save gallery cars:', error);
  }
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
