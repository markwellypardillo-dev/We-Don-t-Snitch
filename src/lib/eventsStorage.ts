import { CommunityEvent } from '../types';
import { saveToFirestore } from './firestoreSync';

const STORAGE_KEY = 'wds_community_events';

export const DEFAULT_EVENTS: CommunityEvent[] = [
  {
    id: 'evt-1',
    title: 'WDS Official Stance Gathering',
    date: '2026-09-05',
    time: '8:00 PM EST',
    type: 'Carmeet',
    description: 'Bring your lowest builds. Showcasing stance and fitment. Clean cars only!',
    host: 'WDS Admins',
    createdAt: Date.now()
  },
  {
    id: 'evt-2',
    title: 'Cinematic Drift Montage',
    date: '2026-09-12',
    time: '10:00 PM EST',
    type: 'Montage',
    description: 'Recording for our next YouTube montage. Need 5-10 high HP drift builds. We will run the mountain pass.',
    host: 'Kyle Bagsic',
    createdAt: Date.now()
  },
  {
    id: 'evt-3',
    title: 'WDS x Ghost Squad Collab Meet',
    date: '2026-09-20',
    time: '9:30 PM EST',
    type: 'Collaboration',
    description: 'Joint meet with Ghost Squad. Drag racing and highway pulls.',
    host: 'WDS Core Admins',
    createdAt: Date.now()
  }
];

export function getStoredEvents(): CommunityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EVENTS));
      return DEFAULT_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return DEFAULT_EVENTS;
  } catch (e) {
    console.error('Failed to load events from storage:', e);
    return DEFAULT_EVENTS;
  }
}

export function saveStoredEvents(events: CommunityEvent[]): void {
  try {
    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent('wds_events_changed'));
    saveToFirestore('events', sorted);
  } catch (e) {
    console.error('Failed to save events to storage:', e);
  }
}
