import { useState, useEffect, useMemo, useRef, useDeferredValue, type FormEvent, ChangeEvent } from 'react';
import { parseAttendanceDetailed } from '../lib/attendanceParser';
import { Member, AttendanceRecord, CommunityStats, TeamMember, TeamCategory, Application, CommunityEvent, EventType } from '../types';
import { 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  ArrowRight, 
  Calendar,
  CalendarDays, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  History, 
  Search, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  Copy, 
  Trash2, 
  Plus, 
  Sparkles, 
  Filter, 
  AlertTriangle,
  LogOut,
  Layers,
  BarChart3,
  UserPlus,
  Pencil,
  X,
  Car,
  Tag,
  ArrowUpDown,
  SlidersHorizontal,
  Check,
  Crown,
  Code2,
  ExternalLink,
  Gamepad2,
  RotateCcw,
  Inbox,
  CheckCircle,
  XCircle,
  Upload,
  Eye,
  EyeOff,
  Edit2,
  Video,
  Link as LinkIcon,
  Film,
  MessageSquare,
  ImageIcon,
  Send,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { setActiveUser } from '../lib/authVerification';
import { loginAdmin } from '../lib/firebaseAuth';
import { getStoredApplications, updateApplicationStatus, deleteApplication, sendApplicationMessage, updateApplication } from '../lib/applicationStorage';
import { getStoredEvents, saveStoredEvents } from '../lib/eventsStorage';
import { FeaturedVideo, getFeaturedVideos, saveFeaturedVideos, formatVideoEmbedUrl } from '../lib/videoStorage';
import { GalleryCar, getGalleryCars, saveGalleryCars, compressGalleryImage } from '../lib/galleryStorage';
import {
  getStoredMembers,
  saveStoredMembers,
  getStoredAttendanceRecords,
  saveStoredAttendanceRecords,
  recordAttendanceSession,
  deleteAttendanceRecord,
  getTodayDateString,
  getYesterdayDateString,
  formatDisplayDate,
  getDaysInactive,
  getActivityBreakdownForDate,
  addMemberManually,
  updateMemberManually,
  deleteMemberManually,
  cleanAndOrganizeAllMembers,
  sortMembersAlphabetically,
  getCommunityStats,
  saveCommunityStats,
  getEffectiveTotalMembers,
  resetAllAttendanceData
} from '../lib/attendanceStorage';
import {
  getStoredTeamMembers,
  saveStoredTeamMembers,
  resetTeamMembersToDefault
} from '../lib/teamStorage';
import { cleanMemberName } from '../lib/attendanceParser';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('wds_admin_auth') === 'true';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Primary Data
  const [members, setMembers] = useState<Member[]>(() => getStoredMembers());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => getStoredAttendanceRecords());
  const [communityStats, setCommunityStats] = useState<CommunityStats>(() => getCommunityStats());
  const [events, setEvents] = useState<CommunityEvent[]>(() => getStoredEvents());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => getStoredTeamMembers());
  const [applications, setApplications] = useState<Application[]>(() => getStoredApplications());
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isAppChatExpanded, setIsAppChatExpanded] = useState(false);
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'interviewing' | 'approved' | 'rejected'>('all');
  const [appSearch, setAppSearch] = useState('');
  const deferredAppSearch = useDeferredValue(appSearch);
  const [adminChatText, setAdminChatText] = useState('');
  const [customReplyModalOpen, setCustomReplyModalOpen] = useState(false);
  const [customReplyText, setCustomReplyText] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [tryoutScheduleInput, setTryoutScheduleInput] = useState('Tonight at 8:00 PM (Room Code: #WDS-DRIFT)');

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      if (appFilter !== 'all' && app.status !== appFilter) return false;
      if (appSearch.trim()) {
        const q = deferredAppSearch.toLowerCase();
        const matchesIgn = app.ign.toLowerCase().includes(q);
        const matchesId = (app.cpmId || '').toLowerCase().includes(q);
        const matchesCode = (app.trackingCode || '').toLowerCase().includes(q);
        const matchesContact = (app.contactInfo || '').toLowerCase().includes(q);
        const matchesPlaystyle = (app.playstyle || '').toLowerCase().includes(q);
        if (!matchesIgn && !matchesId && !matchesCode && !matchesContact && !matchesPlaystyle) return false;
      }
      return true;
    });
  }, [applications, appFilter, deferredAppSearch]);

  const selectedApp = applications.find(a => a.id === selectedAppId) || filteredApplications[0] || applications[0] || null;

  // Navigation Tab inside Admin Dashboard
  const [activeTab, setActiveTab] = useState<'attendance-live' | 'past-records' | 'parser' | 'team' | 'applications' | 'events' | 'video' | 'gallery'>('attendance-live');

  // Video Management State
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>(() => getFeaturedVideos());
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [isVideoFormLoading, setIsVideoFormLoading] = useState(false);
  const [videoFormError, setVideoFormError] = useState('');
  const [videoForm, setVideoForm] = useState<{
    url: string;
    title: string;
    description: string;
  }>({
    url: '',
    title: '',
    description: ''
  });

  // Gallery Management States
  const [galleryCars, setGalleryCars] = useState<GalleryCar[]>([]);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isGalleryFormLoading, setIsGalleryFormLoading] = useState(false);
  const [isGallerySaving, setIsGallerySaving] = useState(false);
  const [gallerySuccessBanner, setGallerySuccessBanner] = useState<string | null>(null);
  const [gallerySelectedFileName, setGallerySelectedFileName] = useState<string>('');
  const [gallerySelectedFileSize, setGallerySelectedFileSize] = useState<string>('');
  const [gallerySourceMode, setGallerySourceMode] = useState<'link' | 'upload'>('link');
  const [galleryForm, setGalleryForm] = useState<{
    imageUrl: string;
    carName: string;
    ownerName: string;
    type: 'embed' | 'upload';
  }>({
    imageUrl: '',
    carName: '',
    ownerName: '',
    type: 'embed'
  });

  // Team Management Modals
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [deletingTeamMember, setDeletingTeamMember] = useState<TeamMember | null>(null);
  const [teamForm, setTeamForm] = useState<{
    name: string;
    category: TeamCategory;
    roleTitle: string;
    bio: string;
    imageUrl: string;
    ign: string;
    cpmId: string;
    favoriteCar: string;
    socialLink: string;
  }>({
    name: '',
    category: 'admin',
    roleTitle: 'Administrator',
    bio: '',
    imageUrl: '',
    ign: '',
    cpmId: '',
    favoriteCar: '',
    socialLink: ''
  });

  // Parser Form State
  const [rawText, setRawText] = useState('');
  const [sessionDate, setSessionDate] = useState(() => getTodayDateString());
  const [sessionTitle, setSessionTitle] = useState('Daily Squad Roll Call');
  const [sessionTime, setSessionTime] = useState('7:00 PM - 10:00 PM');
  const [parsedPreviewNames, setParsedPreviewNames] = useState<string[]>([]);
  const [parseResult, setParseResult] = useState<{ added: number; updated: number; title: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Live / Inactivity Filter & Sorting (Defaults to clean A-Z)
  const [memberFilter, setMemberFilter] = useState<'all' | 'active-today' | 'active-yesterday' | 'inactive-yesterday' | 'warning' | 'critical'>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const deferredMemberSearch = useDeferredValue(memberSearch);
  const [sortBy, setSortBy] = useState<'name' | 'inactivity' | 'attendance' | 'joined'>('name');

  // Selected Past Date for Inspection
  const [selectedPastDate, setSelectedPastDate] = useState<string>(() => getYesterdayDateString());
  const [pastViewMode, setPastViewMode] = useState<'all' | 'present' | 'absent'>('all');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal States for Member & Community Management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isTotalMembersModalOpen, setIsTotalMembersModalOpen] = useState(false);

  // Hover & Tap Expand State for Clean Roster (Single Member Focus)
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Edit Total Community Members Form State
  const [editTotalMembersForm, setEditTotalMembersForm] = useState<{
    totalMembers: number;
    useManualCount: boolean;
  }>({
    totalMembers: 248,
    useManualCount: true
  });


  // Add Event Form State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{
    title: string;
    date: string;
    time: string;
    type: EventType;
    description: string;
    host: string;
  }>({
    title: '',
    date: getTodayDateString(),
    time: '8:00 PM EST',
    type: 'Carmeet',
    description: '',
    host: 'WDS Admins'
  });

  const handleOpenAddEvent = () => {
    setEditingEventId(null);
    setEventForm({
      title: '',
      date: getTodayDateString(),
      time: '8:00 PM EST',
      type: 'Carmeet',
      description: '',
      host: 'WDS Admins'
    });
    setIsAddEventModalOpen(true);
  };

  const handleOpenEditEvent = (event: CommunityEvent) => {
    setEditingEventId(event.id);
    setEventForm({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description || '',
      host: event.host || 'WDS Admins'
    });
    setIsAddEventModalOpen(true);
  };

  const handleSaveEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date || !eventForm.time) return;
    
    let updated;
    if (editingEventId) {
      updated = events.map(ev => 
        ev.id === editingEventId 
          ? { ...ev, ...eventForm } 
          : ev
      );
      showToast('Event updated successfully!');
    } else {
      const newEvent: CommunityEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...eventForm,
        createdAt: Date.now()
      };
      updated = [...events, newEvent];
      showToast('Event scheduled successfully!');
    }
    
    setEvents(updated);
    saveStoredEvents(updated);
    setIsAddEventModalOpen(false);
    setEditingEventId(null);
    setEventForm({
      title: '',
      date: getTodayDateString(),
      time: '8:00 PM EST',
      type: 'Carmeet',
      description: '',
      host: 'WDS Admins'
    });
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      saveStoredEvents(updated);
      showToast('Event deleted.');
    }
  };

  // Add Member Form State
  const [addForm, setAddForm] = useState({
    name: '',
    joinDate: getTodayDateString(),
    lastSeen: getTodayDateString(),
    attendanceCount: 1,
    rankOrRole: 'WDS Member',
    favoriteCar: '',
    notes: ''
  });
  const [addError, setAddError] = useState('');

  // Edit Member Form State
  const [editForm, setEditForm] = useState({
    name: '',
    joinDate: '',
    lastSeen: '',
    attendanceCount: 0,
    rankOrRole: '',
    favoriteCar: '',
    notes: ''
  });
  const [editError, setEditError] = useState('');

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Sync Members when updated by any admin or Firestore
  useEffect(() => {
    const handleMembersChanged = (e: Event) => {
      const customEvent = e as CustomEvent<Member[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setMembers(customEvent.detail);
      } else {
        setMembers(getStoredMembers());
      }
    };
    window.addEventListener('wds_members_changed', handleMembersChanged);
    return () => window.removeEventListener('wds_members_changed', handleMembersChanged);
  }, []);

  // Sync Attendance Records when updated by any admin or Firestore
  useEffect(() => {
    const handleAttendanceChanged = (e: Event) => {
      const customEvent = e as CustomEvent<AttendanceRecord[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setAttendanceRecords(customEvent.detail);
      } else {
        setAttendanceRecords(getStoredAttendanceRecords());
      }
    };
    window.addEventListener('wds_attendance_records_changed', handleAttendanceChanged);
    return () => window.removeEventListener('wds_attendance_records_changed', handleAttendanceChanged);
  }, []);

  // Sync Team Members when updated by any admin or Firestore
  useEffect(() => {
    const handleTeamChanged = (e: Event) => {
      const customEvent = e as CustomEvent<TeamMember[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setTeamMembers(customEvent.detail);
      } else {
        setTeamMembers(getStoredTeamMembers());
      }
    };
    window.addEventListener('wds_team_members_changed', handleTeamChanged);
    return () => window.removeEventListener('wds_team_members_changed', handleTeamChanged);
  }, []);

  useEffect(() => {
    const handleApplicationsChanged = () => setApplications(getStoredApplications());
    window.addEventListener('wds_applications_changed', handleApplicationsChanged);
    return () => window.removeEventListener('wds_applications_changed', handleApplicationsChanged);
  }, []);

  useEffect(() => {
    const handleEventsChanged = () => setEvents(getStoredEvents());
    window.addEventListener('wds_events_changed', handleEventsChanged);
    return () => window.removeEventListener('wds_events_changed', handleEventsChanged);
  }, []);

  useEffect(() => {
    const handleVideoChanged = () => setFeaturedVideos(getFeaturedVideos());
    window.addEventListener('wds_featured_video_changed', handleVideoChanged);
    return () => window.removeEventListener('wds_featured_video_changed', handleVideoChanged);
  }, []);

  useEffect(() => {
    const handleGalleryChanged = () => {
      setGalleryCars(getGalleryCars());
    };
    handleGalleryChanged();
    window.addEventListener('wds_gallery_changed', handleGalleryChanged);
    return () => window.removeEventListener('wds_gallery_changed', handleGalleryChanged);
  }, []);

  // Sync Community Stats & Total Members when changed by any admin
  useEffect(() => {
    const handleStatsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<CommunityStats>;
      if (customEvent.detail) {
        setCommunityStats(customEvent.detail);
      } else {
        setCommunityStats(getCommunityStats());
      }
    };
    window.addEventListener('wds_community_stats_changed', handleStatsChanged);
    return () => window.removeEventListener('wds_community_stats_changed', handleStatsChanged);
  }, []);

  // Whenever raw text changes, automatically attempt smart parse preview
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedPreviewNames([]);
      return;
    }
    const res = parseAttendanceDetailed(rawText);
    setParsedPreviewNames(res.names);
    if (res.inferredDate) {
      setSessionDate(res.inferredDate);
    }
    if (res.inferredTitle && res.inferredTitle !== sessionTitle) {
      setSessionTitle(res.inferredTitle);
    }
    if (res.inferredTime) {
      setSessionTime(res.inferredTime);
    }
  }, [rawText]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    const ADMIN_ACCOUNTS: Record<string, { pass: string; name: string }> = {
      'pmarkwelly@gmail.com': { pass: 'Mark2006', name: 'WDS Administrator' },
      'tmsi20200048.bobihis@gmail.com': { pass: 'Chen123', name: 'WDS Admin (Bobihis)' },
      'carxhyperspeedlegend@gmail.com': { pass: 'qwerty', name: 'WDS Admin (CarX)' },
      'ggmaybisaya@gmail.com': { pass: 'Bisaya09', name: 'WDS Admin' },
      'rockhardmiso@gmail.com': { pass: 'stiffymiso19', name: 'WDS Admin' },
      'nunoocpm680@gmail.com': { pass: 'nunoo021', name: 'WDS Admin' },
      'vinsinitykamidsa@gmail.com': { pass: 'Hachimura', name: 'Hachimura (Admin)' }
    };

    const admin = ADMIN_ACCOUNTS[cleanEmail];
    
    if (admin && password === admin.pass) {
      sessionStorage.setItem('wds_admin_auth', 'true');
      setActiveUser({
        role: 'admin',
        identifier: email.trim(),
        name: admin.name,
        verifiedAt: Date.now()
      }, true);
      setIsLoggedIn(true);
      setLoginError('');
      showToast(`Authenticated as ${admin.name}`);
      loginAdmin(cleanEmail, password).catch(() => {});
    } else {
      setLoginError('Invalid credentials. Access denied.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('wds_admin_auth');
    setActiveUser(null);
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  // --- MANUAL MEMBER CRUD HANDLERS ---

  const handleOpenAddModal = () => {
    setAddForm({
      name: '',
      joinDate: getTodayDateString(),
      lastSeen: getTodayDateString(),
      attendanceCount: 1,
      rankOrRole: 'WDS Member',
      favoriteCar: '',
      notes: ''
    });
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleCreateMember = (e: FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.name.trim()) {
      setAddError('In-Game Name (IGN) is required.');
      return;
    }

    const res = addMemberManually({
      name: addForm.name,
      joinDate: addForm.joinDate,
      lastSeen: addForm.lastSeen,
      attendanceCount: Number(addForm.attendanceCount) || 1,
      rankOrRole: addForm.rankOrRole,
      favoriteCar: addForm.favoriteCar,
      notes: addForm.notes
    });

    if (res.success && res.member) {
      setMembers(res.members);
      setIsAddModalOpen(false);
      showToast(`Member "${res.member.name}" added successfully to roster.`);
    } else {
      setAddError(res.error || 'Failed to add member.');
    }
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      joinDate: member.joinDate || getTodayDateString(),
      lastSeen: member.lastSeen || getTodayDateString(),
      attendanceCount: member.attendanceCount || 0,
      rankOrRole: member.rankOrRole || 'WDS Member',
      favoriteCar: member.favoriteCar || '',
      notes: member.notes || ''
    });
    setEditError('');
  };

  const handleUpdateMember = (e: FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditError('');

    if (!editForm.name.trim()) {
      setEditError('In-Game Name (IGN) is required.');
      return;
    }

    const res = updateMemberManually(editingMember.id, {
      name: editForm.name,
      joinDate: editForm.joinDate,
      lastSeen: editForm.lastSeen,
      attendanceCount: Number(editForm.attendanceCount) || 0,
      rankOrRole: editForm.rankOrRole,
      favoriteCar: editForm.favoriteCar,
      notes: editForm.notes
    });

    if (res.success && res.member) {
      setMembers(res.members);
      setEditingMember(null);
      showToast(`Member "${res.member.name}" updated successfully.`);
    } else {
      setEditError(res.error || 'Failed to update member.');
    }
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;
    const res = deleteMemberManually(deletingMember.id);
    if (res.success) {
      setMembers(res.members);
      showToast(`Member "${deletingMember.name}" removed from roster.`);
    }
    setDeletingMember(null);
  };

  const handleQuickIncrementAttendance = (member: Member) => {
    const today = getTodayDateString();
    const res = updateMemberManually(member.id, {
      name: member.name,
      joinDate: member.joinDate,
      lastSeen: today,
      attendanceCount: (member.attendanceCount || 0) + 1,
      rankOrRole: member.rankOrRole,
      favoriteCar: member.favoriteCar,
      notes: member.notes
    });
    if (res.success) {
      setMembers(res.members);
      showToast(`Marked ${member.name} active today (+1 attendance).`);
    }
  };

  const handleCleanAndOrganizeAll = () => {
    const res = cleanAndOrganizeAllMembers();
    setMembers(res.members);
    setAttendanceRecords(res.records);
    setSortBy('name');
    showToast(`Cleaned and organized all ${res.members.length} members from A to Z!`);
  };

  const handleResetAllAttendance = () => {
    if (window.confirm('Reset all attendance data and clear the entire member roster? This makes the database empty so you can paste a fresh roll call.')) {
      resetAllAttendanceData();
      setMembers([]);
      setAttendanceRecords([]);
      setParsedPreviewNames([]);
      setRawText('');
      setParseResult(null);
      showToast('Attendance data reset to empty. Ready for new roll call paste.');
    }
  };

  // --- COMMUNITY STATS & TOTAL MEMBERS MANAGEMENT ---

  const handleOpenTotalMembersModal = () => {
    setEditTotalMembersForm({
      totalMembers: communityStats.totalMembers,
      useManualCount: communityStats.useManualCount
    });
    setIsTotalMembersModalOpen(true);
  };

  const handleSaveTotalMembers = (e: FormEvent) => {
    e.preventDefault();
    const count = Math.max(0, parseInt(String(editTotalMembersForm.totalMembers), 10) || 0);
    const updated: CommunityStats = {
      totalMembers: count,
      useManualCount: editTotalMembersForm.useManualCount
    };
    saveCommunityStats(updated);
    setCommunityStats(updated);
    setIsTotalMembersModalOpen(false);
    showToast(`Updated Total Members to ${updated.useManualCount ? updated.totalMembers : members.length}!`);
  };

  const handleOpenAddVideo = () => {
    setEditingVideoId(null);
    setVideoFormError('');
    setVideoForm({ url: '', title: '', description: '' });
  };

  const handleOpenEditVideo = (video: FeaturedVideo) => {
    setEditingVideoId(video.id);
    setVideoFormError('');
    setVideoForm({
      url: video.url,
      title: video.title || '',
      description: video.description || ''
    });
  };

  const handleGalleryFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setToast({ message: 'Please select a valid image or video file.', type: 'error' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setToast({ message: 'Image size must be less than 10MB.', type: 'error' });
        return;
      }
      
      const readableSize = file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      setGallerySelectedFileName(file.name);
      setGallerySelectedFileSize(readableSize);
      setIsGalleryFormLoading(true);
      setGallerySuccessBanner(null);

      try {
        const compressedUrl = await compressGalleryImage(file);
        setGalleryForm(prev => ({ ...prev, imageUrl: compressedUrl }));
        setToast({ message: 'Picture loaded and optimized successfully!', type: 'success' });
      } catch (err) {
        setToast({ message: 'Error processing media file. Please try again.', type: 'error' });
      } finally {
        setIsGalleryFormLoading(false);
      }
    }
  };

  const handleSaveGallery = async (e: FormEvent) => {
    e.preventDefault();
    if (!galleryForm.imageUrl || !galleryForm.carName || !galleryForm.ownerName) {
      setToast({ message: 'Please fill out all fields and provide an image/video.', type: 'error' });
      return;
    }

    setIsGallerySaving(true);
    try {
      const newCar: GalleryCar = {
        id: `car-${Date.now()}`,
        imageUrl: galleryForm.imageUrl,
        carName: galleryForm.carName.trim(),
        ownerName: galleryForm.ownerName.trim(),
        type: gallerySourceMode,
        createdAt: Date.now()
      };

      saveGalleryCars([...galleryCars, newCar]);
      
      const successText = `Uploaded successfully! "${newCar.carName}" for ${newCar.ownerName} is now live in the showcase.`;
      setGallerySuccessBanner(successText);
      setToast({ message: 'Uploaded successfully! Car added to showcase.', type: 'success' });

      // Reset form
      setGalleryForm({ imageUrl: '', carName: '', ownerName: '', type: 'embed' });
      setGallerySelectedFileName('');
      setGallerySelectedFileSize('');
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    } catch (error) {
      setToast({ message: 'Failed to add car to gallery. Please try again.', type: 'error' });
    } finally {
      setIsGallerySaving(false);
    }
  };

  const handleDeleteGallery = (id: string) => {
    if (window.confirm('Are you sure you want to remove this car from the gallery?')) {
      saveGalleryCars(galleryCars.filter(c => c.id !== id));
      setToast({ message: 'Car removed from gallery.', type: 'success' });
    }
  };

  const handleSaveVideo = (e: FormEvent) => {
    e.preventDefault();
    setIsVideoFormLoading(true);
    setVideoFormError('');

    const formattedUrl = formatVideoEmbedUrl(videoForm.url);
    if (!formattedUrl) {
      setVideoFormError("Please provide a valid video link (YouTube, TikTok, Streamable, Google Drive, or MP4 link).");
      setIsVideoFormLoading(false);
      return;
    }

    let updated: FeaturedVideo[];
    if (editingVideoId) {
      updated = featuredVideos.map(v => 
        v.id === editingVideoId 
          ? { 
              ...v, 
              type: 'embed' as const,
              url: formattedUrl, 
              title: videoForm.title.trim() || 'Community Montage', 
              description: videoForm.description.trim()
            } 
          : v
      );
      showToast('Featured Video updated successfully!');
    } else {
      const newVideo: FeaturedVideo = {
        id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'embed',
        url: formattedUrl,
        title: videoForm.title.trim() || 'Community Montage',
        description: videoForm.description.trim(),
        createdAt: new Date().toISOString()
      };
      updated = [newVideo, ...featuredVideos];
      showToast('New Featured Video added!');
    }

    saveFeaturedVideos(updated);
    setFeaturedVideos(updated);
    setEditingVideoId(null);
    setVideoForm({ url: '', title: '', description: '' });
    setIsVideoFormLoading(false);
  };

  const handleDeleteVideo = (id: string) => {
    if (confirm("Are you sure you want to remove this featured video?")) {
      const updated = featuredVideos.filter(v => v.id !== id);
      saveFeaturedVideos(updated);
      setFeaturedVideos(updated);
      if (editingVideoId === id) {
        setEditingVideoId(null);
        setVideoForm({ url: '', title: '', description: '' });
      }
      showToast('Featured Video removed.');
    }
  };

  const handleQuickAdjustTotalMembers = (delta: number) => {
    setEditTotalMembersForm(prev => ({
      ...prev,
      totalMembers: Math.max(0, (parseInt(String(prev.totalMembers), 10) || 0) + delta),
      useManualCount: true
    }));
  };

  // --- ATTENDANCE PROCESSOR ---

  const handleProcessAttendance = () => {
    if (!rawText.trim() && parsedPreviewNames.length === 0) return;
    
    const parsed = parseAttendanceDetailed(rawText);
    const namesToProcess = parsed.names.length > 0 ? parsed.names : parsedPreviewNames;
    
    if (namesToProcess.length === 0) {
      setParseError('No valid member names found. Please make sure entries are numbered (e.g. 1. Name or 14_Name).');
      return;
    }
    setParseError(null);

    const { record, members: updatedMembers, addedCount, updatedCount } = recordAttendanceSession(
      sessionDate,
      sessionTitle.trim() || `Attendance ${sessionDate}`,
      namesToProcess,
      rawText,
      sessionTime
    );

    setMembers(updatedMembers);
    setAttendanceRecords(getStoredAttendanceRecords());
    setParseResult({ added: addedCount, updated: updatedCount, title: record.title });
    setRawText('');
    setParsedPreviewNames([]);
    setSelectedPastDate(sessionDate);
    showToast(`Recorded attendance for ${sessionDate} (${namesToProcess.length} members present)`);
  };

  const handleDeleteSession = (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this past attendance record?')) {
      const { records, members: current } = deleteAttendanceRecord(recordId);
      setAttendanceRecords(records);
      setMembers(current);
      showToast('Attendance record deleted.');
    }
  };

  // --- TEAM & ABOUT US MANAGEMENT ---
  const handleOpenAddTeamModal = () => {
    setTeamForm({
      name: '',
      category: 'admin',
      roleTitle: 'Administrator',
      bio: '',
      imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&h=600&fit=crop',
      ign: '',
      cpmId: '',
      favoriteCar: '',
      socialLink: ''
    });
    setIsAddTeamModalOpen(true);
  };

  const handleOpenEditTeamModal = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamForm({
      name: member.name,
      category: member.category,
      roleTitle: member.roleTitle,
      bio: member.bio || '',
      imageUrl: member.imageUrl,
      ign: member.ign || '',
      cpmId: member.cpmId || '',
      favoriteCar: member.favoriteCar || '',
      socialLink: member.socialLink || ''
    });
  };


  const handleTeamAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size should be under 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // Compress the image so it fits comfortably within Firestore 1MB document limits
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_SIZE = 400;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setTeamForm(prev => ({ ...prev, imageUrl: compressedBase64 }));
            showToast('Image processed and uploaded successfully!', 'success');
          }
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTeamMember = (e: FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;

    let updated: TeamMember[];
    if (editingTeamMember) {
      updated = teamMembers.map(m => m.id === editingTeamMember.id ? {
        ...m,
        name: teamForm.name.trim(),
        category: teamForm.category,
        roleTitle: teamForm.roleTitle.trim() || 'Officer',
        bio: teamForm.bio.trim(),
        imageUrl: teamForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&h=600&fit=crop',
        ign: teamForm.ign.trim(),
        cpmId: teamForm.cpmId.trim(),
        favoriteCar: teamForm.favoriteCar.trim(),
        socialLink: teamForm.socialLink.trim()
      } : m);
      setEditingTeamMember(null);
      showToast(`Updated ${teamForm.name}!`);
    } else {
      const newMember: TeamMember = {
        id: `team-${Date.now()}`,
        name: teamForm.name.trim(),
        category: teamForm.category,
        roleTitle: teamForm.roleTitle.trim() || 'Officer',
        bio: teamForm.bio.trim(),
        imageUrl: teamForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&h=600&fit=crop',
        ign: teamForm.ign.trim(),
        cpmId: teamForm.cpmId.trim(),
        favoriteCar: teamForm.favoriteCar.trim(),
        socialLink: teamForm.socialLink.trim(),
        socialType: 'facebook'
      };
      updated = [...teamMembers, newMember];
      setIsAddTeamModalOpen(false);
      showToast(`Added ${newMember.name} to Team!`);
    }
    saveStoredTeamMembers(updated);
    setTeamMembers(updated);
  };

  const handleDeleteTeamMemberConfirm = () => {
    if (!deletingTeamMember) return;
    const updated = teamMembers.filter(m => m.id !== deletingTeamMember.id);
    saveStoredTeamMembers(updated);
    setTeamMembers(updated);
    setDeletingTeamMember(null);
    showToast(`Removed ${deletingTeamMember.name} from team.`);
  };

  const handleResetTeamToDefault = () => {
    if (window.confirm('Reset all Leadership profiles (Owner, Admins, Developer) to original defaults?')) {
      const defaults = resetTeamMembersToDefault();
      setTeamMembers(defaults);
      showToast('Reset Leadership team to defaults!');
    }
  };

  const handleCopyReport = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    showToast('Attendance report copied to clipboard!');
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  // Activity calculation for Selected Past Date
  const pastBreakdown = useMemo(() => {
    return getActivityBreakdownForDate(selectedPastDate, members, attendanceRecords, communityStats);
  }, [selectedPastDate, members, attendanceRecords, communityStats]);

  // Yesterday breakdown for quick KPI cards
  const yesterdayBreakdown = useMemo(() => {
    return getActivityBreakdownForDate(yesterdayStr, members, attendanceRecords, communityStats);
  }, [yesterdayStr, members, attendanceRecords, communityStats]);

  // Today breakdown for quick KPI cards
  const todayBreakdown = useMemo(() => {
    return getActivityBreakdownForDate(todayStr, members, attendanceRecords, communityStats);
  }, [todayStr, members, attendanceRecords, communityStats]);

  // Filtered and Sorted members for the Live Inactivity view
  const filteredMembers = useMemo(() => {
    const result = members.filter(m => {
      const q = deferredMemberSearch.trim().toLowerCase();
      const matchesSearch = !q || 
        m.name.toLowerCase().includes(q) ||
        (m.rankOrRole && m.rankOrRole.toLowerCase().includes(q)) ||
        (m.favoriteCar && m.favoriteCar.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const days = getDaysInactive(m.lastSeen);
      const isAttendedToday = m.attendanceHistory?.includes(todayStr) || m.lastSeen === todayStr;
      const isAttendedYesterday = m.attendanceHistory?.includes(yesterdayStr);

      switch (memberFilter) {
        case 'active-today':
          return isAttendedToday;
        case 'active-yesterday':
          return isAttendedYesterday;
        case 'inactive-yesterday':
          return !isAttendedYesterday;
        case 'warning':
          return days >= 3 && days < 7;
        case 'critical':
          return days >= 7;
        case 'all':
        default:
          return true;
      }
    });

    // Apply sorting
    return result.sort((a, b) => {
      if (sortBy === 'attendance') {
        return (b.attendanceCount || 0) - (a.attendanceCount || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'joined') {
        return new Date(b.joinDate || '2026-01-01').getTime() - new Date(a.joinDate || '2026-01-01').getTime();
      }
      // default: inactivity (most inactive first)
      return getDaysInactive(b.lastSeen) - getDaysInactive(a.lastSeen);
    });
  }, [members, memberFilter, deferredMemberSearch, sortBy, todayStr, yesterdayStr]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-32">
        <div className="rounded-2xl bg-white dark:bg-white/5 border-transparent dark:border-white/10 backdrop-blur-md p-6 sm:p-8 space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl dark:shadow-black/60">
          <div className="absolute top-[-50%] left-[-50%] w-full h-full rounded-full bg-red-500/5 dark:bg-white dark:bg-white/5 blur-[80px] pointer-events-none" />
          
          <div className="space-y-2.5 text-center relative z-10">
             <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 border-2 border-transparent dark:border-transparent dark:border-white/20 shadow-xl p-0.5">
               <img 
                 src="/received_1395385905883694.jpeg" 
                 alt="WDS Community Logo" 
                 className="w-full h-full object-cover rounded-xl"
                 referrerPolicy="no-referrer"
               />
             </div>
             <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Admin Portal</h2>
             <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">Attendance & Roster Intelligence</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-black/50 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white/30 transition-colors shadow-sm dark:shadow-none"
                placeholder="adminaccount@gmail.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-black/50 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl pl-4 pr-12 py-3 text-base sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white/30 transition-colors shadow-sm dark:shadow-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-white transition-colors p-1 flex items-center justify-center cursor-pointer active:scale-95"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {loginError && (
              <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm text-center font-medium bg-red-50 dark:bg-red-400/10 py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-400/20">{loginError}</p>
            )}

            <div className="pt-2 sm:pt-4">
              <button 
                type="submit"
                className="w-full min-h-[48px] px-6 py-3.5 sm:py-4 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10 dark:shadow-white/5"
              >
                <span>Authenticate</span> <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 space-y-6 sm:space-y-8">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-red-500/90 text-white border-red-400/50 shadow-red-500/20'
                : 'bg-neutral-900/95 text-white border-transparent dark:border-white/20 shadow-black/60'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-neutral-600 dark:text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-transparent dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-transparent dark:border-white/20 bg-neutral-100 dark:bg-white/10 shrink-0 shadow-lg shadow-white/5">
            <img 
              src="/received_1395385905883694.jpeg" 
              alt="WDS Community" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 shadow-lg shadow-emerald-900/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified Admin Access
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">Attendance & Roster Hub</h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
              Add, update, or remove members, track community activity, and inspect attendance records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <button 
            type="button"
            onClick={handleOpenAddModal}
            className="min-h-[42px] px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-white/10 active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member Manually</span>
          </button>

          <button 
            type="button"
            onClick={handleLogout}
            className="min-h-[42px] px-4 py-2 bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 border-transparent dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 dark:text-white transition-colors cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 xl:items-start">
        {/* Sidebar Navigation */}
        <div className="w-full xl:w-72 xl:sticky xl:top-8 shrink-0 z-10">
          <div className="flex xl:flex-col items-center xl:items-stretch gap-2 p-2 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] shadow-lg shadow-black/20 overflow-x-auto xl:overflow-visible custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('attendance-live')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'attendance-live'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Member Roster</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'attendance-live' ? 'bg-neutral-200 dark:bg-black/15' : 'bg-neutral-100 dark:bg-white/10'}`}>
                {members.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('past-records')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'past-records'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4" />
                <span>Past History</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'past-records' ? 'bg-neutral-200 dark:bg-black/15' : 'bg-neutral-100 dark:bg-white/10'}`}>
                {attendanceRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('parser')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'parser'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Record Attendance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Crown className={`w-4 h-4 ${activeTab === 'team' ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>Leadership</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'team' ? 'bg-neutral-200 dark:bg-black/15' : 'bg-neutral-100 dark:bg-white/10'}`}>
                {teamMembers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'applications'
                  ? 'bg-emerald-500 text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-4 h-4" />
                <span>Applications</span>
              </div>
              {applications.filter(a => a.status === 'pending').length > 0 && (
                <span className="bg-black/20 text-current px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {applications.filter(a => a.status === 'pending').length} New
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-red-500 text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4" />
                <span>Events Schedule</span>
              </div>
              {events.length > 0 && (
                <span className="bg-black/20 text-current px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {events.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-red-500 text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Featured Montage</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`min-h-[44px] px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-3 whitespace-nowrap cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-red-500 text-black shadow-lg'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white dark:bg-white/5'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Car Gallery</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6 sm:space-y-8">
          {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members (Editable Community Count) */}
        <div 
          onClick={() => {
            setActiveTab('attendance-live');
            setMemberFilter('all');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md space-y-1.5 hover:border-white/30 transition-all cursor-pointer group relative"
        >
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Total Members</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenTotalMembersModal();
                }}
                className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/10 hover:bg-emerald-500 hover:text-black text-neutral-700 dark:text-neutral-300 text-[10px] font-bold shadow-lg shadow-black/20 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Edit total community member count"
              >
                <Pencil className="w-3 h-3 text-emerald-400 group-hover:text-black" />
                <span>Edit</span>
              </button>
              <Users className="w-4 h-4 text-neutral-700 dark:text-neutral-300 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              {getEffectiveTotalMembers(communityStats, members)}
            </div>
            {communityStats.useManualCount && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-900/20 font-semibold">
                Custom
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center justify-between gap-1">
            <span>{members.length} in attendance roster</span>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenTotalMembersModal();
              }}
              className="text-emerald-400 hover:underline flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
            >
              Edit count <ChevronRight className="w-3 h-3" />
            </span>
          </p>
        </div>

        {/* Yesterday's Active */}
        <div 
          onClick={() => {
            setActiveTab('past-records');
            setSelectedPastDate(yesterdayStr);
            setPastViewMode('present');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md space-y-1.5 hover:border-emerald-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs">
            <span>Active Yesterday</span>
            <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {yesterdayBreakdown.activeCount}
          </div>
          <p className="text-[11px] text-emerald-400/80 flex items-center gap-1">
            <span>{yesterdayBreakdown.attendanceRate}% turn-out</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Yesterday's Not Active (Auto-Calculated) */}
        <div 
          onClick={() => {
            setActiveTab('past-records');
            setSelectedPastDate(yesterdayStr);
            setPastViewMode('absent');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md space-y-1.5 hover:border-transparent transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs">
            <span>Not Active Yesterday</span>
            <UserX className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">
            {yesterdayBreakdown.notActiveCount}
          </div>
          <p className="text-[11px] text-rose-400/80 flex items-center gap-1">
            <span>{100 - yesterdayBreakdown.attendanceRate}% missed</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>

        {/* Warning Inactive 3+ Days */}
        <div 
          onClick={() => {
            setActiveTab('attendance-live');
            setMemberFilter('warning');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md space-y-1.5 hover:border-transparent transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 text-xs">
            <span>At-Risk (3d+ Inactive)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {members.filter(m => getDaysInactive(m.lastSeen) >= 3).length}
          </div>
          <p className="text-[11px] text-amber-400/80 flex items-center gap-1">
            <span>Needs attention</span>
            <ChevronRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* TAB 1: Member Roster & Manual Member Management */}
      {activeTab === 'attendance-live' && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Filters, Sort, Auto-Organize, and Add Action */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-neutral-600 dark:text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search IGN, car, role, or notes..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-black/50 border border-transparent shadow-sm dark:shadow-lg rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-neutral-100 dark:bg-black/50 border border-transparent shadow-sm dark:shadow-lg rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="inactivity">Inactivity</option>
                  <option value="attendance">Total Present</option>
                  <option value="joined">Join Date</option>
                </select>
              </div>
            </div>

            {/* Quick Actions (Clean A-Z, Reset Data, & Add) */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleResetAllAttendance}
                className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 shadow-lg shadow-rose-900/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                title="Reset and clear all attendance data to empty"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Reset Data</span>
              </button>

              <button
                type="button"
                onClick={handleCleanAndOrganizeAll}
                className="px-3.5 py-2.5 bg-white dark:bg-white/10 border-transparent dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 text-neutral-900 dark:text-white shadow-sm dark:shadow-lg rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                title="Clean all gamer tags, remove unwanted symbols/numbering, and organize strictly A to Z"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Organize A to Z</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-500/10 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setMemberFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                memberFilter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white shadow-sm dark:shadow-lg border border-transparent'
              }`}
            >
              All ({members.length})
            </button>

            <button
              type="button"
              onClick={() => setMemberFilter('active-yesterday')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                memberFilter === 'active-yesterday'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-lg shadow-emerald-900/20'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Active Yesterday ({yesterdayBreakdown.activeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMemberFilter('inactive-yesterday')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                memberFilter === 'inactive-yesterday'
                  ? 'bg-rose-600 dark:bg-rose-500 text-white'
                  : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 shadow-lg shadow-rose-900/20'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Not Active Yesterday ({yesterdayBreakdown.notActiveCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMemberFilter('active-today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                memberFilter === 'active-today'
                  ? 'bg-white text-black'
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white shadow-sm dark:shadow-lg border border-transparent'
              }`}
            >
              Active Today ({todayBreakdown.activeCount})
            </button>

            <button
              type="button"
              onClick={() => setMemberFilter('warning')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                memberFilter === 'warning'
                  ? 'bg-amber-400 text-black'
                  : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-lg shadow-amber-900/20'
              }`}
            >
              3d+ Inactive
            </button>
          </div>

          {/* Clean Interactive Hint */}
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hover name on desktop or tap on mobile to open member features</span>
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              {filteredMembers.length} displayed
            </span>
          </div>

          {/* Member List Grid (Interactive Hover & Mobile Tap Accordion) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
            {filteredMembers.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-2xl border-dashed border-transparent dark:border-white/10 shadow-lg bg-neutral-50 dark:bg-white/[0.02] space-y-4">
                <Users className="w-10 h-10 text-neutral-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {members.length === 0 ? 'Attendance Roster is Empty' : 'No Members Match Filter'}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    {members.length === 0
                      ? 'The attendance database is clean and empty. Paste your daily roll call text to register members and record history.'
                      : 'Try adjusting your search query or clear the filter.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {members.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('parser')}
                      className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-neutral-200 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Paste New Roll Call</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-white dark:bg-white/10 border-transparent dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 text-neutral-900 dark:text-white shadow-sm dark:shadow-lg rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Member Manually</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredMembers.map((member, idx) => {
                const days = getDaysInactive(member.lastSeen);
                const attendedYesterday = member.attendanceHistory?.includes(yesterdayStr);
                const attendedToday = member.attendanceHistory?.includes(todayStr) || member.lastSeen === todayStr;
                const isExpanded = member.id === expandedMemberId || member.id === hoveredMemberId;

                return (
                  <div
                    key={member.id}
                    onMouseEnter={() => setHoveredMemberId(member.id)}
                    onMouseLeave={() => setHoveredMemberId(null)}
                    onClick={() => {
                      setExpandedMemberId(prev => (prev === member.id ? null : member.id));
                    }}
                    className={`rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-md select-none ${
                      isExpanded
                        ? 'bg-neutral-900/90 border-emerald-500/40 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                        : 'bg-neutral-100 dark:bg-white/[0.04] hover:bg-white/[0.07] border-transparent dark:border-white/10 hover:border-transparent dark:border-white/20'
                    }`}
                  >
                    {/* Compact Card Header (Always Visible) */}
                    <div className="p-4 sm:p-4.5 space-y-2">
                      <div className="flex items-center justify-between gap-2.5">
                        {/* Member Index & IGN / Name */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-colors ${
                            isExpanded
                              ? 'bg-emerald-400 text-black shadow-sm'
                              : 'bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className={`text-base font-bold truncate transition-colors ${
                                isExpanded ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
                              }`}>
                                {member.name}
                              </h3>
                              {member.rankOrRole && (
                                <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/10 text-[9px] font-semibold text-neutral-700 dark:text-neutral-300 shadow-lg shadow-black/20 truncate max-w-[120px]">
                                  {member.rankOrRole}
                                </span>
                              )}
                            </div>
                            {!isExpanded && (
                              <p className="text-[10px] text-neutral-600 dark:text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                                <span>{member.attendanceCount} present</span>
                                <span>•</span>
                                <span className="text-neutral-500">Tap / hover for features</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Status Badge & Expand Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-all shadow-lg ${
                            days === 0
                              ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-900/20'
                              : days < 3
                                ? 'bg-red-500/20 text-red-300 shadow-red-900/20'
                                : days < 7
                                  ? 'bg-amber-500/20 text-amber-300 shadow-amber-900/20'
                                  : 'bg-rose-500/20 text-rose-400 shadow-rose-900/20'
                          }`}>
                            {days === 0 ? 'Active Today' : `${days}d inactive`}
                          </span>

                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isExpanded ? 'bg-emerald-500/20 text-emerald-400 rotate-180' : 'bg-white dark:bg-white/5 text-neutral-600 dark:text-neutral-400'
                          }`}>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Feature Panel (Revealed on Hover or Mobile Tap) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="border-t border-transparent dark:border-white/10 bg-black/40 px-4 sm:px-4.5 pb-4 pt-3.5 space-y-3.5"
                        >
                          {/* Member Detailed Information */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] shadow-lg shadow-black/20 space-y-0.5">
                              <span className="text-[10px] text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">Joined Date</span>
                              <span className="text-neutral-900 dark:text-white font-medium text-[11px] font-mono">{member.joinDate}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] shadow-lg shadow-black/20 space-y-0.5">
                              <span className="text-[10px] text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">Last Active</span>
                              <span className="text-neutral-900 dark:text-white font-medium text-[11px] font-mono">{formatDisplayDate(member.lastSeen)}</span>
                            </div>
                          </div>

                          {/* Attendance Status & Turnout */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-neutral-50 dark:bg-white/[0.02] shadow-lg shadow-black/20">
                              <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">Yesterday Status:</span>
                              {attendedYesterday ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md shadow-lg shadow-emerald-900/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Present Yesterday
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                  <UserX className="w-3 h-3" />
                                  Absent Yesterday
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-neutral-50 dark:bg-white/[0.02] shadow-lg shadow-black/20">
                              <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">Total Present:</span>
                              <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                {member.attendanceCount} present
                              </span>
                            </div>
                          </div>

                          {/* Optional Info: Favorite Car & Notes */}
                          {(member.favoriteCar || member.notes) && (
                            <div className="space-y-1.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] shadow-lg shadow-black/20 text-xs">
                              {member.favoriteCar && (
                                <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200 text-[11px]">
                                  <Car className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0" />
                                  <span className="truncate">{member.favoriteCar}</span>
                                </div>
                              )}
                              {member.notes && (
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 italic">
                                  "{member.notes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Full Action Toolbar (Check-in, Edit, Delete) */}
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-transparent dark:border-white/10 flex items-center justify-between gap-2"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickIncrementAttendance(member);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 shadow-lg shadow-emerald-900/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                              title="Mark active today and increment attendance count by 1"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Check-in</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(member);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white shadow-lg shadow-black/20 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                                title="Edit Profile & Gamer Tag"
                              >
                                <Pencil className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingMember(member);
                                }}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 shadow-lg shadow-rose-900/20 transition-colors cursor-pointer active:scale-95"
                                title="Delete Member from Roster"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Past Attendance History & Date Breakdown */}
      {activeTab === 'past-records' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: List of Past Attendance Sessions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Attendance Sessions</span>
              </h2>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{attendanceRecords.length} recorded</span>
            </div>

            {/* Quick Date Shortcuts */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPastDate(yesterdayStr)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedPastDate === yesterdayStr
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-white dark:bg-white/5 hover:bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border-transparent dark:border-white/10'
                }`}
              >
                Yesterday ({yesterdayStr.slice(5)})
              </button>
              <button
                type="button"
                onClick={() => setSelectedPastDate(todayStr)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  selectedPastDate === todayStr
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-white dark:bg-white/5 hover:bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border-transparent dark:border-white/10'
                }`}
              >
                Today ({todayStr.slice(5)})
              </button>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {attendanceRecords.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-transparent dark:border-white/10 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] text-xs text-neutral-600 dark:text-neutral-400">
                  No attendance history yet. Use the parser tab to paste logs.
                </div>
              ) : (
                attendanceRecords.map(record => {
                  const isSelected = selectedPastDate === record.date;
                  return (
                    <div
                      key={record.id}
                      onClick={() => setSelectedPastDate(record.date)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-white/15 border-white/40 shadow-xl'
                          : 'bg-white dark:bg-white/5 hover:bg-neutral-100 dark:bg-white/10 border-transparent dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-400 block mb-0.5">
                            {formatDisplayDate(record.date)}
                          </span>
                          <h4 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-1">{record.title}</h4>
                        </div>
                        <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest shrink-0">
                          {record.attendees.length} present
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                        <span>{record.timeRange || 'Roll Call'}</span>
                        <span className="text-neutral-500">
                          {record.absentees ? `${record.absentees.length} missed` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: In-Depth Date Breakdown (Active Yesterday vs Inactive Yesterday) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl space-y-6">
              {/* Session Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-transparent dark:border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/10 shadow-sm dark:shadow-lg dark:shadow-black/20 text-neutral-900 dark:text-white text-xs font-bold">
                      {formatDisplayDate(selectedPastDate)}
                    </span>
                    {selectedPastDate === yesterdayStr && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-900/20 text-[11px] font-semibold">
                        Yesterday's Session
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {pastBreakdown.sessionRecord?.title || `Attendance for ${selectedPastDate}`}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2 flex-wrap">
                    <span>{pastBreakdown.sessionRecord?.timeRange || 'Daily Roll Call'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{pastBreakdown.activeCount} Active</span>
                    <span>•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{pastBreakdown.notActiveCount} Not Active</span>
                    <span>•</span>
                    <span>{pastBreakdown.totalMembersCount} Total Community ({pastBreakdown.attendanceRate}% turn-out)</span>
                  </p>
                </div>

                {/* Actions & Report Copy */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `📋 WDS ATTENDANCE REPORT (${formatDisplayDate(selectedPastDate)})\n📊 Total Community Members: ${pastBreakdown.totalMembersCount}\n\n✅ ACTIVE (${pastBreakdown.activeCount} members - ${pastBreakdown.attendanceRate}%):\n${pastBreakdown.presentMembers.map((p, i) => `${i + 1}. ${p.member.name}`).join('\n')}\n\n❌ NOT ACTIVE / INACTIVE (${pastBreakdown.notActiveCount} members - ${100 - pastBreakdown.attendanceRate}%):\n${pastBreakdown.absentMembers.map((a, i) => `${i + 1}. ${a.member.name}`).join('\n')}`;
                      handleCopyReport(text, 'full');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-neutral-50 dark:hover:bg-white/15 border border-transparent shadow-sm dark:shadow-lg text-xs font-medium text-neutral-700 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                    <span>{copiedStatus === 'full' ? 'Copied Report!' : 'Copy Community Report'}</span>
                  </button>

                  {pastBreakdown.sessionRecord && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(pastBreakdown.sessionRecord!.id)}
                      className="p-2 rounded-xl bg-white dark:bg-white/5 hover:bg-red-500/20 shadow-lg shadow-black/20 text-neutral-600 dark:text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete this record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-Tabs: All / Active (Present) / Inactive (Absent) */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 shadow-lg shadow-black/20">
                  <button
                    type="button"
                    onClick={() => setPastViewMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      pastViewMode === 'all'
                        ? 'bg-white text-black'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                    }`}
                  >
                    All Members ({pastBreakdown.totalMembersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPastViewMode('present')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      pastViewMode === 'present'
                        ? 'bg-emerald-400 text-black'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Active ({pastBreakdown.activeCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPastViewMode('absent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      pastViewMode === 'absent'
                        ? 'bg-rose-600 dark:bg-rose-500 text-white'
                        : 'text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Not Active / Absent ({pastBreakdown.notActiveCount})</span>
                  </button>
                </div>

                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  Showing: <strong className="text-neutral-900 dark:text-white">{pastViewMode.toUpperCase()}</strong>
                </span>
              </div>

              {/* Breakdown List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {/* Present Members */}
                {(pastViewMode === 'all' || pastViewMode === 'present') && (
                  pastBreakdown.presentMembers.map((item, idx) => (
                    <div
                      key={`present-${item.member.id}-${idx}`}
                      className="p-3.5 rounded-xl bg-emerald-500/5 shadow-lg shadow-emerald-900/20 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white text-sm truncate">{item.member.name}</span>
                        </div>
                        <span className="text-[10px] text-neutral-600 dark:text-neutral-400 ml-7 block">
                          Total attendances: {item.member.attendanceCount}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0 shadow-lg shadow-emerald-900/20">
                        PRESENT
                      </span>
                    </div>
                  ))
                )}

                {/* Absent Members */}
                {(pastViewMode === 'all' || pastViewMode === 'absent') && (
                  pastBreakdown.absentMembers.map((item, idx) => (
                    <div
                      key={`absent-${item.member.id}-${idx}`}
                      className="p-3.5 rounded-xl bg-rose-500/5 shadow-lg shadow-rose-900/20 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-neutral-700 dark:text-neutral-300 text-sm truncate">{item.member.name}</span>
                        </div>
                        <span className="text-[10px] text-neutral-600 dark:text-neutral-500 ml-7 block">
                          Last seen: {formatDisplayDate(item.member.lastSeen)}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-bold shrink-0 shadow-lg shadow-rose-900/20">
                        ABSENT
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Raw Text Log Accordion */}
              {pastBreakdown.sessionRecord?.rawText && (
                <div className="p-4 rounded-2xl bg-white dark:bg-black/50 border-transparent dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-300">
                      <FileText className="w-3.5 h-3.5" />
                      Original Attendance Raw Log
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReport(pastBreakdown.sessionRecord!.rawText!, 'raw')}
                      className="text-neutral-700 hover:text-neutral-900 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white underline cursor-pointer text-[11px]"
                    >
                      {copiedStatus === 'raw' ? 'Copied!' : 'Copy raw text'}
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-950 p-3 rounded-xl overflow-x-auto max-h-36 custom-scrollbar whitespace-pre-wrap border border-transparent">
                    {pastBreakdown.sessionRecord.rawText}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bulk Attendance Parser & Recorder */}
      {activeTab === 'parser' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Paste Form */}
          <div className="lg:col-span-7 space-y-5 rounded-3xl bg-white dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-transparent dark:border-white/10">
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Bulk Attendance Parser</span>
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                  Paste your daily roll call from CPM Discord, Messenger, or Facebook group.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAllAttendance}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-transparent shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0"
                title="Reset database to empty"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Reset Data to Empty</span>
              </button>
            </div>

            {/* Session Metadata Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Quick Date
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSessionDate(getTodayDateString())}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                      sessionDate === getTodayDateString()
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white'
                        : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-transparent dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-neutral-100 dark:bg-white/10'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionDate(getYesterdayDateString())}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                      sessionDate === getYesterdayDateString()
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white'
                        : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-transparent dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-neutral-100 dark:bg-white/10'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Time Range
                </label>
                <input
                  type="text"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  placeholder="e.g. 7:00 PM - 10:00 PM"
                  className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Session Title / Meet Name
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. ATTENDANCE AUG. 26 - Tunnel Pulls Meet"
                className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
              />
            </div>

            {/* Raw Text Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Raw Attendance Text Log
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setParsedPreviewNames([]);
                    }}
                    className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                  >
                    Clear text
                  </button>
                )}
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={9}
                className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30 transition-colors font-mono text-xs sm:text-sm resize-none"
                placeholder={`Paste your list here, for example:\n\nATTENDANCE ROLL CALL\n1. WDS_MARK\n2. WDS_VIPER\n3. CHEN\n4. OREO\n...`}
              />
            </div>

            <button
              type="button"
              onClick={handleProcessAttendance}
              className="w-full min-h-[48px] px-6 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Record & Save to Past History ({sessionDate})</span>
            </button>

            {parseError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-transparent text-xs sm:text-sm text-red-600 dark:text-red-400 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Attendance Parsing Notice
                </p>
                <p className="text-red-700 dark:text-red-300/80">
                  {parseError}
                </p>
              </div>
            )}

            {parseResult && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-transparent text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully logged attendance for "{parseResult.title}"
                </p>
                <p className="text-emerald-800 dark:text-emerald-300/80">
                  {parseResult.added} new members registered, {parseResult.updated} existing members marked present.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Live Detection Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-transparent dark:border-white/10">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-neutral-900 dark:text-white text-base flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Detected Attendees (A to Z)
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Auto-cleaned & sorted alphabetically
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono text-xs font-bold border border-transparent">
                  {parsedPreviewNames.length} names
                </span>
              </div>

              {parsedPreviewNames.length > 0 && (
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-neutral-100 dark:bg-black/40 border-transparent dark:border-white/5 text-center">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-neutral-600 dark:text-neutral-400 font-semibold uppercase">Total Members</div>
                    <div className="text-sm font-extrabold text-neutral-900 dark:text-white">{getEffectiveTotalMembers(communityStats, members)}</div>
                  </div>
                  <div className="space-y-0.5 border-x border-transparent dark:border-white/10">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Active Today</div>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{parsedPreviewNames.length}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-rose-600 dark:text-rose-600 dark:text-rose-400 font-semibold uppercase">Auto Not Active</div>
                    <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                      {Math.max(0, getEffectiveTotalMembers(communityStats, members) - parsedPreviewNames.length)}
                    </div>
                  </div>
                </div>
              )}

              {parsedPreviewNames.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400 border border-dashed border-transparent dark:border-transparent dark:border-white/10 rounded-2xl">
                  Paste attendance log on the left to see live extracted names.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                  {parsedPreviewNames.map((name, i) => {
                    const isExisting = members.some(m => m.name.toUpperCase() === name.toUpperCase());
                    return (
                      <div
                        key={`${name}-${i}`}
                        className="p-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border-transparent dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-neutral-200 dark:bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white">{name}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          isExisting
                            ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-transparent'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-transparent'
                        }`}>
                          {isExisting ? 'Existing Member' : 'New Member'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Team & Leadership Management (About Us) */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">Leadership Directory</h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Manage Owner, Admin, and Developer profiles shown on the About Us page.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResetTeamToDefault}
                className="min-h-[40px] px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-white dark:bg-white/5 dark:hover:bg-neutral-100 dark:bg-white/10 text-neutral-700 hover:text-neutral-900 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-white border border-transparent shadow-sm rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reset to initial leadership profiles"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddTeamModal}
                className="min-h-[40px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Leader / Officer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map(member => (
              <div
                key={member.id}
                className="rounded-3xl shadow-lg shadow-black/5 dark:shadow-black/20 bg-white dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 backdrop-blur-xl p-5 sm:p-6 space-y-4 hover:border-transparent dark:hover:border-transparent dark:border-white/20 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md bg-neutral-100 dark:bg-black/50 shrink-0 border border-transparent">
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white text-base">{member.name}</h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-700 dark:text-neutral-300 font-medium">{member.roleTitle}</p>
                        {member.ign && (
                          <span className="inline-block text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                            IGN: {member.ign}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] uppercase font-bold tracking-widest ${
                      member.category === 'owner'
                        ? 'text-amber-600 dark:text-amber-500'
                        : member.category === 'developer'
                        ? 'text-cyan-600 dark:text-cyan-500'
                        : 'text-emerald-600 dark:text-emerald-500'
                    }`}>
                      {member.category}
                    </span>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-700 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  {member.favoriteCar && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      <Car className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Car: {member.favoriteCar}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-transparent dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTeamModal(member)}
                    className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-100 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-800 dark:text-white text-xs font-semibold transition-all border border-transparent flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingTeamMember(member)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all border border-rose-200 dark:border-transparent cursor-pointer"
                    title="Delete leader"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL: ADD MEMBER MANUALLY --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-neutral-900 border-transparent dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-transparent dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Add Member Manually</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Register a new player into WDS roster</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-100 dark:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-4">
                {/* IGN Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      In-Game Name / IGN <span className="text-emerald-600 dark:text-emerald-400">*</span>
                    </label>
                    {addForm.name.trim() && (
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-transparent">
                        Saved as: {cleanMemberName(addForm.name)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. WDS_TAKUMI, 14. TAKUMI, or CHEN"
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Numbers and symbols are automatically cleaned and normalized.
                  </p>
                </div>

                {/* Rank / Role & Initial Attendance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Rank / Role
                    </label>
                    <select
                      value={addForm.rankOrRole}
                      onChange={(e) => setAddForm({ ...addForm, rankOrRole: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30 cursor-pointer"
                    >
                      <option value="WDS Member">WDS Member</option>
                      <option value="Squad Leader">Squad Leader</option>
                      <option value="Core Member">Core Member</option>
                      <option value="VIP Drifter">VIP Drifter</option>
                      <option value="Officer">Officer</option>
                      <option value="Recruit">Recruit</option>
                      <option value="Veteran">Veteran</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Initial Present Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={addForm.attendanceCount}
                      onChange={(e) => setAddForm({ ...addForm, attendanceCount: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>
                </div>

                {/* Join Date & Last Seen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={addForm.joinDate}
                      onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Last Active Date
                    </label>
                    <input
                      type="date"
                      value={addForm.lastSeen}
                      onChange={(e) => setAddForm({ ...addForm, lastSeen: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>
                </div>

                {/* Favorite Car / Build */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Favorite Car / Build (Optional)
                  </label>
                  <input
                    type="text"
                    value={addForm.favoriteCar}
                    onChange={(e) => setAddForm({ ...addForm, favoriteCar: e.target.value })}
                    placeholder="e.g. Nissan Skyline GT-R R34 or Supra MK4"
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Admin Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    placeholder="e.g. Highway cruise regular, recommended by Oreo"
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                </div>

                {addError && (
                  <p className="text-red-600 dark:text-red-400 text-xs bg-red-500/10 border border-transparent p-3 rounded-xl">
                    {addError}
                  </p>
                )}

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-transparent dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white dark:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Add to Roster
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: EDIT MEMBER DETAILS --- */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-neutral-900 border-transparent dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-transparent dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Edit Member Details</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Update stats & info for {editingMember.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-100 dark:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateMember} className="space-y-4">
                {/* IGN Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      In-Game Name / IGN <span className="text-red-500">*</span>
                    </label>
                    {editForm.name.trim() && (
                      <span className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-200 dark:border-transparent">
                        Saved as: {cleanMemberName(editForm.name)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    required
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Prefix numbers, bullet points, and parentheses notes will automatically be stripped and normalized.
                  </p>
                </div>

                {/* Rank & Attendance Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Rank / Role
                    </label>
                    <select
                      value={editForm.rankOrRole}
                      onChange={(e) => setEditForm({ ...editForm, rankOrRole: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30 cursor-pointer"
                    >
                      <option value="WDS Member">WDS Member</option>
                      <option value="Squad Leader">Squad Leader</option>
                      <option value="Core Member">Core Member</option>
                      <option value="VIP Drifter">VIP Drifter</option>
                      <option value="Officer">Officer</option>
                      <option value="Recruit">Recruit</option>
                      <option value="Veteran">Veteran</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Total Present Count
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, attendanceCount: Math.max(0, editForm.attendanceCount - 1) })}
                        className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white dark:bg-white/5 dark:hover:bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white text-xs font-bold border border-transparent cursor-pointer"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={editForm.attendanceCount}
                        onChange={(e) => setEditForm({ ...editForm, attendanceCount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full text-center bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, attendanceCount: editForm.attendanceCount + 1 })}
                        className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white dark:bg-white/5 dark:hover:bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white text-xs font-bold border border-transparent cursor-pointer"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>

                {/* Join Date & Last Seen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={editForm.joinDate}
                      onChange={(e) => setEditForm({ ...editForm, joinDate: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        Last Active Date
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, lastSeen: getTodayDateString() })}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Set to Today
                      </button>
                    </div>
                    <input
                      type="date"
                      value={editForm.lastSeen}
                      onChange={(e) => setEditForm({ ...editForm, lastSeen: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>
                </div>

                {/* Favorite Car */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Favorite Car / Build
                  </label>
                  <input
                    type="text"
                    value={editForm.favoriteCar}
                    onChange={(e) => setEditForm({ ...editForm, favoriteCar: e.target.value })}
                    placeholder="e.g. BMW M3 G80 Touring"
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Admin Notes
                  </label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="e.g. Regular organizer for weekend highway pulls"
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                </div>

                {editError && (
                  <p className="text-red-600 dark:text-red-400 text-xs bg-red-500/10 border border-transparent p-3 rounded-xl">
                    {editError}
                  </p>
                )}

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-transparent dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2.5 rounded-xl border border-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white dark:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DELETE MEMBER CONFIRMATION --- */}
      <AnimatePresence>
        {deletingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-neutral-900 border border-transparent dark:border-transparent rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Remove Member from Roster?</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-neutral-900 dark:text-white underline">{deletingMember.name}</strong> ({deletingMember.attendanceCount} recorded attendances)?
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  This action will remove their profile from the active member database.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingMember(null)}
                  className="flex-1 py-2.5 rounded-xl border border-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white dark:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMember}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-600 dark:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: EDIT TOTAL COMMUNITY MEMBERS --- */}
      <AnimatePresence>
        {isTotalMembersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-neutral-900 border-transparent dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-900 dark:text-white border border-transparent">
                    <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Edit Total Members</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Set community size without adding names to attendance
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTotalMembersModalOpen(false)}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-100 dark:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTotalMembers} className="space-y-5">
                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                    Calculation Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Custom Manual Count */}
                    <div
                      onClick={() => setEditTotalMembersForm({ ...editTotalMembersForm, useManualCount: true })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        editTotalMembersForm.useManualCount
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                          : 'bg-neutral-50 dark:bg-white dark:bg-white/5 border-transparent dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-100 dark:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Custom Count
                        </span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          editTotalMembersForm.useManualCount ? 'border-emerald-500 bg-emerald-500' : 'border-transparent dark:border-white/30'
                        }`}>
                          {editTotalMembersForm.useManualCount && <Check className="w-2.5 h-2.5 text-white dark:text-black" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                        Type any custom community size number directly.
                      </p>
                    </div>

                    {/* Option 2: Sync with Roster */}
                    <div
                      onClick={() => setEditTotalMembersForm({ ...editTotalMembersForm, useManualCount: false, totalMembers: members.length })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        !editTotalMembersForm.useManualCount
                          ? 'bg-neutral-900/5 dark:bg-white/15 border-neutral-900/30 dark:border-white/40 shadow-sm'
                          : 'bg-neutral-50 dark:bg-white dark:bg-white/5 border-transparent dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-neutral-100 dark:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                          Sync with Roster
                        </span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          !editTotalMembersForm.useManualCount ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white' : 'border-transparent dark:border-white/30'
                        }`}>
                          {!editTotalMembersForm.useManualCount && <Check className="w-2.5 h-2.5 text-white dark:text-black" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                        Auto-match named entries ({members.length} members).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Number Input & Controls */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Total Community Members Count
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTotalMembersForm({
                          totalMembers: members.length,
                          useManualCount: true
                        });
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      Set to Named Roster ({members.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      value={editTotalMembersForm.totalMembers}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEditTotalMembersForm({
                          totalMembers: isNaN(val) ? 0 : Math.max(0, val),
                          useManualCount: true
                        });
                      }}
                      className="flex-1 bg-white dark:bg-black/70 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-2xl font-extrabold text-neutral-900 dark:text-white text-center focus:outline-none focus:border-emerald-500 tracking-wider font-mono shadow-sm"
                      required
                    />
                  </div>

                  {/* Quick Adjust Buttons */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                    {[-10, -5, -1, 1, 5, 10, 50].map((adj) => (
                      <button
                        key={adj}
                        type="button"
                        onClick={() => handleQuickAdjustTotalMembers(adj)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-300 border-transparent dark:border-white/10 text-xs font-mono font-bold cursor-pointer transition-colors shadow-sm"
                      >
                        {adj > 0 ? `+${adj}` : adj}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Helpful Note */}
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-transparent text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    This updates the public "Active Members" and "Total Members" counter instantly across the home page and admin dashboard.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-transparent dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsTotalMembersModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white dark:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Total Members</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* --- MODAL: ADD / EDIT TEAM MEMBER --- */}
      <AnimatePresence>
        {(isAddTeamModalOpen || editingTeamMember) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-neutral-900 border-transparent dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-transparent dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                      {editingTeamMember ? 'Edit Leadership Profile' : 'Add Team Member'}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Displayed on public About Us directory
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddTeamModalOpen(false);
                    setEditingTeamMember(null);
                  }}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-100 dark:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTeamMember} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Full / Display Name <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="e.g. Chen, Oreo, Mark"
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Leadership Role / Category
                    </label>
                    <select
                      value={teamForm.category}
                      onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value as TeamCategory })}
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30 cursor-pointer"
                    >
                      <option value="owner">Community Owner / Founder</option>
                      <option value="admin">Administrator / Officer</option>
                      <option value="developer">Platform Developer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Role Title
                    </label>
                    <input
                      type="text"
                      value={teamForm.roleTitle}
                      onChange={(e) => setTeamForm({ ...teamForm, roleTitle: e.target.value })}
                      placeholder="e.g. Founder & Community Owner"
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      CPM In-Game Name (IGN)
                    </label>
                    <input
                      type="text"
                      value={teamForm.ign}
                      onChange={(e) => setTeamForm({ ...teamForm, ign: e.target.value })}
                      placeholder="e.g. WDS_CHEN"
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      CPM ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={teamForm.cpmId}
                      onChange={(e) => setTeamForm({ ...teamForm, cpmId: e.target.value })}
                      placeholder="e.g. WDS-001"
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Favorite Car / Ride
                    </label>
                    <input
                      type="text"
                      value={teamForm.favoriteCar}
                      onChange={(e) => setTeamForm({ ...teamForm, favoriteCar: e.target.value })}
                      placeholder="e.g. Nissan Skyline GT-R R34"
                      className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">
                    Avatar Image (URL or Upload)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={teamForm.imageUrl}
                      onChange={(e) => setTeamForm({ ...teamForm, imageUrl: e.target.value })}
                      placeholder="Paste URL..."
                      className="flex-1 min-w-0 bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30 font-mono"
                    />
                    <label className="flex-shrink-0 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-white dark:bg-white/5 dark:hover:bg-neutral-100 dark:bg-white/10 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl text-xs font-semibold text-neutral-800 dark:text-white transition-colors cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleTeamAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {teamForm.imageUrl && teamForm.imageUrl.startsWith('data:image') && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pl-1">✓ Local image selected</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Bio & Description
                  </label>
                  <textarea
                    rows={3}
                    value={teamForm.bio}
                    onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                    placeholder="Describe their responsibilities, passions, or message to the community..."
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Facebook / Contact Link
                  </label>
                  <input
                    type="text"
                    value={teamForm.socialLink}
                    onChange={(e) => setTeamForm({ ...teamForm, socialLink: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="w-full bg-neutral-50 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-transparent dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddTeamModalOpen(false);
                      setEditingTeamMember(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white dark:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {editingTeamMember ? 'Save Profile' : 'Add Team Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DELETE TEAM MEMBER CONFIRMATION --- */}
      <AnimatePresence>
        {deletingTeamMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-neutral-900 border border-transparent dark:border-transparent rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Remove from Leadership?</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Are you sure you want to remove <strong className="text-neutral-900 dark:text-white underline">{deletingTeamMember.name}</strong> ({deletingTeamMember.roleTitle}) from the public About Us page?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingTeamMember(null)}
                  className="flex-1 py-2.5 rounded-xl border border-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white dark:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTeamMemberConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-600 dark:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Confirm Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="flex flex-col h-[750px] sm:h-[850px] bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl transition-colors">
          {/* Top Control Header */}
          <div className="p-4 sm:p-5 border-b border-transparent dark:border-white/10 bg-neutral-50/80 dark:bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Recruitment Command Center</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono font-bold">
                    {applications.length} Total
                  </span>
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Review applicant profiles, reply in real-time, schedule server tryouts, and auto-enroll drivers.
                </p>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                  placeholder="Search IGN, ID, or Code..."
                  className="w-full bg-neutral-100 dark:bg-black/50 border border-transparent dark:border-transparent dark:border-white/10 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-black/40 p-1 rounded-xl border-transparent dark:border-white/5">
                {(['all', 'pending', 'interviewing', 'approved', 'rejected'] as const).map(tabKey => (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setAppFilter(tabKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      appFilter === tabKey
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-300/50 dark:hover:bg-white dark:bg-white/5'
                    }`}
                  >
                    {tabKey === 'all' ? 'All' : tabKey}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left Sidebar: Applications List */}
            <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-transparent dark:border-white/10 flex flex-col overflow-y-auto custom-scrollbar bg-neutral-50/50 dark:bg-black/30 ${selectedApp ? 'hidden md:flex' : 'flex'}`}>
              {filteredApplications.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs space-y-2 my-auto">
                  <Inbox className="w-8 h-8 mx-auto opacity-30" />
                  <p>No applications match your filter.</p>
                </div>
              ) : (
                filteredApplications.map(app => {
                  const isSelected = selectedApp?.id === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedAppId(app.id)}
                      className={`text-left p-4 border-b border-transparent dark:border-white/5 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-neutral-100 dark:bg-white/10 border-l-4 border-l-emerald-500' 
                          : 'hover:bg-neutral-100 dark:hover:bg-white dark:bg-white/5 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-neutral-900 dark:text-neutral-900 dark:text-white text-sm truncate block">{app.ign}</span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 font-semibold">{app.trackingCode || 'WDS-APP'}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                          {new Date(app.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {app.playstyle && (
                          <span className="text-[10px] bg-neutral-200 dark:bg-white dark:bg-white/5 border-transparent dark:border-white/5 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]">
                            {app.playstyle}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ml-auto shrink-0 ${
                          app.status === 'pending' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-transparent' :
                          app.status === 'interviewing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-transparent' :
                          app.status === 'approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-transparent' :
                          'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-transparent'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      {app.messages && app.messages.length > 0 && (
                        <div className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400 truncate italic">
                          "{app.messages[app.messages.length - 1].text}"
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: Detailed Dossier & Live Two-Way Chat */}
            <div className={`flex flex-col bg-neutral-100/60 dark:bg-neutral-900/60 transition-all duration-300 ${!selectedApp ? 'hidden md:flex flex-1 relative' : (isAppChatExpanded ? 'fixed inset-0 z-[100] h-[100dvh]' : 'flex-1 relative flex')}`}>
              {selectedApp ? (
                <>
                  {/* Driver Header Banner */}
                  <div className="p-4 sm:p-5 border-b border-transparent dark:border-white/10 flex flex-wrap items-center justify-between bg-white/80 dark:bg-black/40 backdrop-blur-sm gap-3 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAppChatExpanded(!isAppChatExpanded)}
                        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        title={isAppChatExpanded ? "Collapse view" : "Expand to fullscreen"}
                      >
                        {isAppChatExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedAppId(null)}
                        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-transparent flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-extrabold text-lg shadow-lg">
                        {selectedApp.ign.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg">{selectedApp.ign}</h3>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-transparent px-2 py-0.5 rounded-md">
                            {selectedApp.trackingCode || 'WDS-TICKET'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-600 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span>CPM ID: <strong className="text-neutral-900 dark:text-white font-mono">{selectedApp.cpmId || 'Not Provided'}</strong></span>
                          <span>•</span>
                          <span>Applied: {new Date(selectedApp.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Contact & Action Buttons */}
                    <div className="flex items-center gap-2">
                      {selectedApp.contactInfo && (
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const raw = selectedApp.contactInfo.trim();
                            const url = raw.startsWith('http://') || raw.startsWith('https://') 
                              ? raw 
                              : raw.includes('facebook.com') 
                              ? `https://${raw}`
                              : `https://facebook.com/${raw.replace(/^@/, '')}`;
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                title="Open Facebook Profile to add to Squad Group Chat"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Facebook Profile</span>
                              </a>
                            );
                          })()}
                        </div>
                      )}

                      <span className={`text-xs font-bold px-3 py-1 rounded-xl uppercase ${
                        selectedApp.status === 'pending' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-transparent' :
                        selectedApp.status === 'interviewing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-transparent' :
                        selectedApp.status === 'approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-transparent' :
                        'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-transparent'
                      }`}>
                        {selectedApp.status}
                      </span>
                    </div>
                  </div>

                  {/* Applicant Details Info Strip */}
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-neutral-200/50 dark:bg-black/20 border-b border-transparent dark:border-white/5 text-xs ${isAppChatExpanded ? 'hidden sm:grid' : ''}`}>
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-neutral-50 dark:bg-white/[0.02] border-transparent dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">Playstyle</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate block">{selectedApp.playstyle || 'General Drifter'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-neutral-50 dark:bg-white/[0.02] border-transparent dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">Favorite Car</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate block">{selectedApp.favoriteCar || 'Not Specified'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-neutral-50 dark:bg-white/[0.02] border-transparent dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">Experience</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate block">{selectedApp.experienceLevel || 'Intermediate'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70 dark:bg-neutral-50 dark:bg-white/[0.02] border-transparent dark:border-white/5">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">Availability</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate block">{selectedApp.availability || 'Evenings (GMT+8)'}</span>
                    </div>
                  </div>

                  {/* Chat Messages History */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                    {/* Timestamp */}
                    <div className="flex justify-center">
                      <span className="text-[10px] bg-neutral-200 dark:bg-black/40 border-transparent dark:border-white/5 px-3 py-1 rounded-full text-neutral-600 dark:text-neutral-400 font-mono">
                        Ticket Created: {new Date(selectedApp.date).toLocaleString()}
                      </span>
                    </div>

                    {/* Tryout Banner if set */}
                    {selectedApp.tryoutSchedule && (
                      <div className="p-3.5 bg-emerald-500/10 border border-transparent rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span><strong>Scheduled Tryout / Meet:</strong> {selectedApp.tryoutSchedule}</span>
                        </div>
                      </div>
                    )}

                    {/* Message Thread */}
                    {(selectedApp.messages || []).map((msg: any) => {
                      const isApplicant = msg.sender === 'applicant';
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${isApplicant ? '' : 'flex-row-reverse'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isApplicant 
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-transparent' 
                              : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-transparent'
                          }`}>
                            {isApplicant ? selectedApp.ign.charAt(0).toUpperCase() : 'ADM'}
                          </div>

                          <div className={`rounded-2xl p-4 text-xs sm:text-sm max-w-[85%] sm:max-w-[75%] space-y-1 ${
                            isApplicant
                              ? 'bg-white dark:bg-white/5 border-transparent dark:border-white/5 text-neutral-800 dark:text-neutral-200 rounded-tl-sm shadow-sm'
                              : 'bg-neutral-800 text-white border border-neutral-700 dark:border-transparent dark:border-white/10 rounded-tr-sm shadow-md'
                          }`}>
                            <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                              <span className="font-bold">{msg.senderName || (isApplicant ? selectedApp.ign : 'Admin')}</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fast Admin Interactive Reply Box */}
                  <div className="p-3 bg-white/80 dark:bg-black/40 border-t border-transparent dark:border-white/10 shrink-0 space-y-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!adminChatText.trim()) return;
                        sendApplicationMessage(selectedApp.id, 'admin', 'WDS Recruiter', adminChatText.trim());
                        setApplications(getStoredApplications());
                        setAdminChatText('');
                        showToast('Reply beamed directly to applicant ticket.');
                      }}
                      className="flex items-center gap-2"
                    >
                      <textarea
                        rows={isAppChatExpanded ? 3 : 1}
                        value={adminChatText}
                        onChange={e => setAdminChatText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (adminChatText.trim()) {
                              sendApplicationMessage(selectedApp.id, 'admin', 'WDS Recruiter', adminChatText.trim());
                              setApplications(getStoredApplications());
                              setAdminChatText('');
                              showToast('Reply beamed directly to applicant ticket.');
                            }
                          }
                        }}
                        placeholder={`Reply directly to ${selectedApp.ign} (e.g. "Join room #5020 for tandem tryouts")...`}
                        className={`flex-1 bg-neutral-100 dark:bg-black/60 border border-transparent dark:border-transparent dark:border-white/10 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none custom-scrollbar resize-none ${isAppChatExpanded ? 'h-[80px]' : 'h-[40px]'}`}
                      />
                      <button
                        type="submit"
                        disabled={!adminChatText.trim()}
                        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 active:scale-95 shadow-md shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </form>

                    {/* Action Bar (Footer Actions) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 1-Click Approve & Add to Member Roster */}
                        <button
                          type="button"
                          onClick={() => {
                            // 1. Add to member list if not already present
                            const exists = members.some(m => m.name.toLowerCase() === selectedApp.ign.toLowerCase());
                            if (!exists) {
                              addMemberManually({
                                name: selectedApp.ign,
                                joinDate: getTodayDateString(),
                                lastSeen: getTodayDateString(),
                                attendanceCount: 1,
                                rankOrRole: 'WDS Member',
                                favoriteCar: selectedApp.favoriteCar || '',
                                notes: `Recruited via Application (${selectedApp.trackingCode || ''})`
                              });
                              setMembers(getStoredMembers());
                            }
                            // 2. Set status to approved with automated message
                            updateApplicationStatus(
                              selectedApp.id, 
                              'approved', 
                              '🎉 Welcome to World Driving Squad! Your application has been approved and you have been added to the active member roster. See you on the track!',
                              'WDS Recruitment Team'
                            );
                            setApplications(getStoredApplications());
                            showToast(`Driver ${selectedApp.ign} approved and enrolled into member roster!`, 'success');
                          }}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Add to Roster</span>
                        </button>

                        {/* Mark In Discussion / Interviewing */}
                        <button
                          type="button"
                          onClick={() => {
                            updateApplicationStatus(
                              selectedApp.id,
                              'interviewing',
                              'Hello! We received your application. We would like to invite you for a quick screening & tandem tryout.',
                              'WDS Recruiter'
                            );
                            setApplications(getStoredApplications());
                            showToast(`Marked ${selectedApp.ign} as Interviewing / In Discussion.`);
                          }}
                          className="px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-transparent font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Set In-Review / Chatting</span>
                        </button>

                        {/* Schedule Tryout Meet Prompt */}
                        <button
                          type="button"
                          onClick={() => {
                            const promptVal = window.prompt(
                              'Enter tryout meet details (e.g. Tonight 8:00 PM GMT+8 / Room #WDS-DRIFT):',
                              selectedApp.tryoutSchedule || 'Tonight at 8:00 PM (Room Code: #WDS-DRIFT)'
                            );
                            if (promptVal !== null && promptVal.trim()) {
                              updateApplicationStatus(
                                selectedApp.id,
                                'interviewing',
                                `📅 Tryout Scheduled: ${promptVal.trim()}`,
                                'WDS Recruitment Team',
                                promptVal.trim()
                              );
                              setApplications(getStoredApplications());
                              showToast(`Tryout scheduled for ${selectedApp.ign}!`);
                            }
                          }}
                          className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-transparent font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Schedule Tryout</span>
                        </button>

                        {/* Reject */}
                        <button
                          type="button"
                          onClick={() => {
                            const reason = window.prompt('Optional reason for rejection (or leave blank):', 'Requirements not met at this time.');
                            if (reason !== null) {
                              updateApplicationStatus(selectedApp.id, 'rejected', reason.trim() || undefined, 'WDS Recruitment Team');
                              setApplications(getStoredApplications());
                              showToast('Application marked as rejected.', 'error');
                            }
                          }}
                          className="px-3 py-2 bg-neutral-200 hover:bg-rose-500/20 text-neutral-700 hover:text-rose-600 dark:bg-white dark:bg-white/5 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete application ticket for ${selectedApp.ign}?`)) {
                            deleteApplication(selectedApp.id);
                            setSelectedAppId(null);
                            setApplications(getStoredApplications());
                            showToast('Application deleted.', 'info');
                          }
                        }}
                        className="px-3 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Ticket</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50 space-y-3">
                  <MessageSquare className="w-14 h-14 text-neutral-600 dark:text-neutral-400 dark:text-neutral-600" />
                  <div>
                    <p className="text-neutral-900 dark:text-neutral-900 dark:text-white font-bold text-base">Select a Driver Application</p>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-1 max-w-xs mx-auto">
                      Choose an applicant from the left list to review their cars, chat with them live, and manage recruitment status.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Events Schedule</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Manage upcoming carmeets, collaborations, and tournaments.</p>
            </div>
            <button
              onClick={handleOpenAddEvent}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.length === 0 ? (
              <div className="col-span-full py-12 text-center text-neutral-500 bg-white dark:bg-white/[0.02] border-transparent dark:border-white/5 shadow-lg rounded-2xl">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-neutral-800 dark:text-white">No upcoming events</p>
                <p className="text-xs mt-1">Schedule a new meet or collaboration to let the community know.</p>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="bg-white dark:bg-white/[0.02] border-transparent dark:border-white/5 shadow-lg rounded-2xl p-5 hover:bg-neutral-50 dark:hover:bg-neutral-100 dark:bg-white/[0.04] transition-colors relative group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-red-600 dark:text-red-500 text-[10px] font-bold uppercase tracking-widest">
                      {event.type}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditEvent(event)}
                        className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-black/40 border-transparent dark:border-white/10 shadow flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-black/40 border-transparent dark:border-white/10 shadow flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5 leading-tight">{event.title}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                      <CalendarDays className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 shrink-0" />
                      <span className="font-medium text-neutral-900 dark:text-white">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                      <Crown className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 shrink-0" />
                      <span>Host: <span className="font-semibold text-neutral-900 dark:text-white/80">{event.host}</span></span>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pt-3 border-t border-transparent dark:border-white/10">
                      {event.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* TAB 7: Featured Video Management */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-red-600 dark:text-red-500" />
                <span>Featured Montages & Videos</span>
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Publish YouTube, TikTok, Streamable, or direct MP4 video links to showcase community montages.</p>
            </div>
            {editingVideoId && (
              <button
                type="button"
                onClick={handleOpenAddVideo}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-100 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95"
              >
                + Post Another Video
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Form */}
            <div className="lg:col-span-5 bg-white dark:bg-white/5 rounded-2xl p-6 border-transparent dark:border-white/10 shadow-lg space-y-5">
              <div className="border-b border-transparent dark:border-white/10 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                  {editingVideoId ? 'Edit Video Details' : 'Add New Featured Video'}
                </h3>
                {editingVideoId && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
                    Editing
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveVideo} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Video Stream Link *</label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Streams for all visitors</span>
                  </div>
                  <input
                    type="url"
                    required
                    value={videoForm.url}
                    onChange={e => setVideoForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... or TikTok / MP4 link"
                    className="w-full bg-neutral-100 dark:bg-black/50 border border-transparent shadow-sm rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 text-neutral-700 dark:text-neutral-300">YouTube / Shorts</span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 text-neutral-700 dark:text-neutral-300">TikTok</span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 text-neutral-700 dark:text-neutral-300">Streamable</span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 text-neutral-700 dark:text-neutral-300">Google Drive</span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-transparent dark:border-white/10 text-neutral-700 dark:text-neutral-300">Direct .MP4</span>
                  </div>
                </div>

                {videoFormError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-transparent text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{videoFormError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Video Title</label>
                  <input
                    type="text"
                    value={videoForm.title}
                    onChange={e => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. WDS Elite Drift Montage"
                    className="w-full bg-neutral-100 dark:bg-black/50 border border-transparent shadow-sm rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Description (Optional)</label>
                  <textarea
                    value={videoForm.description}
                    onChange={e => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description, driver tags, or credits..."
                    rows={2}
                    className="w-full bg-neutral-100 dark:bg-black/50 border border-transparent shadow-sm rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-transparent dark:border-white/10">
                  {editingVideoId && (
                    <button
                      type="button"
                      onClick={handleOpenAddVideo}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-600 dark:text-neutral-400 dark:hover:text-white bg-neutral-200 hover:bg-neutral-300 dark:bg-white dark:bg-white/5 dark:hover:bg-neutral-100 dark:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isVideoFormLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isVideoFormLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : editingVideoId ? (
                      'Update Video'
                    ) : (
                      'Add to Featured'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right List & Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Current Featured Videos</span>
                  <span className="text-xs text-neutral-500 font-normal">({featuredVideos.length})</span>
                </h3>
              </div>

              {featuredVideos.length === 0 ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-transparent dark:border-white/20 p-8 flex flex-col items-center justify-center text-center text-neutral-500">
                  <Video className="w-10 h-10 mb-3 opacity-40 text-red-500" />
                  <p className="font-medium text-neutral-800 dark:text-white/80">No featured videos yet</p>
                  <p className="text-xs mt-1 max-w-sm text-neutral-600 dark:text-neutral-400">Paste a YouTube, TikTok, or Streamable link to feature community clips and montages on the home page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredVideos.map((video) => {
                    const embedUrl = formatVideoEmbedUrl(video.url);
                    const isDirect = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(video.url);

                    return (
                      <div
                        key={video.id}
                        className={`bg-white dark:bg-[#0d0d0d] rounded-2xl overflow-hidden border shadow-lg flex flex-col justify-between transition-all ${
                          editingVideoId === video.id ? 'border-red-500 ring-2 ring-red-500/30' : 'border-transparent dark:border-white/10'
                        }`}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-black">
                          {isDirect ? (
                            <video
                              src={video.url}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <iframe
                              src={embedUrl}
                              title={video.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          )}

                          <div className="absolute top-2 right-2 pointer-events-none">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/70 border-transparent dark:border-white/10 text-white">
                              {video.url.includes('tiktok') ? 'TikTok' : video.url.includes('streamable') ? 'Streamable' : 'YouTube'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-neutral-900 dark:text-neutral-900 dark:text-white text-sm line-clamp-1">
                              {video.title || 'Community Montage'}
                            </h4>
                            {video.description && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                                {video.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-transparent dark:border-white/5 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVideo(video)}
                              className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white dark:bg-white/5 dark:hover:bg-neutral-100 dark:bg-white/10 text-xs font-semibold text-neutral-700 hover:text-neutral-900 dark:text-neutral-700 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: Car Gallery Management */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-white/5 shadow-lg flex items-center justify-between border border-transparent dark:border-emerald-500/10">
            <div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Car Gallery Management
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Showcase clean builds from the WDS Community. Add cars to appear on the public Gallery page.
              </p>
            </div>
            <div className="hidden sm:flex px-4 py-2 bg-neutral-100 dark:bg-black/40 rounded-xl border-transparent dark:border-white/5 items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-neutral-900 dark:text-white">{galleryCars.length}</span>
              <span className="text-xs text-neutral-500">Cars</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upload Form */}
            <div className="lg:col-span-5 space-y-6">
              {/* Success Notification Banner */}
              {gallerySuccessBanner && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-transparent text-emerald-800 dark:text-emerald-300 flex items-start justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-950 dark:text-white uppercase tracking-wider">Uploaded Successfully</p>
                      <p className="text-xs text-emerald-900 dark:text-emerald-200/90 mt-0.5 leading-relaxed">{gallerySuccessBanner}</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setGallerySuccessBanner(null)} 
                    className="text-emerald-600 dark:text-emerald-400/60 hover:text-neutral-900 dark:hover:text-white transition-colors p-1"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveGallery} className="bg-white dark:bg-white/5 rounded-2xl p-5 border-transparent dark:border-white/10 shadow-lg space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Add Car Showcase</h3>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Upload a picture/video of a member's build</p>
                  </div>
                </div>

                <div className="bg-neutral-100 dark:bg-black/40 p-1.5 rounded-xl flex items-center mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setGallerySourceMode('link');
                      setGallerySuccessBanner(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      gallerySourceMode === 'link' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white dark:bg-white/5'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Direct Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGallerySourceMode('upload');
                      setGallerySuccessBanner(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      gallerySourceMode === 'upload' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white dark:bg-white/5'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                </div>

                {gallerySourceMode === 'link' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Image URL *</label>
                    <input
                      type="url"
                      required
                      value={galleryForm.imageUrl}
                      onChange={e => {
                        setGalleryForm(prev => ({ ...prev, imageUrl: e.target.value }));
                        setGallerySuccessBanner(null);
                      }}
                      placeholder="https://i.imgur.com/example.jpg"
                      className="w-full bg-neutral-100 dark:bg-[#0a0a0a] border border-transparent rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-[10px] text-neutral-500 px-1 mt-1">Direct links (Imgur, Discord) are strongly recommended for unlimited storage.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Media File *</label>
                    
                    {isGalleryFormLoading ? (
                      <div className="w-full border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 rounded-xl px-4 py-8 text-center flex flex-col items-center justify-center">
                        <RefreshCw className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-spin mb-2.5" />
                        <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Uploading & Optimizing Picture...</p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Compressing and processing high-res preview</p>
                      </div>
                    ) : galleryForm.imageUrl && galleryForm.type === 'upload' ? (
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-transparent group">
                          {galleryForm.imageUrl.startsWith('data:video/') || galleryForm.imageUrl.startsWith('blob:') || galleryForm.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={galleryForm.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={galleryForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute top-2 left-2">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-600 text-white shadow-md flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" /> Uploaded & Ready
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-1 text-xs">
                          <div className="text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                            {gallerySelectedFileName ? (
                              <span className="text-neutral-800 dark:text-neutral-300 font-medium">{gallerySelectedFileName}</span>
                            ) : (
                              <span>Media Selected</span>
                            )}
                            {gallerySelectedFileSize && (
                              <span className="text-neutral-500 ml-1">({gallerySelectedFileSize})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => galleryFileInputRef.current?.click()}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold cursor-pointer"
                            >
                              Change File
                            </button>
                            <span className="text-neutral-600 dark:text-neutral-400 dark:text-neutral-600">•</span>
                            <button
                              type="button"
                              onClick={() => {
                                setGalleryForm(prev => ({ ...prev, imageUrl: '' }));
                                setGallerySelectedFileName('');
                                setGallerySelectedFileSize('');
                                if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-500 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <input
                          type="file"
                          accept="image/*,video/*"
                          ref={galleryFileInputRef}
                          onChange={handleGalleryFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative group">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          ref={galleryFileInputRef}
                          onChange={handleGalleryFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full border-2 border-dashed border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-6 text-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5 transition-colors">
                          <Upload className="w-6 h-6 text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                          <p className="text-sm font-medium text-neutral-800 dark:text-white mb-1">
                            Click or drag picture/video to upload
                          </p>
                          <p className="text-xs text-neutral-500">Max size 10MB (Auto-compressed to WebP)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Car Model / Build Name *</label>
                  <input
                    type="text"
                    required
                    value={galleryForm.carName}
                    onChange={e => {
                      setGalleryForm(prev => ({ ...prev, carName: e.target.value }));
                      setGallerySuccessBanner(null);
                    }}
                    placeholder="e.g. R34 Skyline GT-R / Silvia S15"
                    className="w-full bg-neutral-100 dark:bg-[#0a0a0a] border border-transparent rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Member / Owner IGN *</label>
                  <input
                    type="text"
                    required
                    list="wds-member-igns-list"
                    value={galleryForm.ownerName}
                    onChange={e => {
                      setGalleryForm(prev => ({ ...prev, ownerName: e.target.value }));
                      setGallerySuccessBanner(null);
                    }}
                    placeholder="e.g. WDS | Ghost"
                    className="w-full bg-neutral-100 dark:bg-[#0a0a0a] border border-transparent rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <datalist id="wds-member-igns-list">
                    {members.map(m => (
                      <option key={m.id} value={m.name} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-neutral-500 px-1">Select from member roster or type any IGN</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isGalleryFormLoading || isGallerySaving || !galleryForm.imageUrl || !galleryForm.carName || !galleryForm.ownerName}
                    className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGallerySaving ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading & Adding Picture...</>
                    ) : isGalleryFormLoading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Processing Picture...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Add to Member's Showcase</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Existing Cars */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Showcased Cars</span>
                </h3>
              </div>

              {galleryCars.length === 0 ? (
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-transparent dark:border-white/20 p-8 flex flex-col items-center justify-center text-center text-neutral-500">
                  <ImageIcon className="w-10 h-10 mb-3 opacity-40 text-emerald-500" />
                  <p className="font-medium text-neutral-800 dark:text-white/80">No cars showcased yet</p>
                  <p className="text-xs mt-1 max-w-sm text-neutral-600 dark:text-neutral-400">Add the first clean build to the gallery.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {galleryCars.map((car) => (
                    <div key={car.id} className="bg-white dark:bg-[#0d0d0d] rounded-2xl overflow-hidden border-transparent dark:border-white/10 shadow-lg flex flex-col justify-between">
                      <div className="relative aspect-video bg-black">
                        {car.imageUrl.startsWith('data:video/') || car.imageUrl.startsWith('blob:') || car.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={car.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={car.imageUrl} alt={car.carName} className="w-full h-full object-cover" />
                          )}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase backdrop-blur-md bg-black/70 border-transparent dark:border-white/10 text-emerald-400">
                            {car.type}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="font-bold text-neutral-900 dark:text-neutral-900 dark:text-white text-sm line-clamp-1">{car.carName}</h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">By {car.ownerName}</p>
                        <div className="pt-3 border-t border-transparent dark:border-white/5 mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteGallery(car.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsAddEventModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#0d0d0d] border-transparent dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-transparent dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 shadow flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{editingEventId ? 'Edit Event' : 'Schedule Event'}</h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Post a new meet or collaboration</p>
                </div>
              </div>
              <button onClick={() => setIsAddEventModalOpen(false)} className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Midnight Drift Session"
                  className="w-full bg-neutral-100 dark:bg-white/[0.03] border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={e => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-neutral-100 dark:bg-white/[0.03] border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Time *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.time}
                    onChange={e => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="8:00 PM EST"
                    className="w-full bg-neutral-100 dark:bg-white/[0.03] border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Type</label>
                  <select
                    value={eventForm.type}
                    onChange={e => setEventForm(prev => ({ ...prev, type: e.target.value as EventType }))}
                    className="w-full bg-neutral-100 dark:bg-[#141414] border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <option value="Carmeet" className="text-black bg-white dark:text-white dark:bg-neutral-900">Carmeet</option>
                    <option value="Montage" className="text-black bg-white dark:text-white dark:bg-neutral-900">Montage</option>
                    <option value="Collaboration" className="text-black bg-white dark:text-white dark:bg-neutral-900">Collaboration</option>
                    <option value="Tournament" className="text-black bg-white dark:text-white dark:bg-neutral-900">Tournament</option>
                    <option value="Other" className="text-black bg-white dark:text-white dark:bg-neutral-900">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Host/Organizer</label>
                  <input
                    type="text"
                    value={eventForm.host}
                    onChange={e => setEventForm(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="WDS Admins"
                    className="w-full bg-neutral-100 dark:bg-white/[0.03] border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider pl-1">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details, location, rules..."
                  rows={3}
                  className="w-full bg-neutral-100 dark:bg-white/[0.03] border border-transparent dark:border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-white bg-neutral-200 hover:bg-neutral-300 dark:bg-white dark:bg-white/5 dark:hover:bg-neutral-100 dark:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
}
