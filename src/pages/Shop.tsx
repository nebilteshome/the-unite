import React, { useState, useEffect, useRef } from 'react';
import { supabase, Product, Category } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Heart } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { cn } from '../lib/utils';

export default function Shop() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const scrollTapped = useRef(false);

  const { items, addToCart, isCartOpen, openCart } = useCart();
  const { isFavorite, toggleFavorite, formatPrice } = usePersonalization();

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const [{ data: catData }, { data: prodData }] = await Promise.all([
          supabase.from('categories').select('*').order('order_index', { ascending: true }),
          supabase.from('products').select('*').order('created_at', { ascending: false })
        ]);
        
        if (catData) setCategories(catData);
        if (prodData) setProducts(prodData);
      } catch (err: any) {
        if (err?.message !== "Invalid API key") {
          console.error("Failed to load data in shop", err);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && location.hash && !scrollTapped.current) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          scrollTapped.current = true;
        }, 100);
      }
    }
  }, [loading, location.hash]);

  if (!supabase) {
    return (
      <div className="pt-32 px-6 max-w-[1600px] mx-auto min-h-screen">
        <h1 className="font-extrabold text-3xl md:text-5xl tracking-tighter mb-12 uppercase">All Pieces</h1>
        <p className="opacity-50 text-sm tracking-wide font-medium">Database not connected. Shop is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="pt-32 md:pt-40 max-w-[1600px] mx-auto min-h-screen relative px-4 md:px-6">
      <div className="flex justify-between items-center mb-8 md:mb-12">
        <h1 className="font-extrabold text-2xl md:text-5xl tracking-tighter uppercase">Shop</h1>
        <button 
          onClick={openCart}
          className="flex items-center gap-2 uppercase tracking-widest text-[9px] md:text-[10px] font-bold border border-brand-ink bg-transparent text-brand-ink px-4 md:px-6 py-2.5 md:py-3 hover:bg-brand-ink hover:text-brand-bg transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5 md:w-4 h-4" />
          Bag
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#e5e5e5]">
          {[1,2,3,4,5,6,7,8].map(i => (
             <div key={i} className="aspect-[4/5] p-6 border-b border-r border-[#e5e5e5] relative overflow-hidden group">
                <div className="w-full h-full bg-[#f4f4f4] relative overflow-hidden">
                   <motion.div 
                     animate={{ x: ['-100%', '100%'] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                     className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                   />
                </div>
                <div className="mt-6 space-y-2">
                   <div className="h-4 bg-[#f4f4f4] w-2/3 rounded-sm overflow-hidden relative">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.1 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      />
                   </div>
                   <div className="h-4 bg-[#f4f4f4] w-1/4 rounded-sm overflow-hidden relative">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.2 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      />
                   </div>
                </div>
             </div>
          ))}
        </div>
      ) : (
        <div className="space-y-24 mb-24">
          {categories.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#e5e5e5]">
              <p className="opacity-50 text-sm tracking-wide font-medium p-6 border-b border-r border-[#e5e5e5] col-span-full">No collections available yet.</p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryProducts = products.filter(p => p.category_id === category.id);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} id={category.id} className="scroll-mt-32 md:scroll-mt-40">
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="font-extrabold text-xl md:text-3xl tracking-tighter uppercase">{category.name}</h2>
                    <div className="h-px flex-1 bg-[#e5e5e5]" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#e5e5e5]">
                    {categoryProducts.map((product, idx) => (
                      <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="group flex flex-col border-b border-r border-[#e5e5e5] p-4 md:p-6 pb-8 relative cursor-pointer touch-manipulation"
                      >
                        <div className="aspect-[4/5] relative mb-6 flex items-center justify-center p-4 bg-[#f4f4f4] overflow-hidden">
                          {/* Favorite Button */}
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(product.id);
                            }}
                            className="absolute top-3 right-3 md:top-4 md:right-4 z-20 hover:scale-110 transition-transform p-2"
                          >
                            <Heart 
                              className={cn(
                                "w-4 h-4 md:w-5 h-5 transition-colors",
                                isFavorite(product.id) ? "fill-red-500 stroke-red-500" : "stroke-gray-400"
                              )} 
                            />
                          </button>

                          {/* Primary image */}
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-100 transition-opacity duration-0 group-hover:opacity-0"
                          />
                          {/* Hover image */}
                          <img 
                            src={product.hover_image_url || product.image_url} 
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-0 transition-opacity duration-0 group-hover:opacity-100"
                          />
                          
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(product);
                            }}
                            className="absolute bottom-3 right-3 md:bottom-4 md:right-4 text-gray-400 hover:text-black transition-colors z-20"
                          >
                            <Plus className="w-5 h-5 md:w-6 md:h-6 font-light stroke-[1.5]" />
                          </button>
                        </div>
                        <div className="flex flex-col">
                           <div className="flex justify-between items-start mb-1 gap-2">
                              <h3 className="font-semibold text-sm md:text-[15px] leading-snug text-brand-ink group-hover:underline">{product.name}</h3>
                              <span className="font-semibold text-sm md:text-[15px] tabular-nums whitespace-nowrap">{formatPrice(product.price)}</span>
                           </div>
                           <p className="text-[12px] md:text-[13px] text-gray-500 font-medium line-clamp-1">{product.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sticky Mobile Checkout Button */}
      <AnimatePresence>
        {(items.length > 0 && !isCartOpen) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-40 md:hidden"
          >
            <button 
              onClick={openCart}
              className="w-full bg-white/80 backdrop-blur-md border border-brand-ink text-brand-ink py-4 rounded-none font-bold uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
              Checkout • {formatPrice(items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
