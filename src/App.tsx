/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ApplyPage from './components/ApplyPage';
import AdminPage from './components/AdminPage';
import { initAllFirestoreSyncs } from './lib/firestoreSync';
import MeetsPage from './components/MeetsPage';
import MontagesPage from './components/MontagesPage';
import AboutPage from './components/AboutPage';
import { GalleryPage } from './components/GalleryPage';
import { LogIn, Settings, Home, Camera, Menu, X, Users2, Film, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './lib/theme';

export default function App() {
  const { resolvedTheme } = useTheme();
  const [currentView, setCurrentView] = useState<'home' | 'meets' | 'montages' | 'gallery' | 'apply' | 'about' | 'admin'>(() => {
    const hash = window.location.hash.replace('#', '');
    return (['home', 'meets', 'montages', 'gallery', 'apply', 'about', 'admin'].includes(hash) ? hash : 'home') as 'home' | 'meets' | 'montages' | 'gallery' | 'apply' | 'about' | 'admin';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = initAllFirestoreSyncs();
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'meets', 'montages', 'gallery', 'apply', 'about', 'admin'].includes(hash)) {
        setCurrentView(hash as 'home' | 'meets' | 'montages' | 'gallery' | 'apply' | 'about' | 'admin');
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView]);

  const navigateTo = (view: 'home' | 'meets' | 'montages' | 'gallery' | 'apply' | 'about' | 'admin') => {
    window.location.hash = view;
    setIsMobileMenuOpen(false);
  };

  const navigateToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (currentView !== 'home') {
      window.location.hash = 'home';
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-neutral-900 dark:text-white font-sans selection:bg-red-500/20 transition-colors duration-200">
      {/* Background ambient light */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-red-500/[0.03] dark:bg-white/[0.03] blur-[100px]" />
      </div>

      <nav className="relative z-50 border-b border-transparent dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <button 
            type="button"
            className="flex items-center gap-3 text-left group min-h-[44px] cursor-pointer" 
            onClick={() => navigateTo('home')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-100 dark:bg-white/10 shadow-md shadow-black/10 dark:shadow-black/20 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
              <img 
                src="/received_1395385905883694.jpeg" 
                alt="WDS Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-black tracking-widest text-base sm:text-lg text-neutral-900 dark:text-white block leading-tight">WDS</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 tracking-widest uppercase font-medium">We Don't Snitch</span>
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-transparent/60 dark:border-white/5">
            <button 
              type="button"
              onClick={() => navigateTo('home')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                currentView === 'home' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Home</span>
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('meets')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                currentView === 'meets' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>Meets</span>
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('montages')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                currentView === 'montages' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span>Montages</span>
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('gallery')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                currentView === 'gallery' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Gallery</span>
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('apply')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                currentView === 'apply' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Apply</span>
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('about')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                currentView === 'about' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
              }`}
            >
              <Users2 className="w-3.5 h-3.5 shrink-0" />
              <span>About Us</span>
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                currentView === 'admin' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Admin</span>
            </button>
          </div>

          {/* Desktop Right: Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle variant="segmented" />
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/10 border-transparent dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-white/15 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-transparent dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl px-4 py-3 space-y-1.5 shadow-2xl transition-colors"
            >
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('meets')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  currentView === 'meets'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Meets Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('montages')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  currentView === 'montages'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Featured Montages</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('gallery')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  currentView === 'gallery'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Car Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('apply')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  currentView === 'apply'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Apply</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('about')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  currentView === 'about'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Users2 className="w-4 h-4" />
                <span>About Us</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Admin Portal</span>
              </button>

              <div className="pt-2 border-t border-transparent dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Theme</span>
                <ThemeToggle variant="segmented" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10 pb-16 sm:pb-24">
        <ErrorBoundary 
          key={currentView}
          fallbackTitle="Taking a Quick Pit Stop"
          fallbackMessage="We encountered a small hiccup loading this view. You can keep exploring the community without interruption!"
          onReset={() => setCurrentView('home')}
        >
          {currentView === 'home' && (
            <LandingPage 
              onApply={() => navigateTo('apply')} 
              onViewMeets={() => navigateTo('meets')} 
              onViewMontages={() => navigateTo('montages')}
              onAbout={() => navigateTo('about')} 
            />
          )}
          {currentView === 'meets' && <MeetsPage />}
          {currentView === 'montages' && <MontagesPage onBackToHome={() => navigateTo('home')} />}
          {currentView === 'gallery' && <GalleryPage onBackToHome={() => navigateTo('home')} />}
          {currentView === 'apply' && <ApplyPage />}
          {currentView === 'about' && <AboutPage onApply={() => navigateTo('apply')} />}
          {currentView === 'admin' && <AdminPage />}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-transparent dark:border-white/10 bg-slate-100/90 dark:bg-black/95 backdrop-blur-xl mt-auto transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-12">
            
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-white/10 shadow-md shadow-black/10 dark:shadow-black/20 overflow-hidden flex items-center justify-center">
                  <img 
                    src="/received_1395385905883694.jpeg" 
                    alt="WDS Logo" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="font-black tracking-widest text-lg text-neutral-900 dark:text-white block leading-tight">WDS</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 tracking-widest uppercase font-medium">We Don't Snitch</span>
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed">
                Elite CPM Drivers. Clean builds, competitive racing.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Quick Links</h3>
              <div className="flex flex-col gap-2.5">
                <button type="button" onClick={() => navigateTo('home')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">Home</button>
                <button type="button" onClick={() => navigateTo('meets')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">Meets Gallery</button>
                <button type="button" onClick={() => navigateTo('gallery')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">Car Gallery</button>
                <button type="button" onClick={() => navigateTo('montages')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">Featured Montages</button>
                <button type="button" onClick={() => navigateToSection('upcoming-events')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">Upcoming Events</button>
                <button type="button" onClick={() => navigateTo('apply')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">Join WDS</button>
                <button type="button" onClick={() => navigateTo('about')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">About Us</button>
                <button type="button" onClick={() => navigateTo('admin')} className="text-left text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:translate-x-1 transition-all w-fit cursor-pointer">Admin Portal</button>
              </div>
            </div>

            {/* Connect & Theme Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Appearance</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Choose your preferred interface theme:
              </p>
              <ThemeToggle variant="segmented" />
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-transparent dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} WDS Community. All rights reserved.
            </p>
            <p className="text-xs text-neutral-500">
              Not affiliated with Olzhass Games (CPM).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

