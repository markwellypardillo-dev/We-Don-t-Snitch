import { Member, AttendanceRecord, CommunityStats } from '../types';
import { saveToFirestore } from './firestoreSync';
import { cleanMemberName, sortNamesAlphabetically } from './attendanceParser';

const MEMBERS_STORAGE_KEY = 'wds_cpm_members_roster_v3';
const ATTENDANCE_HISTORY_STORAGE_KEY = 'wds_cpm_attendance_history_v3';
const COMMUNITY_STATS_STORAGE_KEY = 'wds_cpm_community_stats_v3';

// Clear legacy storage keys on module load so old mock demo data is purged
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('wds_cpm_members_roster_v2');
    localStorage.removeItem('wds_cpm_attendance_history_v2');
    localStorage.removeItem('wds_cpm_members_roster');
    localStorage.removeItem('wds_cpm_attendance_history');
  }
} catch (e) {
  // Ignore storage errors in restricted contexts
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateOffsetString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();
      
      if (dateStr === today) {
        return `Today (${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      }
      if (dateStr === yesterday) {
        return `Yesterday (${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      }
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {
    console.error(e);
  }
  return dateStr;
}

/**
 * Sorts any list of members alphabetically by their clean in-game name (A to Z)
 */
export function sortMembersAlphabetically(members: Member[]): Member[] {
  return [...members].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function getStoredMembers(): Member[] {
  try {
    const saved = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Ensure names are clean and attendanceHistory array exists, then sort A-Z
        const cleaned = parsed.map((m: Member) => ({
          ...m,
          name: cleanMemberName(m.name) || m.name,
          attendanceHistory: Array.isArray(m.attendanceHistory) 
            ? m.attendanceHistory 
            : (m.lastSeen ? [m.lastSeen] : [])
        }));
        return sortMembersAlphabetically(cleaned);
      }
    }
  } catch (e) {
    console.error('Failed to load members', e);
  }
  // Initialize with empty array
  saveStoredMembers([]);
  return [];
}

export function saveStoredMembers(members: Member[]): void {
  try {
    const sorted = sortMembersAlphabetically(members);
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(sorted));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wds_members_changed', { detail: sorted }));
    }
    saveToFirestore('members', sorted);
  } catch (e) {
    console.error('Failed to save members', e);
  }
}

export function getStoredAttendanceRecords(): AttendanceRecord[] {
  try {
    const saved = localStorage.getItem(ATTENDANCE_HISTORY_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((r: AttendanceRecord) => ({
          ...r,
          attendees: sortNamesAlphabetically((r.attendees || []).map(cleanMemberName)),
          absentees: r.absentees ? sortNamesAlphabetically(r.absentees.map(cleanMemberName)) : []
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load attendance records', e);
  }
  // Initialize with empty array
  saveStoredAttendanceRecords([]);
  return [];
}

export function saveStoredAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_HISTORY_STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wds_attendance_records_changed', { detail: records }));
    }
    saveToFirestore('attendance', records);
  } catch (e) {
    console.error('Failed to save attendance records', e);
  }
}

/**
 * Resets all attendance data, clearing both member roster and attendance records to empty arrays.
 */
export function resetAllAttendanceData(): { members: Member[]; records: AttendanceRecord[] } {
  saveStoredMembers([]);
  saveStoredAttendanceRecords([]);
  return {
    members: [],
    records: []
  };
}

export function recordAttendanceSession(
  targetDate: string,
  sessionTitle: string,
  attendeeNames: string[],
  rawText?: string,
  timeRange?: string
): { 
  record: AttendanceRecord; 
  members: Member[]; 
  addedCount: number; 
  updatedCount: number; 
} {
  const currentMembers = getStoredMembers();
  const currentRecords = getStoredAttendanceRecords();
  
  // Clean, normalize, and sort attendee names from A to Z
  const cleanedAttendees = sortNamesAlphabetically(
    Array.from(new Set(attendeeNames.map(n => cleanMemberName(n)).filter(Boolean)))
  );

  const updatedMembers: Member[] = [...currentMembers];
  let addedCount = 0;
  let updatedCount = 0;

  cleanedAttendees.forEach(name => {
    const existingIndex = updatedMembers.findIndex(m => m.name.toUpperCase() === name.toUpperCase());
    if (existingIndex >= 0) {
      const existing = updatedMembers[existingIndex];
      const history = Array.isArray(existing.attendanceHistory) ? [...existing.attendanceHistory] : [];
      if (!history.includes(targetDate)) {
        history.push(targetDate);
      }
      
      // Update lastSeen if targetDate is newer or equal to current lastSeen
      const isNewer = !existing.lastSeen || new Date(targetDate).getTime() >= new Date(existing.lastSeen).getTime();

      updatedMembers[existingIndex] = {
        ...existing,
        name: cleanMemberName(existing.name),
        lastSeen: isNewer ? targetDate : existing.lastSeen,
        attendanceCount: existing.attendanceCount + 1,
        attendanceHistory: history
      };
      updatedCount++;
    } else {
      // Register new member into roster with clean name
      updatedMembers.push({
        id: `m-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        joinDate: targetDate,
        lastSeen: targetDate,
        attendanceCount: 1,
        attendanceHistory: [targetDate],
        rankOrRole: 'WDS Member'
      });
      addedCount++;
    }
  });

  // Calculate absentees based on members in roster who weren't present in this session, sorted A-Z
  const attendeeSet = new Set(cleanedAttendees.map(a => a.toUpperCase()));
  const absentees = sortNamesAlphabetically(
    updatedMembers
      .filter(m => !attendeeSet.has(m.name.toUpperCase()))
      .map(m => m.name)
  );

  // Check if a record already exists for this exact date; if so, merge or update
  const existingRecordIndex = currentRecords.findIndex(r => r.date === targetDate);
  const newRecord: AttendanceRecord = {
    id: existingRecordIndex >= 0 ? currentRecords[existingRecordIndex].id : `att-${Date.now()}`,
    date: targetDate,
    title: sessionTitle || `Attendance ${targetDate}`,
    attendees: cleanedAttendees,
    absentees: absentees,
    rawText: rawText,
    timeRange: timeRange || 'Daily Roll Call',
    createdAt: Date.now()
  };

  let updatedRecords: AttendanceRecord[];
  if (existingRecordIndex >= 0) {
    updatedRecords = [...currentRecords];
    updatedRecords[existingRecordIndex] = newRecord;
  } else {
    updatedRecords = [newRecord, ...currentRecords];
  }

  // Sort updated members A to Z before saving
  const sortedMembers = sortMembersAlphabetically(updatedMembers);

  saveStoredMembers(sortedMembers);
  saveStoredAttendanceRecords(updatedRecords);

  return {
    record: newRecord,
    members: sortedMembers,
    addedCount,
    updatedCount
  };
}

export function deleteAttendanceRecord(recordId: string): { records: AttendanceRecord[]; members: Member[] } {
  const records = getStoredAttendanceRecords().filter(r => r.id !== recordId);
  saveStoredAttendanceRecords(records);
  const members = getStoredMembers();
  return { records, members };
}

export function getDaysInactive(lastSeen: string): number {
  if (!lastSeen) return 999;
  const last = new Date(lastSeen).getTime();
  const now = new Date().getTime();
  const diff = now - last;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function getActivityBreakdownForDate(
  dateStr: string,
  members: Member[],
  records: AttendanceRecord[],
  communityStats?: CommunityStats
): {
  date: string;
  sessionRecord?: AttendanceRecord;
  presentMembers: { member: Member; present: boolean }[];
  absentMembers: { member: Member; daysSinceLastSeen: number }[];
  attendanceRate: number;
  totalMembersCount: number;
  activeCount: number;
  notActiveCount: number;
} {
  const session = records.find(r => r.date === dateStr);
  const attendeeSet = new Set(
    session 
      ? session.attendees.map(a => cleanMemberName(a).toUpperCase())
      : members.filter(m => m.attendanceHistory?.includes(dateStr)).map(m => cleanMemberName(m.name).toUpperCase())
  );

  const presentList: { member: Member; present: boolean }[] = [];
  const absentList: { member: Member; daysSinceLastSeen: number }[] = [];

  members.forEach(m => {
    const cleanName = cleanMemberName(m.name);
    const isPresent = attendeeSet.has(cleanName.toUpperCase()) || (m.attendanceHistory?.includes(dateStr) ?? false);
    if (isPresent) {
      presentList.push({ member: { ...m, name: cleanName }, present: true });
    } else {
      absentList.push({ member: { ...m, name: cleanName }, daysSinceLastSeen: getDaysInactive(m.lastSeen) });
    }
  });

  // Also include any attendees from the session record who may not be in members roster
  if (session) {
    session.attendees.forEach(rawAttName => {
      const attName = cleanMemberName(rawAttName);
      const found = presentList.some(p => p.member.name.toUpperCase() === attName.toUpperCase());
      if (!found && attName) {
        presentList.push({
          member: {
            id: `temp-${attName}`,
            name: attName,
            joinDate: dateStr,
            lastSeen: dateStr,
            attendanceCount: 1,
            attendanceHistory: [dateStr],
            rankOrRole: 'WDS Member'
          },
          present: true
        });
      }
    });
  }

  // Strictly organize both lists alphabetically from A to Z
  presentList.sort((a, b) => a.member.name.localeCompare(b.member.name, undefined, { sensitivity: 'base' }));
  absentList.sort((a, b) => a.member.name.localeCompare(b.member.name, undefined, { sensitivity: 'base' }));

  const activeCount = presentList.length;
  
  // Calculate total members: use manual count if set, or roster / present+absent total
  const rosterTotal = Math.max(members.length, presentList.length + absentList.length);
  const totalMembersCount = communityStats?.useManualCount 
    ? Math.max(communityStats.totalMembers, activeCount) 
    : rosterTotal;

  // Automatically calculate not active / inactive: Total Members - Active Members
  const notActiveCount = Math.max(0, totalMembersCount - activeCount);
  const attendanceRate = totalMembersCount > 0 ? Math.round((activeCount / totalMembersCount) * 100) : 0;

  return {
    date: dateStr,
    sessionRecord: session,
    presentMembers: presentList,
    absentMembers: absentList,
    attendanceRate,
    totalMembersCount,
    activeCount,
    notActiveCount
  };
}

export function addMemberManually(data: {
  name: string;
  joinDate?: string;
  lastSeen?: string;
  attendanceCount?: number;
  rankOrRole?: string;
  favoriteCar?: string;
  notes?: string;
}): { success: boolean; member?: Member; error?: string; members: Member[] } {
  const currentMembers = getStoredMembers();
  const cleanName = cleanMemberName(data.name);

  if (!cleanName) {
    return { success: false, error: 'Member in-game name (IGN) is required.', members: currentMembers };
  }

  const isDuplicate = currentMembers.some(m => m.name.toUpperCase() === cleanName.toUpperCase());
  if (isDuplicate) {
    return { 
      success: false, 
      error: `Member "${cleanName}" already exists in the roster. You can edit their details instead.`, 
      members: currentMembers 
    };
  }

  const today = getTodayDateString();
  const joinDate = data.joinDate?.trim() || today;
  const lastSeen = data.lastSeen?.trim() || today;
  const count = data.attendanceCount !== undefined ? Math.max(0, data.attendanceCount) : 1;

  const newMember: Member = {
    id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    joinDate: joinDate,
    lastSeen: lastSeen,
    attendanceCount: count,
    attendanceHistory: [lastSeen],
    rankOrRole: data.rankOrRole?.trim() || 'WDS Member',
    favoriteCar: data.favoriteCar?.trim() || '',
    notes: data.notes?.trim() || ''
  };

  const updatedMembers = sortMembersAlphabetically([newMember, ...currentMembers]);
  saveStoredMembers(updatedMembers);

  return {
    success: true,
    member: newMember,
    members: updatedMembers
  };
}

export function updateMemberManually(
  memberId: string,
  updatedData: {
    name: string;
    joinDate: string;
    lastSeen: string;
    attendanceCount: number;
    rankOrRole?: string;
    favoriteCar?: string;
    notes?: string;
  }
): { success: boolean; member?: Member; error?: string; members: Member[] } {
  const currentMembers = getStoredMembers();
  const cleanName = cleanMemberName(updatedData.name);

  if (!cleanName) {
    return { success: false, error: 'Member in-game name (IGN) is required.', members: currentMembers };
  }

  // Check if another member has the same name
  const isDuplicate = currentMembers.some(m => m.id !== memberId && m.name.toUpperCase() === cleanName.toUpperCase());
  if (isDuplicate) {
    return { 
      success: false, 
      error: `Another member with IGN "${cleanName}" already exists in the roster.`, 
      members: currentMembers 
    };
  }

  const index = currentMembers.findIndex(m => m.id === memberId);
  if (index === -1) {
    return { success: false, error: 'Member not found.', members: currentMembers };
  }

  const oldMember = currentMembers[index];
  const history = Array.isArray(oldMember.attendanceHistory) ? [...oldMember.attendanceHistory] : [];
  if (updatedData.lastSeen && !history.includes(updatedData.lastSeen)) {
    history.push(updatedData.lastSeen);
  }

  const updatedMember: Member = {
    ...oldMember,
    name: cleanName,
    joinDate: updatedData.joinDate.trim() || oldMember.joinDate,
    lastSeen: updatedData.lastSeen.trim() || oldMember.lastSeen,
    attendanceCount: Math.max(0, updatedData.attendanceCount),
    attendanceHistory: history,
    rankOrRole: updatedData.rankOrRole?.trim() || oldMember.rankOrRole || 'WDS Member',
    favoriteCar: updatedData.favoriteCar?.trim() || '',
    notes: updatedData.notes?.trim() || ''
  };

  const updatedMembers = [...currentMembers];
  updatedMembers[index] = updatedMember;
  const sortedMembers = sortMembersAlphabetically(updatedMembers);
  saveStoredMembers(sortedMembers);

  return {
    success: true,
    member: updatedMember,
    members: sortedMembers
  };
}

export function deleteMemberManually(memberId: string): { success: boolean; deletedName?: string; members: Member[] } {
  const currentMembers = getStoredMembers();
  const memberToDelete = currentMembers.find(m => m.id === memberId);
  if (!memberToDelete) {
    return { success: false, members: currentMembers };
  }

  const updatedMembers = currentMembers.filter(m => m.id !== memberId);
  saveStoredMembers(updatedMembers);

  return {
    success: true,
    deletedName: memberToDelete.name,
    members: updatedMembers
  };
}

/**
 * Deep cleans all member names, removes numbers, bullets, brackets, duplicates,
 * and re-organizes all roster members and past records alphabetically from A to Z.
 */
export function cleanAndOrganizeAllMembers(): { members: Member[]; records: AttendanceRecord[] } {
  const rawMembers = getStoredMembers();
  const rawRecords = getStoredAttendanceRecords();

  const cleanedMembersMap = new Map<string, Member>();

  rawMembers.forEach(m => {
    const cleanName = cleanMemberName(m.name);
    if (!cleanName) return;

    const key = cleanName.toUpperCase();
    if (cleanedMembersMap.has(key)) {
      const existing = cleanedMembersMap.get(key)!;
      const mergedHistory = Array.from(new Set([...(existing.attendanceHistory || []), ...(m.attendanceHistory || [])]));
      cleanedMembersMap.set(key, {
        ...existing,
        attendanceCount: Math.max(existing.attendanceCount, m.attendanceCount, mergedHistory.length),
        attendanceHistory: mergedHistory,
        favoriteCar: existing.favoriteCar || m.favoriteCar,
        notes: existing.notes || m.notes,
        rankOrRole: existing.rankOrRole || m.rankOrRole
      });
    } else {
      cleanedMembersMap.set(key, {
        ...m,
        name: cleanName
      });
    }
  });

  const cleanedMembers = sortMembersAlphabetically(Array.from(cleanedMembersMap.values()));

  const cleanedRecords = rawRecords.map(rec => {
    const cleanedAttendees = sortNamesAlphabetically(
      Array.from(new Set(rec.attendees.map(a => cleanMemberName(a)).filter(Boolean)))
    );
    const cleanedAbsentees = rec.absentees
      ? sortNamesAlphabetically(Array.from(new Set(rec.absentees.map(a => cleanMemberName(a)).filter(Boolean))))
      : [];

    return {
      ...rec,
      attendees: cleanedAttendees,
      absentees: cleanedAbsentees
    };
  });

  saveStoredMembers(cleanedMembers);
  saveStoredAttendanceRecords(cleanedRecords);

  return {
    members: cleanedMembers,
    records: cleanedRecords
  };
}

const DEFAULT_COMMUNITY_STATS: CommunityStats = {
  totalMembers: 0,
  useManualCount: false
};

export function getCommunityStats(): CommunityStats {
  try {
    const saved = localStorage.getItem(COMMUNITY_STATS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.totalMembers === 'number') {
        return {
          totalMembers: Math.max(0, parsed.totalMembers),
          useManualCount: Boolean(parsed.useManualCount)
        };
      }
    }
  } catch (e) {
    console.error('Failed to load community stats', e);
  }
  return DEFAULT_COMMUNITY_STATS;
}

export function saveCommunityStats(stats: CommunityStats): void {
  try {
    const normalized: CommunityStats = {
      totalMembers: Math.max(0, Math.round(stats.totalMembers)),
      useManualCount: Boolean(stats.useManualCount)
    };
    localStorage.setItem(COMMUNITY_STATS_STORAGE_KEY, JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wds_community_stats_changed', { detail: normalized }));
    }
    saveToFirestore('stats', normalized);
  } catch (e) {
    console.error('Failed to save community stats', e);
  }
}

export function getEffectiveTotalMembers(stats: CommunityStats, members: Member[]): number {
  if (stats.useManualCount) {
    return stats.totalMembers;
  }
  return members.length;
}
