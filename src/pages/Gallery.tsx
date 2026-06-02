import React, { useEffect, useState } from 'react';
import { supabase, GalleryItem } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('gallery').select('*');
      
      // Randomize the order for a more "interesting" look
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      
      setItems(shuffled);
      setLoading(false);
    }
    fetchGallery();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-20">
      {/* Header */}
      <div className="px-6 max-w-[1800px] mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-white font-extrabold text-4xl md:text-6xl uppercase tracking-tighter leading-none mb-2">The Vault</h1>
          <div className="h-[2px] w-24 bg-white/20"></div>
        </div>
        <div className="hidden md:block">
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.4em]">Visual Archives • 2026</p>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="px-4 max-w-[1800px] mx-auto">
        {items.length === 0 ? (
          <div className="h-[50vh] flex items-center justify-center">
             <p className="text-white/20 text-sm font-bold uppercase tracking-widest">Archive Empty</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {items.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: i * 0.03, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="relative break-inside-avoid"
              >
                <div className="rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 group">
                  {item.video_url ? (
                    <video 
                      src={item.video_url} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <img 
                      src={item.image_url} 
                      alt="" 
                      className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  )}
                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-20 px-6 text-center">
        <p className="text-white/10 text-[8px] uppercase font-bold tracking-[0.5em]">Thee Unite • Unauthorized copying prohibited</p>
      </div>
    </div>
  );
}
