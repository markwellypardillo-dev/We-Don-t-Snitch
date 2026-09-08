import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Users, Activity, ShieldAlert, Camera, ArrowRight, MapPin, Calendar, Heart } from 'lucide-react';
import { getStoredMeets } from '../data/defaultMeets';
import { getStoredTeamMembers } from '../lib/teamStorage';
import { getCommunityStats, getStoredMembers, getEffectiveTotalMembers } from '../lib/attendanceStorage';

import { getStoredEvents } from '../lib/eventsStorage';
import { FeaturedVideo, getFeaturedVideos, isDirectVideoUrl } from '../lib/videoStorage';
import { CommunityEvent } from '../types';
import { CalendarDays, Clock, Crown, Film } from 'lucide-react';


export default function LandingPage({ 
  onApply, 
  onViewMeets, 
  onAbout,
  onViewMontages 
}: { 
  onApply: () => void; 
  onViewMeets?: () => void; 
  onAbout?: () => void;
  onViewMontages?: () => void;
}) {
  const [memberCount, setMemberCount] = useState(() => {
    const stats = getCommunityStats();
    const members = getStoredMembers();
    return getEffectiveTotalMembers(stats, members);
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [featuredMeets, setFeaturedMeets] = useState(() => getStoredMeets().slice(0, 3));

  useEffect(() => {
    const updateMeets = () => setFeaturedMeets(getStoredMeets().slice(0, 3));
    window.addEventListener('wds_meets_changed', updateMeets);
    return () => window.removeEventListener('wds_meets_changed', updateMeets);
  }, []);

  const [teamMembers, setTeamMembers] = useState(() => {
    const all = getStoredTeamMembers();
    // Filter just to owner and admins, take up to 4
    return all.filter(m => m.category === 'owner' || m.category === 'admin').slice(0, 4);
  });

  useEffect(() => {
    const updateTeam = () => {
      const all = getStoredTeamMembers();
      setTeamMembers(all.filter(m => m.category === 'owner' || m.category === 'admin').slice(0, 4));
    };
    window.addEventListener('wds_team_members_changed', updateTeam);
    return () => window.removeEventListener('wds_team_members_changed', updateTeam);
  }, []);



  const [events, setEvents] = useState<CommunityEvent[]>(() => getStoredEvents().slice(0, 3)); // show top 3 upcoming

  useEffect(() => {
    const updateEvents = () => setEvents(getStoredEvents().slice(0, 3));
    window.addEventListener('wds_events_changed', updateEvents);
    return () => window.removeEventListener('wds_events_changed', updateEvents);
  }, []);

  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>(() => getFeaturedVideos());
  useEffect(() => {
    const updateVideos = () => setFeaturedVideos(getFeaturedVideos());
    window.addEventListener('wds_featured_video_changed', updateVideos);
    return () => window.removeEventListener('wds_featured_video_changed', updateVideos);
  }, []);


  useEffect(() => {
    const updateStats = () => {
      const stats = getCommunityStats();
      const members = getStoredMembers();
      setMemberCount(getEffectiveTotalMembers(stats, members));
    };

    window.addEventListener('wds_community_stats_changed', updateStats);
    window.addEventListener('storage', updateStats);
    return () => {
      window.removeEventListener('wds_community_stats_changed', updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, []);


  const faqs = [
    { 
      question: "What is WDS?", 
      answer: "We Don't Snitch (WDS) is a premier Car Parking Multiplayer community focused on clean meets, respect, and active driving." 
    },
    { 
      question: "Are there any requirements to join the community?", 
      answer: "Yes, just show us your clean build cars!" 
    },
    { 
      question: "How do I join?", 
      answer: "Submit your details in the Apply tab or reach out directly to an administrator." 
    },
    { 
      question: "What are the activity expectations?", 
      answer: "We track attendance to maintain an active roster. If you'll be away, simply let an officer know." 
    }
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Graphic */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50 dark:bg-black transition-colors">
        <img 
          src="/1000076465_50.jpg" 
          alt="WDS Background" 
          className="w-full h-full object-cover object-center opacity-10 dark:opacity-70 scale-100 transition-opacity"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/40 to-slate-50 dark:from-black/60 dark:via-black/40 dark:to-black/95 transition-colors" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-20 sm:space-y-28">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 w-full max-w-3xl"
          >
            {/* Logo Emblem */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xl p-1 bg-white dark:bg-black/60 border-transparent dark:border-white/10 backdrop-blur-md">
                <img 
                  src="/received_1395385905883694.jpeg" 
                  alt="WDS Emblem" 
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
              WE DON'T SNITCH
            </h1>
            
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              We are an elite Car Parking Multiplayer (CPM) community dedicated to clean meets, respectful driving, and zero toxicity. Cruise, build, and connect with active drivers.
            </p>
            
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button 
                type="button"
                onClick={onApply}
                className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-red-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/20 active:scale-95"
              >
                Apply to Join
              </button>
              {onViewMeets && (
                <button 
                  type="button"
                  onClick={onViewMeets}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-neutral-200/90 hover:bg-neutral-300 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-900 dark:text-white font-semibold text-xs sm:text-sm rounded-xl border-transparent dark:border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md shadow-sm active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Meets Gallery</span>
                </button>
              )}
            </div>
          </motion.div>
        </section>

        {/* Minimal Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 backdrop-blur-md flex flex-col items-center text-center space-y-2">
            <Users className="w-5 h-5 text-red-600 dark:text-white mb-1" />
            <h3 className="text-3xl font-black text-neutral-900 dark:text-white">{memberCount}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-medium">Active Members</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 backdrop-blur-md flex flex-col items-center text-center space-y-2">
            <Activity className="w-5 h-5 text-red-600 dark:text-white mb-1" />
            <h3 className="text-3xl font-black text-neutral-900 dark:text-white">Daily</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-medium">Meets & Events</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 backdrop-blur-md flex flex-col items-center text-center space-y-2">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-white mb-1" />
            <h3 className="text-3xl font-black text-neutral-900 dark:text-white">100%</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-medium">Clean & Respectful</p>
          </div>
        </section>

        {/* Featured Montage Videos */}
        {featuredVideos.length > 0 && (
          <section id="featured-montage" className="space-y-6 scroll-mt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-red-600" />
                  <span>Featured {featuredVideos.length > 1 ? 'Montages' : 'Montage'}</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Community highlights, gameplay clips & reels</p>
              </div>

              {onViewMontages && (
                <button
                  type="button"
                  onClick={onViewMontages}
                  className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>See More</span>
                  {featuredVideos.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
                      {featuredVideos.length}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredVideos.slice(0, 3).map((video) => {
                const isDirect = isDirectVideoUrl(video.url, video.type);

                return (
                  <div
                    key={video.id}
                    className="group rounded-2xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 backdrop-blur-md overflow-hidden flex flex-col hover:border-transparent dark:hover:border-white/20 transition-all"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                      {isDirect ? (
                        <video
                          src={video.url}
                          controls
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 w-full h-full object-cover bg-black"
                        />
                      ) : (
                        <iframe
                          src={video.url}
                          title={video.title || "Featured Video"}
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </div>
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-1">
                          {video.title || "Community Montage"}
                        </h3>
                        {video.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* See More CTA if more than 3 videos */}
            {featuredVideos.length > 3 && onViewMontages && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onViewMontages}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] border-transparent dark:border-white/10 text-neutral-900 dark:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm group cursor-pointer"
                >
                  <Film className="w-4 h-4 text-red-600" />
                  <span>See More Montages ({featuredVideos.length - 3} more clips in vault)</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Featured Car Meets */}
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Recent Meets</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Snapshots from our community sessions</p>
            </div>
            {onViewMeets && (
              <button
                type="button"
                onClick={onViewMeets}
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredMeets.map((meet) => (
              <div
                key={meet.id}
                onClick={onViewMeets}
                className="group rounded-2xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 backdrop-blur-md overflow-hidden flex flex-col hover:border-transparent dark:hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={meet.imageUrl}
                    alt={meet.title || 'Car Meet'}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop';
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-medium">
                    <MapPin className="w-3 h-3" />
                    <span>{meet.location}</span>
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-1">
                    {meet.title}
                  </h3>
                  <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {meet.date}
                    </span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-white">
                      <Heart className="w-3 h-3 fill-red-600/20 dark:fill-white/20 text-red-600 dark:text-white" />
                      {meet.likes || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section id="upcoming-events" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-6 h-6 text-red-600" />
                  <span>Upcoming Events</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Join us for the next official WDS gathering.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 rounded-2xl p-5 hover:border-transparent dark:hover:bg-white/[0.06] transition-colors group"
                >
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 leading-tight">{event.title}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium text-neutral-900 dark:text-white">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <Crown className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Host: <span className="text-neutral-900 dark:text-white font-medium">{event.host}</span></span>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-white/10 pt-3">
                      {event.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Leadership Team Teaser */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">WDS Leadership Team</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">The core crew managing our daily operations</p>
            </div>
            {onAbout && (
              <button
                type="button"
                onClick={onAbout}
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Full Team</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="group relative rounded-2xl bg-white dark:bg-white/[0.02] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 overflow-hidden flex flex-col transition-all hover:border-transparent dark:hover:bg-white/[0.05] dark:hover:border-white/20"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name || 'Team Member'}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-600">
                      <Users className="w-10 h-10" />
                    </div>
                  )}
                  {/* Gradient Overlay for Text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-base font-bold text-white leading-tight mb-0.5">{member.name}</h3>
                    <p className="text-xs text-neutral-300 line-clamp-1">{member.roleTitle}</p>
                    
                    {member.ign && (
                      <div className="mt-2 flex items-center gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-emerald-400">IGN: {member.ign}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Minimal FAQ */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Everything you need to know about WDS</p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="rounded-xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-sm shadow-black/5 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${openFaq === index ? 'rotate-180 text-red-600 dark:text-white' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
