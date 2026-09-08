import { useState, useEffect } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Code2, 
  ExternalLink, 
  ArrowRight
} from 'lucide-react';
import { TeamMember, TeamCategory } from '../types';
import { getStoredTeamMembers } from '../lib/teamStorage';

function MemberCard({ member }: { member: TeamMember }) {
  const isOwner = member.category === 'owner';
  const isDev = member.category === 'developer';

  return (
    <div 
      className="group relative rounded-2xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 hover:border-transparent dark:hover:border-white/20 p-5 transition-all duration-300 flex flex-col items-center text-center shadow-md dark:shadow-lg dark:shadow-black/20 hover:-translate-y-1 backdrop-blur-xl"
    >
      {/* Avatar */}
      <div className="relative mb-3.5">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden p-1 bg-neutral-100 dark:bg-black/60 border-transparent dark:border-white/10 shadow-md group-hover:scale-105 transition-transform duration-300">
          <img 
            src={member.imageUrl} 
            alt={member.name || 'Member'} 
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';
            }}
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Category Icon Stamp */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-md bg-neutral-900 dark:bg-white text-white dark:text-black font-bold">
          {isOwner && <Crown className="w-3.5 h-3.5" />}
          {isDev && <Code2 className="w-3.5 h-3.5" />}
          {!isOwner && !isDev && <ShieldCheck className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Member Name */}
      <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
        {member.name}
      </h3>

      {/* In-Game Name (IGN) */}
      {member.ign && (
        <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-1">
          IGN: <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{member.ign}</span>
        </p>
      )}

      {/* Social Link */}
      {member.socialLink && (
        <a
          href={member.socialLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <span>Contact</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

export default function AboutPage({ onApply }: { onApply?: () => void }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => getStoredTeamMembers());
  const [selectedCategory, setSelectedCategory] = useState<TeamCategory | 'all'>('all');

  useEffect(() => {
    const handleUpdate = () => {
      setTeamMembers(getStoredTeamMembers());
    };
    window.addEventListener('wds_team_members_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('wds_team_members_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const ownerMembers = teamMembers.filter(m => m.category === 'owner');
  const adminMembers = teamMembers.filter(m => m.category === 'admin');
  const devMembers = teamMembers.filter(m => m.category === 'developer');

  return (
    <div className="relative min-h-screen">
      {/* Background Graphic */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-neutral-100 dark:bg-black">
        <img 
          src="/1000076465_50.jpg" 
          alt="WDS Background" 
          className="w-full h-full object-cover object-center opacity-20 dark:opacity-70 scale-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100/80 dark:from-black/60 via-neutral-100/90 dark:via-black/40 to-neutral-100 dark:to-black/95" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-14">
        
        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            About Us
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            The leadership, administration, and development team behind We Don't Snitch.
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-neutral-200/80 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All ({teamMembers.length})
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedCategory('owner')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'owner'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-neutral-200/80 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Owner ({ownerMembers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'admin'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-neutral-200/80 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admins ({adminMembers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('developer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'developer'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-neutral-200/80 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer ({devMembers.length})</span>
          </button>
        </div>

        {/* SECTION 1: COMMUNITY OWNER */}
        {(selectedCategory === 'all' || selectedCategory === 'owner') && ownerMembers.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <Crown className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                Founder & Owner
              </h2>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                {ownerMembers.map(owner => (
                  <div key={owner.id}>
                    <MemberCard member={owner} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: ADMINISTRATORS */}
        {(selectedCategory === 'all' || selectedCategory === 'admin') && adminMembers.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                Administrators
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminMembers.map(admin => (
                <div key={admin.id}>
                  <MemberCard member={admin} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: LEAD DEVELOPER */}
        {(selectedCategory === 'all' || selectedCategory === 'developer') && devMembers.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <Code2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                Platform Developer
              </h2>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                {devMembers.map(dev => (
                  <div key={dev.id}>
                    <MemberCard member={dev} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        {onApply && (
          <div className="pt-6 border-t border-transparent dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Join the WDS Roster</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Applications are currently open.</p>
            </div>
            <button
              type="button"
              onClick={onApply}
              className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <span>Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
