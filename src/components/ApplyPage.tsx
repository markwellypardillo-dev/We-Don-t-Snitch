import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ExternalLink, 
  Search, 
  Car, 
  Copy, 
  Check, 
  MessageSquare,
  Users,
  HelpCircle,
  X
} from 'lucide-react';
import { 
  submitApplication, 
  findApplication, 
  sendApplicationMessage, 
  getMyRecentApplicationCodes,
  rememberMyApplication 
} from '../lib/applicationStorage';
import { getStoredTeamMembers } from '../lib/teamStorage';
import { TeamMember, Application, ApplicationMessage } from '../types';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';

const PLAYSTYLES = [
  'Drifting & Tandem',
  'Car Meets & Stance',
  'Drag & Highway',
  'Livery Artist',
  'All-Round'
];

export default function ApplyPage() {
  const [activeTab, setActiveTab] = useState<'apply' | 'track' | 'recruiters'>('apply');
  
  // Form State
  const [ign, setIgn] = useState('');
  const [cpmId, setCpmId] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [playstyle, setPlaystyle] = useState(PLAYSTYLES[0]);
  const [favoriteCar, setFavoriteCar] = useState('');
  const [notes, setNotes] = useState('');

  // Active Submitted Ticket State
  const [activeTicket, setActiveTicket] = useState<Application | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [searchCodeInput, setSearchCodeInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [recentCodes, setRecentCodes] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Leadership / Recruiters
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => getStoredTeamMembers());
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Sync real-time updates for applications & leadership
  useEffect(() => {
    const handleTeamUpdate = () => {
      setTeamMembers(getStoredTeamMembers());
    };

    const handleAppsUpdate = () => {
      setRecentCodes(getMyRecentApplicationCodes());
      if (activeTicket) {
        const refreshed = findApplication(activeTicket.trackingCode || activeTicket.id);
        if (refreshed) {
          setActiveTicket(refreshed);
        }
      }
    };

    window.addEventListener('wds_team_members_changed', handleTeamUpdate);
    window.addEventListener('wds_applications_changed', handleAppsUpdate);
    window.addEventListener('storage', handleAppsUpdate);

    const saved = getMyRecentApplicationCodes();
    setRecentCodes(saved);
    if (saved.length > 0 && !activeTicket) {
      const latest = findApplication(saved[0]);
      if (latest) {
        setActiveTicket(latest);
      }
    }

    return () => {
      window.removeEventListener('wds_team_members_changed', handleTeamUpdate);
      window.removeEventListener('wds_applications_changed', handleAppsUpdate);
      window.removeEventListener('storage', handleAppsUpdate);
    };
  }, [activeTicket?.id]);

  useEffect(() => {
    if (activeTab === 'track' && activeTicket) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages?.length, activeTab]);

  // Recruiter contacts resolution
  const recruiter = teamMembers.find(m => 
    m.roleTitle.toLowerCase().includes('recruiter') || 
    m.name.toLowerCase().includes('karl')
  );
  
  const owner = teamMembers.find(m => 
    m.category === 'owner' || 
    m.name.toLowerCase().includes('kyle')
  );

  const directContacts: TeamMember[] = [];
  if (recruiter) directContacts.push(recruiter);
  if (owner && !directContacts.some(c => c.id === owner.id)) directContacts.push(owner);
  teamMembers
    .filter(m => m.category === 'admin' && !directContacts.some(c => c.id === m.id))
    .slice(0, 2)
    .forEach(m => directContacts.push(m));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ign.trim()) return;

    const newApp = submitApplication({
      ign: ign.trim(),
      cpmId: cpmId.trim() || undefined,
      contactMethod: 'facebook',
      contactInfo: contactInfo.trim() || undefined,
      playstyle,
      favoriteCar: favoriteCar.trim() || undefined,
      notes: notes.trim() || undefined
    });

    setActiveTicket(newApp);
    setActiveTab('track');
    setIgn('');
    setCpmId('');
    setContactInfo('');
    setFavoriteCar('');
    setNotes('');
  };

  const handleCopyTrackingCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLookupApplication = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError('');
    if (!searchCodeInput.trim()) {
      setSearchError('Enter your ticket code or IGN.');
      return;
    }
    const found = findApplication(searchCodeInput.trim());
    if (found) {
      setActiveTicket(found);
      rememberMyApplication(found.trackingCode || found.id);
      setSearchCodeInput('');
      setActiveTab('track');
    } else {
      setSearchError(`No application found for "${searchCodeInput.trim()}".`);
    }
  };

  const handleSendApplicantMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !chatMessage.trim()) return;

    const updated = sendApplicationMessage(
      activeTicket.trackingCode || activeTicket.id,
      'applicant',
      activeTicket.ign,
      chatMessage.trim()
    );

    if (updated) {
      setActiveTicket(updated);
      setChatMessage('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-transparent dark:border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            Apply to Join
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            World Driving Squad • Recruitment & Status
          </p>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-neutral-900/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'apply'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'track'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Status</span>
            {activeTicket && (
              <span className={`w-1.5 h-1.5 rounded-full ${activeTicket.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recruiters')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'recruiters'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Recruiters
          </button>
        </div>
      </div>

      {/* ================= TAB 1: MINIMAL APPLICATION FORM ================= */}
      {activeTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Clean Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-400 flex items-center gap-1.5">
                      <span>In-Game Name (IGN)</span>
                      <span className="text-red-500">*</span>
                      <button
                        type="button"
                        onClick={() => setShowTutorial(true)}
                        className="text-neutral-400 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center"
                        title="Click to learn what is IGN and Ticket Code"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={ign}
                    onChange={e => setIgn(e.target.value)}
                    placeholder="e.g. WDS_Takumi"
                    className="w-full bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none transition-colors shadow-sm dark:shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-400">
                    CPM ID
                  </label>
                  <input
                    type="text"
                    value={cpmId}
                    onChange={e => setCpmId(e.target.value)}
                    placeholder="e.g. AB123456"
                    className="w-full bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none transition-colors font-mono shadow-sm dark:shadow-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-400">
                    Facebook Profile Link <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Main Group Chat</span>
                </div>
                <input
                  type="url"
                  required
                  value={contactInfo}
                  onChange={e => setContactInfo(e.target.value)}
                  placeholder="https://facebook.com/your.profile.name"
                  className="w-full bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none transition-colors shadow-sm dark:shadow-none"
                />
                <p className="text-[11px] text-neutral-500 leading-normal">
                  We use Facebook Messenger for our official Squad Group Chat. Once you're added to the community, you'll also get the invite to our Discord server.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-400">
                  Playstyle
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PLAYSTYLES.map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setPlaystyle(style)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        playstyle === style
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                          : 'bg-neutral-200/70 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-300 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-400">
                  Favorite Car / Main Build
                </label>
                <input
                  type="text"
                  value={favoriteCar}
                  onChange={e => setFavoriteCar(e.target.value)}
                  placeholder="e.g. Nissan Skyline R34 / Mazda RX-7"
                  className="w-full bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none transition-colors shadow-sm dark:shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-400">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Brief note or message to recruiters..."
                  className="w-full bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none transition-colors resize-none shadow-sm dark:shadow-none"
                />
              </div>

              <button
                type="submit"
                disabled={!ign.trim()}
                className="w-full py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Submit Application</span>
              </button>
            </form>
          </div>

          {/* Right Sidebar: Recruiter & Quick Track */}
          <div className="lg:col-span-5 space-y-8 lg:pl-4">
            {/* Recruiter Card */}
            {recruiter && (
              <div className="space-y-3 pb-6 border-b border-transparent dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Recruiter Contact
                </span>

                <div className="flex items-center gap-3.5">
                  <img 
                    src={recruiter.imageUrl || FALLBACK_AVATAR} 
                    alt={recruiter.name} 
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                    }}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover bg-neutral-200 dark:bg-neutral-900 border-transparent dark:border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-neutral-900 dark:text-white text-sm truncate">{recruiter.name}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{recruiter.roleTitle}</div>
                    {recruiter.ign && (
                      <div className="text-[11px] font-mono text-neutral-500">IGN: {recruiter.ign}</div>
                    )}
                  </div>
                </div>

                {recruiter.socialLink && (
                  <a
                    href={recruiter.socialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-white hover:text-red-600 dark:hover:text-neutral-300 transition-colors pt-1 cursor-pointer"
                  >
                    <span>Message on Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Quick Status Lookup */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Check Existing Application
                </span>
                <button
                  type="button"
                  onClick={() => setShowTutorial(true)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>What's this?</span>
                </button>
              </div>

              <form onSubmit={handleLookupApplication} className="flex gap-2">
                <input
                  type="text"
                  value={searchCodeInput}
                  onChange={e => setSearchCodeInput(e.target.value)}
                  placeholder="Ticket code or IGN..."
                  className="flex-1 bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none shadow-sm dark:shadow-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Check
                </button>
              </form>

              {searchError && (
                <p className="text-xs text-rose-500">{searchError}</p>
              )}

              {recentCodes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-neutral-500">Recent:</span>
                  {recentCodes.slice(0, 3).map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        const found = findApplication(code);
                        if (found) {
                          setActiveTicket(found);
                          setActiveTab('track');
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CLEAN STATUS & CHAT ================= */}
      {activeTab === 'track' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {!activeTicket ? (
            <div className="text-center py-12 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-neutral-800 dark:text-neutral-300 font-medium">
                  Check Your Recruitment Status
                </p>
                <p className="text-xs text-neutral-500">
                  Enter your Ticket Code (e.g. WDS-K9B2) or your in-game name.
                </p>
              </div>

              <form onSubmit={handleLookupApplication} className="max-w-xs mx-auto flex gap-2">
                <input
                  type="text"
                  value={searchCodeInput}
                  onChange={e => setSearchCodeInput(e.target.value)}
                  placeholder="Ticket Code or IGN..."
                  className="flex-1 bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none shadow-sm dark:shadow-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
                >
                  Lookup
                </button>
              </form>

              <div>
                <button
                  type="button"
                  onClick={() => setShowTutorial(true)}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>What is a Ticket Code or IGN?</span>
                </button>
              </div>

              {searchError && (
                <p className="text-xs text-rose-500">{searchError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ticket Top Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-transparent dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{activeTicket.ign}</h2>
                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      {activeTicket.trackingCode || 'WDS-APP'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTrackingCode(activeTicket.trackingCode || activeTicket.id)}
                      className="text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer"
                      title="Copy code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTutorial(true)}
                      className="text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer"
                      title="What is this Ticket Code?"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Applied: {new Date(activeTicket.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    activeTicket.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : activeTicket.status === 'interviewing'
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : activeTicket.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}>
                    {activeTicket.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer underline ml-2"
                  >
                    Switch
                  </button>
                </div>
              </div>

              {/* Tryout Schedule Notice if present */}
              {activeTicket.tryoutSchedule && (
                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl text-xs text-neutral-800 dark:text-neutral-300 flex items-center justify-between border border-transparent">
                  <span><strong>Scheduled Meet / Tryout:</strong> {activeTicket.tryoutSchedule}</span>
                </div>
              )}

              {/* Message Thread */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {(activeTicket.messages || []).map((msg: ApplicationMessage) => {
                  const isApplicant = msg.sender === 'applicant';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isApplicant ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-neutral-500 mb-1 px-1">
                        {msg.senderName || (isApplicant ? 'You' : 'Admin')} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`p-3 text-xs sm:text-sm rounded-xl max-w-[85%] shadow-sm ${
                        isApplicant
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                          : 'bg-neutral-200/80 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendApplicantMessage} className="flex gap-2 pt-2 border-t border-transparent dark:border-white/5">
                <textarea
                  rows={2}
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendApplicantMessage(e);
                    }
                  }}
                  placeholder="Reply to recruiters..."
                  className="flex-1 bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/5 focus:border-neutral-500 dark:focus:border-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none shadow-sm dark:shadow-none min-h-[44px] resize-y custom-scrollbar"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: RECRUITERS DIRECTORY ================= */}
      {activeTab === 'recruiters' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {directContacts.map(contact => (
              <div 
                key={contact.id} 
                className="p-4 bg-white dark:bg-neutral-900/60 border border-transparent dark:border-transparent rounded-xl flex items-center justify-between gap-3 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={contact.imageUrl || FALLBACK_AVATAR} 
                    alt={contact.name} 
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                    }}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover bg-neutral-200 dark:bg-neutral-800 border-transparent dark:border-white/10 shrink-0" 
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-neutral-900 dark:text-white text-sm truncate">{contact.name}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{contact.roleTitle}</div>
                    {contact.ign && (
                      <div className="text-[11px] font-mono text-neutral-500">IGN: {contact.ign}</div>
                    )}
                  </div>
                </div>

                {contact.socialLink && (
                  <a 
                    href={contact.socialLink}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Direct Message"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TUTORIAL MODAL ================= */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border-transparent dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-transparent dark:border-white/5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-neutral-900 dark:text-white" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Application Guide</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Item 1: IGN */}
              <div className="space-y-1 p-3.5 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border-transparent dark:border-white/5">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>1. In-Game Name (IGN)</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed pl-4">
                  This is your in-game driver name in <strong>Car Parking Multiplayer</strong> (e.g. <code className="text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono">WDS_Takumi</code>).
                </p>
              </div>

              {/* Item 2: Ticket Code */}
              <div className="space-y-1 p-3.5 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border-transparent dark:border-white/5">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>2. Ticket Code</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed pl-4">
                  A unique code generated for your application (e.g. <code className="text-emerald-700 dark:text-emerald-300 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono">WDS-K9B2</code>). You can copy or save it to check if your application was approved, view tryout schedules, or chat with recruiters.
                </p>
              </div>

              {/* Item 3: Recruitment Steps */}
              <div className="space-y-1 p-3.5 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border-transparent dark:border-white/5">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>3. Recruitment Flow</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed pl-4">
                  After submitting your Facebook profile, our Lead Recruiter reviews your info and adds you to our <strong>Squad Facebook Group Chat</strong>. Once added, you will receive our private Discord server invite for car meets and tandem cruises.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
