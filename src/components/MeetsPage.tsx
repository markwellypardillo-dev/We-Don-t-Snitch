import { useState, useEffect, useMemo, useRef, useDeferredValue, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { CarMeetPhoto } from '../types';
import { getStoredMeets, saveStoredMeets } from '../data/defaultMeets';
import { 
  getActiveUser, 
  setActiveUser, 
  verifyUserCredentials, 
  VerifiedUser
} from '../lib/authVerification';
import { 
  Camera, 
  Plus, 
  MapPin, 
  Calendar, 
  Heart, 
  Trash2,
  Edit2, 
  X, 
  Upload, 
  Search, 
  User, 
  ShieldCheck, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CPM_LOCATIONS = [
  'All Locations',
  'City Underground',
  'Airport Track',
  'Highway Tunnel',
  'Mountain Pass',
  'Desert Strip',
  'City Center',
  'Port Docks'
];

export default function MeetsPage() {
  const [meets, setMeets] = useState<CarMeetPhoto[]>(() => getStoredMeets());

  useEffect(() => {
    const handleMeetsChanged = () => setMeets(getStoredMeets());
    window.addEventListener('wds_meets_changed', handleMeetsChanged);
    return () => window.removeEventListener('wds_meets_changed', handleMeetsChanged);
  }, []);
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMeetId, setEditingMeetId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<CarMeetPhoto | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<VerifiedUser | null>(() => getActiveUser());
  const [authRole, setAuthRole] = useState<'member' | 'admin'>('member');
  const [authNameOrEmail, setAuthNameOrEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('City Underground');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hostOrSquad, setHostOrSquad] = useState(() => currentUser?.name || 'WDS Member');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize active photo images array (handles single imageUrl or multi imageUrls)
  const activeImages = useMemo(() => {
    if (!activePhoto) return [];
    if (activePhoto.imageUrls && activePhoto.imageUrls.length > 0) {
      return activePhoto.imageUrls.filter(Boolean);
    }
    return activePhoto.imageUrl ? [activePhoto.imageUrl] : [];
  }, [activePhoto]);

  // Keep lightbox index within valid bounds when switching photos
  useEffect(() => {
    if (currentLightboxIndex >= activeImages.length) {
      setCurrentLightboxIndex(0);
    }
  }, [activeImages, currentLightboxIndex]);

  const goToNextPhoto = () => {
    if (activeImages.length <= 1) return;
    setCurrentLightboxIndex(prev => (prev + 1) % activeImages.length);
  };

  const goToPrevPhoto = () => {
    if (activeImages.length <= 1) return;
    setCurrentLightboxIndex(prev => (prev - 1 + activeImages.length) % activeImages.length);
  };

  // Touch gesture swiping for mobile devices
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeImages.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeImages.length <= 1) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = (touchStartY.current || 0) - (touchEndY.current || 0);

    // Dominant horizontal swipe (> 25px)
    if (Math.abs(deltaX) > 25 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swiped left -> show next photo
        goToNextPhoto();
      } else {
        // Swiped right -> show previous photo
        goToPrevPhoto();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Keyboard navigation for desktop and tablet users
  useEffect(() => {
    if (!activePhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNextPhoto();
      if (e.key === 'ArrowLeft') goToPrevPhoto();
      if (e.key === 'Escape') setActivePhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, activeImages.length]);


  useEffect(() => {
    if (currentUser?.name) {
      setHostOrSquad(currentUser.name);
    }
  }, [currentUser]);

  const handleOpenAddModal = () => {
    const verified = getActiveUser();
    if (!verified) {
      setIsAuthModalOpen(true);
      setAuthError('');
      setAuthSuccessMsg('');
    } else {
      setCurrentUser(verified);
      setEditingMeetId(null);
      setTitle('');
      setLocation('City Underground');
      setDate(new Date().toISOString().split('T')[0]);
      setHostOrSquad(verified.name || 'WDS Member');
      setDescription('');
      setImageUrls([]);
      setCurrentUrlInput('');
      setIsAddModalOpen(true);
    }
  };

  const handleOpenEditModal = (meet: CarMeetPhoto) => {
    const verified = getActiveUser() || currentUser;
    if (!verified) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentUser(verified);
    setEditingMeetId(meet.id);
    setTitle(meet.title);
    setLocation(meet.location);
    setDate(meet.date);
    setHostOrSquad(meet.hostOrSquad || verified.name);
    setDescription(meet.description || '');
    setImageUrls(meet.imageUrls || [meet.imageUrl]);
    setCurrentUrlInput('');
    setIsAddModalOpen(true);
  };

  const handleVerifyUser = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (authRole === 'admin') {
      const res = await verifyUserCredentials(authNameOrEmail || 'pmarkwelly@gmail.com', authPassword);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setAuthSuccessMsg('Admin verified.');
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setIsAddModalOpen(true);
          setAuthPassword('');
        }, 500);
      } else {
        setAuthError(res.error || 'Invalid credentials.');
      }
    } else {
      const res = await verifyUserCredentials(authNameOrEmail);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setAuthSuccessMsg(`Welcome, ${res.user.name}.`);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setIsAddModalOpen(true);
        }, 500);
      } else {
        setAuthError(res.error || 'Member not found in roster.');
      }
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setCurrentUser(null);
    setIsAddModalOpen(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      setUploadError('Please select valid image files only.');
      return;
    }

    const maxLimitBytes = 10 * 1024 * 1024; // 10MB
    const oversized = validFiles.find(f => f.size > maxLimitBytes);
    if (oversized) {
      setUploadError('Each image size must be under 10MB.');
      return;
    }

    setUploadError('');
    const newImageUrls: string[] = [];
    let loadedCount = 0;

    // Compresses photos cleanly so high-res files (up to 10MB) stay lightweight and performant in Firestore/localStorage
    const compressImage = (dataUrl: string, callback: (compressed: string) => void) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          callback(compressed);
        } else {
          callback(dataUrl);
        }
      };
      img.onerror = () => callback(dataUrl);
      img.src = dataUrl;
    };

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          compressImage(result, (compressed) => {
            newImageUrls.push(compressed);
            loadedCount++;
            if (loadedCount === validFiles.length) {
              setImageUrls(prev => [...prev, ...newImageUrls]);
            }
          });
        } else {
          loadedCount++;
          if (loadedCount === validFiles.length) {
            setImageUrls(prev => [...prev, ...newImageUrls]);
          }
        }
      };
      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setImageUrls(prev => [...prev, ...newImageUrls]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = () => {
    if (currentUrlInput.trim() && currentUrlInput.startsWith('http')) {
      setImageUrls(prev => [...prev, currentUrlInput.trim()]);
      setCurrentUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

    const handleSaveMeet = (e: FormEvent) => {
    e.preventDefault();
    const verified = getActiveUser() || currentUser;
    if (!verified) {
      setIsAddModalOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    const finalImages = [...imageUrls];
    if (currentUrlInput.trim()) {
      finalImages.push(currentUrlInput.trim());
    }
    if (finalImages.length === 0) {
      setUploadError('Please upload at least one photo or provide an image URL.');
      return;
    }

    if (!title.trim()) {
      setUploadError('Please enter a title for the meet.');
      return;
    }

    let updated;
    if (editingMeetId) {
      updated = meets.map(m => 
        m.id === editingMeetId 
          ? { 
              ...m, 
              title: title.trim(),
              imageUrl: finalImages[0],
              imageUrls: finalImages,
              date: date || m.date,
              location: location.trim(),
              hostOrSquad: hostOrSquad.trim(),
              description: description.trim(),
            }
          : m
      );
    } else {
      const newMeet: CarMeetPhoto = {
        id: `meet-${Date.now()}`,
        title: title.trim(),
        imageUrl: finalImages[0],
        imageUrls: finalImages,
        date: date || new Date().toISOString().split('T')[0],
        location: location.trim() || 'CPM Meet Ground',
        hostOrSquad: hostOrSquad.trim() || verified.name,
        description: description.trim(),
        likes: 1,
        createdAt: Date.now()
      };
      updated = [newMeet, ...meets];
    }

    setMeets(updated);
    saveStoredMeets(updated);
    setIsAddModalOpen(false);
    setEditingMeetId(null);
    setTitle('');
    setLocation('City Underground');
    setDate(new Date().toISOString().split('T')[0]);
    setHostOrSquad(verified.name || 'WDS Member');
    setDescription('');
    setImageUrls([]);
    setCurrentUrlInput('');
    setCurrentLightboxIndex(0);
    setUploadError('');
  };

  const handleDeleteMeet = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const verified = getActiveUser() || currentUser;
    if (!verified) {
      setIsAuthModalOpen(true);
      return;
    }

    if (window.confirm('Delete this photo?')) {
      const updated = meets.filter(m => m.id !== id);
      setMeets(updated);
      saveStoredMeets(updated);
      if (activePhoto?.id === id) {
        setActivePhoto(null);
      }
    }
  };

  const handleLikeMeet = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = meets.map(m => {
      if (m.id === id) {
        return { ...m, likes: (m.likes || 0) + 1 };
      }
      return m;
    });
    setMeets(updated);
    saveStoredMeets(updated);
    if (activePhoto && activePhoto.id === id) {
      setActivePhoto(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
    }
  };

  const filteredMeets = useMemo(() => {
    return meets.filter(meet => {
      const meetLoc = (meet.location || '').toLowerCase();
      const meetTitle = (meet.title || '').toLowerCase();
      const meetHost = (meet.hostOrSquad || '').toLowerCase();
      const meetDesc = (meet.description || '').toLowerCase();
      const query = deferredSearchQuery.trim().toLowerCase();

      const matchesLoc = selectedLocation === 'All Locations' || meetLoc.includes(selectedLocation.toLowerCase());
      const matchesSearch = !query || 
        meetTitle.includes(query) || 
        meetLoc.includes(query) ||
        meetHost.includes(query) ||
        meetDesc.includes(query);
      return matchesLoc && matchesSearch;
    });
  }, [meets, selectedLocation, deferredSearchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 sm:space-y-12">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-transparent dark:border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Community Gallery</span>
            {currentUser && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-300 font-medium">
                Verified: {currentUser.name}
                <button onClick={handleLogout} className="ml-1.5 underline hover:text-red-600 dark:hover:text-white cursor-pointer text-[10px]">Logout</button>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">Car Meets</h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
            Snapshots and moments from our daily Car Parking Multiplayer meets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="min-h-[42px] px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs sm:text-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Meet</span>
        </button>
      </section>

      {/* Filter & Search */}
      <section className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meets..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border-transparent dark:border-white/10 shadow-sm text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {CPM_LOCATIONS.map(loc => (
            <button
              key={loc}
              type="button"
              onClick={() => setSelectedLocation(loc)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedLocation === loc
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm'
                  : 'bg-neutral-200/80 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section>
        {filteredMeets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-transparent dark:border-white/10 bg-white/50 dark:bg-white/[0.02] p-10 text-center space-y-3">
            <Camera className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">No meets found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMeets.map((meet) => (
              <motion.div
                key={meet.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => { setActivePhoto(meet); setCurrentLightboxIndex(0); }}
                className="group rounded-2xl bg-white dark:bg-white/[0.03] border-transparent dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/20 backdrop-blur-md overflow-hidden flex flex-col hover:border-transparent dark:hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={meet.imageUrl}
                    alt={meet.title || 'Meet Photo'}
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

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleLikeMeet(meet.id, e)}
                      className="w-7 h-7 rounded-lg bg-black/70 flex items-center justify-center text-white hover:text-white/80 transition-colors"
                      title="Like Meet"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white/20" />
                    </button>
                    {currentUser?.role === 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(meet); }}
                          className="w-7 h-7 rounded-lg bg-black/70 flex items-center justify-center text-neutral-400 hover:text-red-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteMeet(meet.id, e)}
                          className="w-7 h-7 rounded-lg bg-black/70 flex items-center justify-center text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      {meet.date}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {meet.imageUrls && meet.imageUrls.length > 1 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600/90 text-white font-bold text-[10px] shadow-sm backdrop-blur-sm">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{meet.imageUrls.length}</span>
                        </span>
                      )}
                      {meet.hostOrSquad && (
                        <span className="truncate max-w-[100px] text-neutral-300 font-mono text-[10px]">
                          {meet.hostOrSquad}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-1">
                    {meet.title}
                  </h3>
                  <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-red-500/20 text-red-600 dark:fill-white/20 dark:text-white" />
                      <strong className="text-neutral-900 dark:text-white">{meet.likes || 0}</strong>
                    </span>
                    <span className="flex items-center text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      Details <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Verification Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-950 border-transparent dark:border-white/10 p-5 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-transparent dark:border-white/10">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>Verify Identity</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-100 dark:bg-white/5 text-xs">
                <button
                  type="button"
                  onClick={() => { setAuthRole('member'); setAuthError(''); }}
                  className={`py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                    authRole === 'member' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthRole('admin'); setAuthError(''); }}
                  className={`py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                    authRole === 'admin' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Admin
                </button>
              </div>

              <form onSubmit={handleVerifyUser} className="space-y-3">
                {authRole === 'member' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">In-Game Name (IGN)</label>
                    <input
                      type="text"
                      value={authNameOrEmail}
                      onChange={(e) => setAuthNameOrEmail(e.target.value)}
                      placeholder="e.g. WDS_MARK"
                      className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      required
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Admin Email</label>
                      <input
                        type="email"
                        value={authNameOrEmail}
                        onChange={(e) => setAuthNameOrEmail(e.target.value)}
                        placeholder="pmarkwelly@gmail.com"
                        className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Password</label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                        required
                      />
                    </div>
                  </div>
                )}

                {authError && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-transparent p-2 rounded-lg">
                    {authError}
                  </p>
                )}

                {authSuccessMsg && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-transparent p-2 rounded-lg">
                    {authSuccessMsg}
                  </p>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    className="px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Photo Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-950 border-transparent dark:border-white/10 p-5 space-y-4 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-transparent dark:border-white/10">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">{editingMeetId ? 'Edit Meet' : 'Post Meet Photo'}</h2>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMeet} className="space-y-3">
                {/* Upload or URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Photo</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-transparent dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/40 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer bg-neutral-50 dark:bg-white/[0.02] hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-all min-h-[80px]"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className="w-4 h-4 text-neutral-500 dark:text-neutral-300 mb-1" />
                      <span className="text-xs text-neutral-800 dark:text-white font-medium">Upload File</span>
                    </div>

                    <div className="flex flex-col justify-center p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-transparent">
                      <input
                        type="url"
                        value={currentUrlInput}
                        onChange={(e) => setCurrentUrlInput(e.target.value)}
                        onBlur={handleAddUrl}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                        placeholder="Paste image URL & Enter"
                        className="w-full bg-white dark:bg-black/60 border-transparent dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      />
                    </div>
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden aspect-video bg-neutral-900 border-transparent dark:border-white/10">
                          <img src={url} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-1 right-1 p-0.5 rounded-md bg-black/70 text-white hover:bg-black cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Meet Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Tunnel Pulls & Stance Meet"
                    className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. City Underground"
                      className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Host / Squad</label>
                  <input
                    type="text"
                    value={hostOrSquad}
                    onChange={(e) => setHostOrSquad(e.target.value)}
                    placeholder="e.g. WDS Official or Squad Name"
                    className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief notes..."
                    className="w-full bg-neutral-50 dark:bg-black/60 border-transparent dark:border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
                  />
                </div>

                {uploadError && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-transparent p-2 rounded-lg">
                    {uploadError}
                  </p>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer"
                  >
                    {editingMeetId ? 'Save Changes' : 'Publish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activePhoto && (
          <div 
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl bg-white dark:bg-neutral-950 border-transparent dark:border-white/10 overflow-hidden shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image Carousel with Touch Swipe Support */}
              <div 
                className="relative max-h-[65vh] min-h-[280px] bg-black flex items-center justify-center select-none overflow-hidden touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Photo Counter Badge */}
                {activeImages.length > 1 && (
                  <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5 pointer-events-none">
                    <Layers className="w-3.5 h-3.5 text-red-400" />
                    <span>{currentLightboxIndex + 1} / {activeImages.length}</span>
                  </div>
                )}

                {/* Left Chevron Button - Always visible on mobile & desktop */}
                {activeImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevPhoto();
                    }}
                    className="absolute left-2.5 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl border border-white/15 backdrop-blur-md"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}

                {/* Active Image */}
                <div className="w-full h-full flex items-center justify-center p-1">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentLightboxIndex}
                      src={activeImages[currentLightboxIndex] || ''}
                      alt={activePhoto.title || 'Car Meet'}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop';
                      }}
                      className="max-h-[65vh] w-full object-contain pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                </div>

                {/* Right Chevron Button - Always visible on mobile & desktop */}
                {activeImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextPhoto();
                    }}
                    className="absolute right-2.5 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl border border-white/15 backdrop-blur-md"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}

                {/* Pagination Dots */}
                {activeImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-xl">
                    {activeImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentLightboxIndex(i);
                        }}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          i === currentLightboxIndex ? 'w-5 bg-red-500 shadow-sm' : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to photo ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2 bg-white dark:bg-neutral-950 border-t border-transparent dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">{activePhoto.title}</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>{activePhoto.location}</span>
                      <span>•</span>
                      <span>{activePhoto.date}</span>
                      {activePhoto.hostOrSquad && (
                        <>
                          <span>•</span>
                          <span>{activePhoto.hostOrSquad}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleLikeMeet(activePhoto.id, e)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-red-500/20 text-red-600 dark:fill-white/20 dark:text-white" />
                    <span>{activePhoto.likes || 0}</span>
                  </button>
                </div>
                {activePhoto.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-white/5">
                    {activePhoto.description}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
