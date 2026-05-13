import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { supabase, Product } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function SearchSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || !supabase) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(10);
        
        if (data) {
          setResults(data);
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col font-sans"
          >
            <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-3 w-full mr-4 border border-[#e5e5e5] px-3 py-2 bg-[#f4f4f4]">
                <Search className="w-4 h-4 text-gray-500 stroke-[1.5]" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="SEARCH PRODUCTS..."
                  className="w-full bg-transparent border-none outline-none text-[10px] uppercase font-bold tracking-widest placeholder-gray-400"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="p-1 hover:opacity-50">
                    <X className="w-3 h-3 stroke-[2]" />
                  </button>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:opacity-50 transition-opacity flex-shrink-0">
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-brand-bg space-y-4">
              {loading ? (
                <div className="flex justify-center mt-12">
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                results.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/shop`} 
                    onClick={onClose}
                    className="flex gap-4 bg-white p-3 border border-[#e5e5e5] hover:border-black transition-colors group"
                  >
                    <div className="w-16 h-20 bg-[#f4f4f4] flex items-center justify-center border border-[#e5e5e5] group-hover:bg-white transition-colors">
                       <img src={product.image_url} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-bold text-[11px] leading-snug tracking-tight uppercase group-hover:underline">{product.name}</h3>
                      <p className="font-bold text-[10px] text-gray-500 uppercase mt-1">${product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))
              ) : query.trim() ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4 mt-12">
                  <Search className="w-8 h-8 stroke-[1]" />
                  <p className="font-bold text-[10px] uppercase tracking-widest text-center">No results found for "{query}"</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 mt-12">
                  <p className="font-bold text-[10px] uppercase tracking-widest text-center">Start typing to search</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
