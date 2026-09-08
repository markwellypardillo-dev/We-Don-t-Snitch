import { CarMeetPhoto } from '../types';
import { saveToFirestore } from '../lib/firestoreSync';

export const INITIAL_CAR_MEETS: CarMeetPhoto[] = [
  {
    id: 'meet-1',
    title: 'WDS Official Squad Gathering & Stance Lineup',
    imageUrl: '/1000076465_50.jpg',
    date: '2026-08-25',
    location: 'City Underground & Track',
    description: 'Full turnout of the WDS family showcase with VIP builds and synchronized parking lines.',
    hostOrSquad: 'WDS Core Admins',
    tags: ['Official', 'Stance', 'Convoy'],
    likes: 42,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'meet-2',
    title: 'Midnight Highway Drift & Roll Race Session',
    imageUrl: '/midnight-drift.png',
    date: '2026-08-23',
    location: 'Highway Tunnel Loop',
    description: 'High-speed tandem runs, aerodynamic tuning tests, and night photoperiod.',
    hostOrSquad: 'WDS Ghost Squad',
    tags: ['Drift', 'Highway', 'Night'],
    likes: 29,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'meet-3',
    title: 'Airport Runway Drag & Clean Livery Showcase',
    imageUrl: '/airport-drag.png',
    date: '2026-08-20',
    location: 'Desert Airport Strip',
    description: 'Quarter mile drag times, custom liveries showcase, and rolling photography.',
    hostOrSquad: 'WDS Track Division',
    tags: ['Drag', 'Airport', 'Liveries'],
    likes: 35,
    createdAt: Date.now() - 86400000 * 7,
  }
];

export const STORAGE_KEY_MEETS = 'wds_car_meets';

export function getStoredMeets(): CarMeetPhoto[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MEETS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Patch old image URLs to new ones
        let updated = false;
        parsed.forEach(meet => {
          if (meet.id === 'meet-2' && meet.imageUrl.includes('1617814076367')) {
            meet.imageUrl = '/midnight-drift.png';
            updated = true;
          }
          if (meet.id === 'meet-3' && meet.imageUrl.includes('1503376780353')) {
            meet.imageUrl = '/airport-drag.png';
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEY_MEETS, JSON.stringify(parsed));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wds_meets_changed'));
            saveToFirestore('meets', parsed);
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load stored meets', e);
  }
  return INITIAL_CAR_MEETS;
}

export function saveStoredMeets(meets: CarMeetPhoto[]) {
  try {
    localStorage.setItem(STORAGE_KEY_MEETS, JSON.stringify(meets));
    window.dispatchEvent(new CustomEvent('wds_meets_changed'));
    saveToFirestore('meets', meets);
  } catch (e) {
    console.error('Failed to save meets', e);
  }
}
