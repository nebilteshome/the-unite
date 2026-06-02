import React, { useEffect, useState } from 'react';
import { supabase, Collection } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('collections').select('*').order('created_at', { ascending: false });
      setCollections(data || []);
      setLoading(false);
    }
    fetchCollections();
  }, []);

  if (loading) {
    return <div className="pt-40 px-6 min-h-screen flex items-center justify-center">Loading Collections...</div>;
  }

  return (
    <div className="pt-40 px-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col mb-16">
        <h1 className="font-extrabold text-3xl md:text-5xl uppercase tracking-tighter mb-4">Collections</h1>
        <div className="w-20 h-1 bg-black"></div>
      </div>

      {collections.length === 0 ? (
        <p className="opacity-50 text-sm font-medium">No collections found. Curated sets coming soon...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {collections.map((coll, i) => (
            <motion.div 
              key={coll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[16/9] overflow-hidden bg-[#f4f4f4] mb-6">
                <img 
                  src={coll.image_url} 
                  alt={coll.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-bold text-2xl uppercase tracking-tight mb-2 group-hover:underline">{coll.title}</h3>
              <p className="text-sm opacity-60 font-medium uppercase tracking-widest">{coll.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
