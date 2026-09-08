import { Application, ApplicationMessage, ApplicationStatus } from '../types';
import { saveToFirestore } from './firestoreSync';

export const APPLICATIONS_STORAGE_KEY = 'wds_driver_applications';
const LEGACY_STORAGE_KEY = 'wds_cpm_applications_v1';
export const MY_APPLICATIONS_LOCAL_KEY = 'wds_my_recent_applications';

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'WDS-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getStoredApplications(): Application[] {
  try {
    let raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(app => ({
          ...app,
          trackingCode: app.trackingCode || `WDS-${(app.id || '').slice(-4).toUpperCase() || '7788'}`,
          status: app.status || 'pending',
          messages: Array.isArray(app.messages) ? app.messages : []
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load applications:', e);
  }
  return [];
}

export function saveStoredApplications(apps: Application[]): void {
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wds_applications_changed', { detail: apps }));
    }
    saveToFirestore('applications', apps);
  } catch (e) {
    console.error('Failed to save applications:', e);
  }
}

export function getMyRecentApplicationCodes(): string[] {
  try {
    const raw = localStorage.getItem(MY_APPLICATIONS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function rememberMyApplication(trackingCodeOrId: string): void {
  try {
    const existing = getMyRecentApplicationCodes();
    if (!existing.includes(trackingCodeOrId)) {
      const updated = [trackingCodeOrId, ...existing].slice(0, 10);
      localStorage.setItem(MY_APPLICATIONS_LOCAL_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
}

export function submitApplication(data: Omit<Application, 'id' | 'date' | 'status'>): Application {
  const apps = getStoredApplications();
  const trackingCode = generateTrackingCode();
  const now = new Date().toISOString();
  
  const initialMessages: ApplicationMessage[] = [];
  if (data.notes && data.notes.trim()) {
    initialMessages.push({
      id: `msg-${Date.now()}-1`,
      sender: 'applicant',
      senderName: data.ign,
      text: data.notes.trim(),
      timestamp: now
    });
  }

  const newApp: Application = {
    ...data,
    id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    trackingCode,
    date: now,
    status: 'pending',
    messages: initialMessages,
    updatedAt: now
  };

  saveStoredApplications([newApp, ...apps]);
  rememberMyApplication(trackingCode);
  rememberMyApplication(newApp.id);
  return newApp;
}

export function updateApplication(id: string, updates: Partial<Application>): Application | null {
  const apps = getStoredApplications();
  let updatedApp: Application | null = null;
  const updated = apps.map(app => {
    if (app.id === id || app.trackingCode === id) {
      updatedApp = {
        ...app,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return updatedApp;
    }
    return app;
  });

  if (updatedApp) {
    saveStoredApplications(updated);
  }
  return updatedApp;
}

export function updateApplicationStatus(
  id: string, 
  status: ApplicationStatus, 
  feedback?: string, 
  adminName: string = 'WDS Recruitment Team',
  tryoutSchedule?: string
): void {
  const apps = getStoredApplications();
  const now = new Date().toISOString();

  const updated = apps.map(app => {
    if (app.id === id || app.trackingCode === id) {
      const newMessages = [...(app.messages || [])];
      
      let systemNote = '';
      if (status === 'approved') {
        systemNote = `🎉 Application APPROVED by ${adminName}! Welcome to World Driving Squad. Check the instructions or join our community voice/chat.`;
      } else if (status === 'interviewing') {
        systemNote = `💬 ${adminName} reached out for an interview/screening.`;
      } else if (status === 'rejected') {
        systemNote = `Application review completed by ${adminName}.`;
      }

      if (feedback && feedback.trim()) {
        newMessages.push({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          sender: 'admin',
          senderName: adminName,
          text: feedback.trim(),
          timestamp: now
        });
      } else if (systemNote) {
        newMessages.push({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          sender: 'admin',
          senderName: 'WDS System',
          text: systemNote,
          timestamp: now
        });
      }

      return {
        ...app,
        status,
        adminFeedback: feedback !== undefined ? feedback : app.adminFeedback,
        assignedAdmin: adminName,
        tryoutSchedule: tryoutSchedule !== undefined ? tryoutSchedule : app.tryoutSchedule,
        messages: newMessages,
        updatedAt: now
      };
    }
    return app;
  });

  saveStoredApplications(updated);
}

export function sendApplicationMessage(
  applicationIdOrCode: string,
  sender: 'applicant' | 'admin',
  senderName: string,
  text: string
): Application | null {
  if (!text.trim()) return null;
  const apps = getStoredApplications();
  let updatedApp: Application | null = null;
  const now = new Date().toISOString();

  const newMessage: ApplicationMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender,
    senderName,
    text: text.trim(),
    timestamp: now
  };

  const updated = apps.map(app => {
    if (app.id === applicationIdOrCode || app.trackingCode === applicationIdOrCode) {
      updatedApp = {
        ...app,
        messages: [...(app.messages || []), newMessage],
        updatedAt: now
      };
      return updatedApp;
    }
    return app;
  });

  if (updatedApp) {
    saveStoredApplications(updated);
  }
  return updatedApp;
}

export function findApplication(query: string): Application | undefined {
  if (!query.trim()) return undefined;
  const clean = query.trim().toLowerCase();
  const apps = getStoredApplications();
  return apps.find(app => 
    (app.trackingCode && app.trackingCode.toLowerCase() === clean) ||
    app.id.toLowerCase() === clean ||
    app.ign.toLowerCase() === clean ||
    (app.cpmId && app.cpmId.toLowerCase() === clean)
  );
}

export function deleteApplication(id: string): void {
  const apps = getStoredApplications();
  saveStoredApplications(apps.filter(app => app.id !== id && app.trackingCode !== id));
}

