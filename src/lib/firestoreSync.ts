import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';
import { DEFAULT_EVENTS } from './eventsStorage';
import { INITIAL_CAR_MEETS } from '../data/defaultMeets';
import { DEFAULT_TEAM_MEMBERS } from '../data/defaultTeam';
import { DEFAULT_FEATURED_VIDEOS } from './videoStorage';

// Helper to listen to a specific single-document collection
export function syncDocument<T>(
  collectionName: string,
  localStorageKey: string,
  eventToDispatch: string,
  defaultData: T
) {
  const docRef = doc(db, collectionName, 'all');

  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && data.items !== undefined) {
        let itemsToStore = data.items;
        if (collectionName === 'team' && Array.isArray(itemsToStore)) {
          const sanitized = itemsToStore.filter((m: any) => {
            const name = (m?.name || '').toLowerCase();
            const id = (m?.id || '').toLowerCase();
            return !name.includes('zeatan') && !name.includes('zaetan') && id !== 'team-admin-9';
          });
          if (sanitized.length !== itemsToStore.length) {
            itemsToStore = sanitized;
            saveToFirestore('team', sanitized);
          }
        }
        localStorage.setItem(localStorageKey, JSON.stringify(itemsToStore));
        window.dispatchEvent(new CustomEvent(eventToDispatch, { detail: itemsToStore }));
      }
    } else {
      // Document doesn't exist in Firestore yet, populate it from local storage or defaults
      const localData = localStorage.getItem(localStorageKey);
      let items: any = defaultData;
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed !== null && parsed !== undefined) {
            items = parsed;
          }
        } catch(e) {}
      }
      
      // Auto-seed to Firestore so all visitors across any browser immediately see the records
      saveToFirestore(collectionName, items);
    }
  }, (error) => {
    // Suppress transient offline/reconnecting errors
    if (error.code !== 'unavailable') {
      console.warn(`Firestore sync notice for ${collectionName}:`, error.message);
    }
  });
}

// Helper to strip undefined values and prepare data for Firestore
function sanitizeForFirestore(data: any): any {
  if (data === undefined || data === null) return [];
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
}

// Helper to save a full array or object to a specific single-document collection
export async function saveToFirestore(collectionName: string, items: any) {
  try {
    const cleanItems = sanitizeForFirestore(items);
    const docRef = doc(db, collectionName, 'all');
    await setDoc(docRef, { items: cleanItems, updatedAt: Date.now() });
  } catch (error: any) {
    if (error?.code !== 'unavailable') {
      console.warn(`Firestore save notice for ${collectionName}:`, error?.message || error);
    }
  }
}

export function initAllFirestoreSyncs() {
  const unsubEvents = syncDocument('events', 'wds_community_events', 'wds_events_changed', DEFAULT_EVENTS);
  const unsubMeets = syncDocument('meets', 'wds_car_meets', 'wds_meets_changed', INITIAL_CAR_MEETS);
  const unsubMembers = syncDocument('members', 'wds_cpm_members_v2', 'wds_members_changed', []);
  const unsubAttendance = syncDocument('attendance', 'wds_cpm_attendance_records_v2', 'wds_attendance_records_changed', []);
  const unsubApplications = syncDocument('applications', 'wds_driver_applications', 'wds_applications_changed', []);
  const unsubTeam = syncDocument('team', 'wds_cpm_team_members_v6', 'wds_team_members_changed', DEFAULT_TEAM_MEMBERS);
  const unsubVideo = syncDocument('video', 'wds_featured_video', 'wds_featured_video_changed', DEFAULT_FEATURED_VIDEOS);
  const unsubGallery = syncDocument('gallery', 'wds_car_gallery', 'wds_gallery_changed', []);
  const unsubStats = syncDocument('stats', 'wds_cpm_community_stats_v3', 'wds_community_stats_changed', { totalMembers: 0, useManualCount: false });

  return () => {
    unsubMeets();
    unsubMembers();
    unsubAttendance();
    unsubApplications();
    unsubTeam();
    unsubEvents();
    unsubVideo();
    unsubGallery();
    unsubStats();
  };
}
