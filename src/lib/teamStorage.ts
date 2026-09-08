import { TeamMember } from '../types';
import { DEFAULT_TEAM_MEMBERS } from '../data/defaultTeam';
import { saveToFirestore } from './firestoreSync';

const STORAGE_KEY = 'wds_cpm_team_members_v6';

function isZeatanMember(m: any): boolean {
  if (!m) return false;
  const name = (m.name || '').toLowerCase();
  const id = (m.id || '').toLowerCase();
  const link = (m.socialLink || '').toLowerCase();
  return (
    name.includes('zeatan') ||
    name.includes('zaetan') ||
    id === 'team-admin-9' ||
    link.includes('61576531709068')
  );
}

export function getStoredTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEAM_MEMBERS));
      saveToFirestore('team', DEFAULT_TEAM_MEMBERS);
      return DEFAULT_TEAM_MEMBERS;
    }
    
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const filtered = parsed.filter(m => !isZeatanMember(m));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        saveToFirestore('team', filtered);
      }
      return filtered.length > 0 ? filtered : DEFAULT_TEAM_MEMBERS;
    }
    
    return DEFAULT_TEAM_MEMBERS;
  } catch (e) {
    console.error('Failed to load team members from storage:', e);
    return DEFAULT_TEAM_MEMBERS;
  }
}

export function saveStoredTeamMembers(members: TeamMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    window.dispatchEvent(new CustomEvent('wds_team_members_changed'));
    saveToFirestore('team', members);
  } catch (e) {
    console.error('Failed to save team members to storage:', e);
  }
}

export function resetTeamMembersToDefault(): TeamMember[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEAM_MEMBERS));
    window.dispatchEvent(new CustomEvent('wds_team_members_changed'));
    saveToFirestore('team', DEFAULT_TEAM_MEMBERS);
    return DEFAULT_TEAM_MEMBERS;
  } catch (e) {
    console.error('Failed to reset team members:', e);
    return DEFAULT_TEAM_MEMBERS;
  }
}
