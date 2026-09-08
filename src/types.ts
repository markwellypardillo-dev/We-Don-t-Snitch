export interface Member {
  id: string;
  name: string;
  joinDate: string;
  lastSeen: string;
  attendanceCount: number;
  attendanceHistory?: string[]; // Array of YYYY-MM-DD strings
  rankOrRole?: string; // e.g. "Core Member", "Squad Leader", "Drifter", "VIP"
  favoriteCar?: string; // e.g. "Nissan Skyline R34", "Supra MK4"
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  attendees: string[]; // Normalized member names
  absentees?: string[]; // Registered members who missed this date
  rawText?: string;
  createdAt: number;
  timeRange?: string;
}

export interface Admin {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  fbLink: string;
}

export interface CarMeetPhoto {
  id: string;
  title: string;
  imageUrl: string;
  imageUrls?: string[];
  date: string;
  location: string;
  description?: string;
  hostOrSquad?: string;
  tags?: string[];
  likes?: number;
  createdAt: number;
}

export interface CommunityStats {
  totalMembers: number;
  useManualCount: boolean;
}

export interface ApplicationMessage {
  id: string;
  sender: 'applicant' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
}

export type ApplicationStatus = 'pending' | 'interviewing' | 'approved' | 'rejected';

export interface Application {
  id: string;
  trackingCode?: string;
  ign: string;
  cpmId?: string;
  contactMethod?: 'facebook' | 'discord' | 'messenger' | 'whatsapp' | 'instagram' | 'other';
  contactInfo?: string; // e.g. discord username or profile link
  playstyle?: string; // e.g. 'Drifting', 'Grip Racing', 'Cruising & Meets', 'Livery Designer'
  favoriteCar?: string;
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Drifter';
  availability?: string; // e.g. 'Evenings (GMT+8)', 'Weekends'
  notes?: string;
  date: string;
  status: ApplicationStatus;
  adminFeedback?: string;
  assignedAdmin?: string;
  tryoutSchedule?: string;
  messages?: ApplicationMessage[];
  updatedAt?: string;
}

export type TeamCategory = 'owner' | 'admin' | 'developer';

export interface TeamMember {
  id: string;
  name: string;
  category: TeamCategory;
  roleTitle: string;
  bio?: string;
  imageUrl: string;
  ign?: string;
  cpmId?: string;
  favoriteCar?: string;
  socialLink?: string;
  socialType?: 'facebook' | 'discord' | 'instagram' | 'github' | 'custom';
}


export type EventType = 'Carmeet' | 'Montage' | 'Collaboration' | 'Tournament' | 'Other';

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  description: string;
  host: string;
  createdAt: number;
}
