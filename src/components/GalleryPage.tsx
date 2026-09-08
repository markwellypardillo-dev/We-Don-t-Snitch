import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { GalleryCar, getGalleryCars } from '../lib/galleryStorage';

interface Props {
  onBackToHome: () => void;
}

export const GalleryPage: React.FC<Props> = ({ onBackToHome }) => {
  const [cars, setCars] = useState<GalleryCar[]>(getGalleryCars());

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'instant' });

    const handleUpdate = () => setCars(getGalleryCars());
    window.addEventListener('wds_gallery_changed', handleUpdate);
    return () => window.removeEventListener('wds_gallery_changed', handleUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white relative flex flex-col transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-neutral-50 dark:bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.1)_0%,transparent_60%)] opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-24 w-full flex-1">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <button
              onClick={onBackToHome}
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-4 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tighter">
              Car Showcase
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
              A curated collection of the cleanest, most distinguished builds owned by the elite members of the WDS Community.
            </p>
          </div>
        </div>

        {/* Gallery Grid - Clean, minimal layout */}
        {cars.length === 0 ? (
          <div className="w-full py-32 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-neutral-200/60 dark:bg-white/5 border-transparent dark:border-white/10 flex items-center justify-center mb-6">
              <span className="text-3xl text-neutral-400 dark:text-neutral-500">📸</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No cars showcased yet</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
              Our elite members are still polishing their builds. Check back soon for the latest updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            <AnimatePresence>
              {cars.map((car, idx) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] bg-neutral-200 dark:bg-neutral-900 rounded-xl overflow-hidden mb-4 shadow-sm dark:shadow-none border-transparent dark:border-white/5">
                    {car.imageUrl && (car.imageUrl.startsWith('data:video/') || car.imageUrl.startsWith('blob:') || car.imageUrl.match(/\.(mp4|webm|ogg)$/i)) ? (
                      <video src={car.imageUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    ) : (
                      <img src={car.imageUrl} alt={car.carName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" loading="lazy" />
                    )}
                    {/* Subtle inner shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </div>

                  {/* Clean Typography Section beneath the image */}
                  <div className="flex flex-col gap-0.5 px-1">
                    <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-wider leading-tight">
                      {car.carName}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      Built by <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{car.ownerName}</span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
