import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { 
  Film, 
  Search, 
  Share2, 
  Check, 
  Calendar, 
  Video as VideoIcon,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FeaturedVideo, 
  getFeaturedVideos, 
  isDirectVideoUrl
} from '../lib/videoStorage';

interface Props {
  onBackToHome?: () => void;
}

export default function MontagesPage({ onBackToHome }: Props) {
  const [videos, setVideos] = useState<FeaturedVideo[]>(() => getFeaturedVideos());
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'youtube' | 'tiktok' | 'streamable'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleVideoChange = () => setVideos(getFeaturedVideos());
    window.addEventListener('wds_featured_video_changed', handleVideoChange);
    return () => window.removeEventListener('wds_featured_video_changed', handleVideoChange);
  }, []);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const titleMatch = (v.title || '').toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const descMatch = (v.description || '').toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const matchesSearch = !deferredSearchQuery.trim() || titleMatch || descMatch;

      if (!matchesSearch) return false;

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'youtube') {
        return v.url.toLowerCase().includes('youtube') || v.url.toLowerCase().includes('youtu.be');
      }
      if (selectedFilter === 'tiktok') {
        return v.url.toLowerCase().includes('tiktok');
      }
      if (selectedFilter === 'streamable') {
        return v.url.toLowerCase().includes('streamable');
      }
      return true;
    });
  }, [videos, deferredSearchQuery, selectedFilter]);

  const handleCopyLink = (video: FeaturedVideo) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(video.url);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 sm:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-transparent dark:border-white/10">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-red-600 dark:text-red-500 uppercase">
            <Film className="w-4 h-4" />
            <span>WDS Media Vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
            Featured Montages
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            High-octane Car Parking Multiplayer edits, cinematic community meets, drift sequences, and reel montages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-transparent dark:border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}
          <div className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border-transparent dark:border-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span>{videos.length} {videos.length === 1 ? 'Montage' : 'Montages'} Published</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Source Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-white/[0.03] border-transparent dark:border-white/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
            }`}
          >
            All ({videos.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('youtube')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === 'youtube'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
            }`}
          >
            YouTube
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('tiktok')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === 'tiktok'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
            }`}
          >
            TikTok
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('streamable')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === 'streamable'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
            }`}
          >
            Streamable
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search montages..."
            className="w-full bg-white dark:bg-white/[0.04] border-transparent dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl bg-neutral-50 dark:bg-neutral-900/40 border-transparent dark:border-white/10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-neutral-200/60 dark:bg-white/5 border-transparent dark:border-white/10 flex items-center justify-center mx-auto text-neutral-500 dark:text-neutral-400">
            <VideoIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">No Montages Found</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {searchQuery ? `No videos match "${searchQuery}". Try a different search term.` : 'No montages currently published in this category.'}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
              className="px-4 py-2 bg-neutral-900 dark:bg-white/10 hover:bg-neutral-800 dark:hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredVideos.map((video, index) => {
              const embedUrl = video.url;
              const isDirect = isDirectVideoUrl(video.url, video.type);

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="group rounded-2xl bg-white dark:bg-neutral-900/60 border-transparent dark:border-white/10 hover:border-transparent dark:hover:border-white/20 backdrop-blur-xl overflow-hidden flex flex-col transition-all shadow-md dark:shadow-xl hover:shadow-lg dark:hover:shadow-2xl"
                >
                  {/* Media Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-black">
                    {isDirect ? (
                      <video
                        src={video.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover bg-black"
                      />
                    ) : (
                      <iframe
                        src={embedUrl}
                        title={video.title || 'Featured Montage'}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}

                    <div className="absolute top-2 right-2 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/70 border border-white/10 text-white">
                        {video.url.includes('tiktok') ? 'TikTok' : video.url.includes('streamable') ? 'Streamable' : 'YouTube'}
                      </span>
                    </div>
                  </div>

                  {/* Video Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-base tracking-tight leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                        {video.title || 'Community Montage Edit'}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                          {video.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>
                          {video.createdAt ? new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Featured Video'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(video)}
                        title="Copy video link"
                        className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        {copiedId === video.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
