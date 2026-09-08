import { saveToFirestore } from './firestoreSync';

export interface FeaturedVideo {
  id: string;
  type?: 'embed';
  url: string;
  title: string;
  description: string;
  createdAt?: string;
}

export const DEFAULT_FEATURED_VIDEOS: FeaturedVideo[] = [
  {
    id: 'vid-default-1',
    type: 'embed',
    url: 'https://www.youtube.com/embed/P6e612pXk6g',
    title: 'WDS Midnight Drift & Touge Battle Edit',
    description: 'High-speed tandem passes, mountain road drifts, and synchronized squad entries.',
    createdAt: new Date('2026-08-25').toISOString()
  },
  {
    id: 'vid-default-2',
    type: 'embed',
    url: 'https://www.youtube.com/embed/5aQoK_a27b8',
    title: 'Highway Roll Racing & VIP Stance Showcase',
    description: 'Clean builds, aerodynamic fitment showcase, and rolling shots across the highway tunnel loop.',
    createdAt: new Date('2026-08-22').toISOString()
  }
];

const STORAGE_KEY = 'wds_featured_video';

export function formatVideoEmbedUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return '';

  // If user pasted full iframe tag, extract src
  const iframeMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    url = iframeMatch[1];
  }

  // YouTube match: regular, share, shorts, embed, live
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // TikTok match: video ID from tiktok.com/@user/video/123456 or embed/v2/123456
  const ttMatch = url.match(/(?:tiktok\.com\/.*\/video\/|tiktok\.com\/embed(?:\/v2)?\/)(\d+)/i);
  if (ttMatch && ttMatch[1]) {
    return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
  }

  // Streamable match: streamable.com/abcde -> streamable.com/e/abcde
  const streamableMatch = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (streamableMatch && streamableMatch[1]) {
    return `https://streamable.com/e/${streamableMatch[1]}`;
  }

  // Google Drive match: drive.google.com/file/d/FILE_ID/view -> preview
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
  }

  // Vimeo match: vimeo.com/123456 -> player.vimeo.com/video/123456
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
}

export function isDirectVideoUrl(url: string, _type?: string): boolean {
  if (!url) return false;
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)) return true;
  return false;
}

export function isPlayableVideoUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

export function getFeaturedVideos(): FeaturedVideo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const list: FeaturedVideo[] = [];
        for (let idx = 0; idx < parsed.length; idx++) {
          const item = parsed[idx];
          if (!item) continue;
          const rawUrl = item.url || '';
          if (rawUrl.startsWith('idb:') || rawUrl.startsWith('local-upload:')) {
            continue;
          }
          const formatted = formatVideoEmbedUrl(rawUrl);
          if (formatted) {
            list.push({
              id: item.id || `video-${idx}-${Date.now()}`,
              type: 'embed',
              url: formatted,
              title: item.title || 'Community Montage',
              description: item.description || '',
              createdAt: item.createdAt || new Date().toISOString()
            });
          }
        }
        return list;
      }
    }
  } catch (error) {
    console.error('Failed to load featured videos from storage:', error);
  }
  return DEFAULT_FEATURED_VIDEOS;
}

export function getFeaturedVideo(): FeaturedVideo | null {
  const list = getFeaturedVideos();
  return list.length > 0 ? list[0] : null;
}

export function saveFeaturedVideos(videos: FeaturedVideo[]): void {
  try {
    const cleanVideos: FeaturedVideo[] = videos.map(v => ({
      id: v.id || `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'embed' as const,
      url: formatVideoEmbedUrl(v.url),
      title: (v.title || '').trim() || 'Community Montage',
      description: (v.description || '').trim(),
      createdAt: v.createdAt || new Date().toISOString()
    })).filter(v => Boolean(v.url));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanVideos));
    window.dispatchEvent(new Event('wds_featured_video_changed'));
    saveToFirestore('video', cleanVideos);
  } catch (error) {
    console.error('Failed to save featured videos:', error);
  }
}

export function saveFeaturedVideo(video: FeaturedVideo | null): void {
  if (video) {
    saveFeaturedVideos([video]);
  } else {
    saveFeaturedVideos([]);
  }
}
