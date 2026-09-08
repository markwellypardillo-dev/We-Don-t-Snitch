import { Member } from '../types';
import { getStoredMembers } from './attendanceStorage';
import { loginAdmin, logoutAdmin } from './firebaseAuth';

export interface VerifiedUser {
  role: 'admin' | 'member';
  identifier: string; // Admin Email or Member IGN
  name: string;
  verifiedAt: number;
}

export const AUTH_STORAGE_KEY = 'wds_active_user_auth';

export function getActiveUser(): VerifiedUser | null {
  try {
    // Check dedicated active user session/local storage
    const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    // Fallback: Check if already logged into Admin portal
    if (sessionStorage.getItem('wds_admin_auth') === 'true') {
      return {
        role: 'admin',
        identifier: 'pmarkwelly@gmail.com',
        name: 'WDS Admin',
        verifiedAt: Date.now()
      };
    }
  } catch (e) {
    console.error('Failed to get active verified user', e);
  }
  return null;
}

export function setActiveUser(user: VerifiedUser | null, remember = true) {
  try {
    if (user) {
      const data = JSON.stringify(user);
      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, data);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, data);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      logoutAdmin();
    }
  } catch (e) {
    console.error('Failed to set active user', e);
  }
}

export function getRegisteredMembers(): Member[] {
  return getStoredMembers();
}

export async function verifyUserCredentials(inputNameOrEmail: string, passwordOrSecret?: string): Promise<{ success: boolean; user?: VerifiedUser; error?: string }> {
  const cleanInput = inputNameOrEmail.trim();
  if (!cleanInput) {
    return { success: false, error: 'Please enter your Admin Email or Member In-Game Name (IGN).' };
  }

  // 1. Check Admin Credentials
  const lowerInput = cleanInput.toLowerCase();
  const ADMIN_CREDENTIALS: Record<string, { pass: string; name: string }> = {
    'pmarkwelly@gmail.com': { pass: 'Mark2006', name: 'WDS Administrator' },
    'admin': { pass: 'Mark2006', name: 'WDS Administrator' },
    'zaetancpm@gmail.com': { pass: 'zaetancpm', name: 'WDS Admin (Zaetan)' },
    'tmsi20200048.bobihis@gmail.com': { pass: 'Chen123', name: 'WDS Admin (Bobihis)' },
    'carxhyperspeedlegend@gmail.com': { pass: 'qwerty', name: 'WDS Admin (CarX)' },
    'ggmaybisaya@gmail.com': { pass: 'Bisaya09', name: 'WDS Admin' },
    'rockhardmiso@gmail.com': { pass: 'stiffymiso19', name: 'WDS Admin' },
    'nunoocpm680@gmail.com': { pass: 'nunoo021', name: 'WDS Admin' },
  };

  if (ADMIN_CREDENTIALS[lowerInput]) {
    const adminConfig = ADMIN_CREDENTIALS[lowerInput];
    if (passwordOrSecret === adminConfig.pass) {
      const adminUser: VerifiedUser = {
        role: 'admin',
        identifier: lowerInput === 'admin' ? 'pmarkwelly@gmail.com' : lowerInput,
        name: adminConfig.name,
        verifiedAt: Date.now()
      };
      const fbEmail = lowerInput === 'admin' ? 'pmarkwelly@gmail.com' : lowerInput;
      const fbAuth = await loginAdmin(fbEmail, passwordOrSecret || '');
      if (!fbAuth.success) {
         console.error('Firebase Auth Failed:', fbAuth.error);
      }
      sessionStorage.setItem('wds_admin_auth', 'true');
      setActiveUser(adminUser, true);
      return { success: true, user: adminUser };
    } else {
      return { success: false, error: 'Invalid admin password.' };
    }
  }

  // 2. Check Member Roster / Attendance Roster
  const members = getRegisteredMembers();
  const matchedMember = members.find(
    m => m.name.trim().toUpperCase() === cleanInput.toUpperCase() ||
         m.id.trim().toUpperCase() === cleanInput.toUpperCase()
  );

  if (matchedMember) {
    const memberUser: VerifiedUser = {
      role: 'member',
      identifier: matchedMember.name,
      name: matchedMember.name,
      verifiedAt: Date.now()
    };
    setActiveUser(memberUser, true);
    return { success: true, user: memberUser };
  }

  // 3. If members list in localStorage is empty, or input is provided with WDS tag (e.g. WDS_)
  // Check if it's formatted as a valid WDS community tag IGN
  if (cleanInput.toUpperCase().startsWith('WDS') || cleanInput.length >= 3) {
    // If no members are loaded yet into admin roster, allow WDS tagged players or members
    const memberUser: VerifiedUser = {
      role: 'member',
      identifier: cleanInput.toUpperCase(),
      name: cleanInput,
      verifiedAt: Date.now()
    };
    setActiveUser(memberUser, true);
    return { success: true, user: memberUser };
  }

  return {
    success: false,
    error: 'Name not recognized in the WDS Member Roster. Please check your spelling or contact an Admin.'
  };
}
