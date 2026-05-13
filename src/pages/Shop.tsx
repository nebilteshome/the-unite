import React, { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { addToCart, isCartOpen, openCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data);
      } catch (err: any) {
        if (err?.message !== "Invalid API key") {
          console.error("Failed to load products in shop", err);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (!supabase) {
    return (
      <div className="pt-32 px-6 max-w-[1600px] mx-auto min-h-screen">
        <h1 className="font-extrabold text-3xl md:text-5xl tracking-tighter mb-12 uppercase">All Pieces</h1>
        <p className="opacity-50 text-sm tracking-wide font-medium">Database not connected. Shop is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="pt-40 max-w-[1600px] mx-auto min-h-screen relative px-6">
      <div className="flex justify-between items-center mb-12">
        <h1 className="font-extrabold text-3xl md:text-5xl tracking-tighter uppercase">All Pieces</h1>
        <button 
          onClick={openCart}
          className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold border border-brand-ink px-6 py-3 hover:bg-brand-ink hover:text-brand-bg transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Bag
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse flex gap-8">
          <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 h-[400px] bg-brand-ink/5"></div>
          <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 h-[400px] bg-brand-ink/5"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#e5e5e5]">
          {products.length === 0 ? (
            <p className="opacity-50 text-sm tracking-wide font-medium p-6 border-b border-r border-[#e5e5e5] col-span-full">No pieces available yet.</p>
          ) : (
            products.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group flex flex-col border-b border-[#e5e5e5] border-r sm:odd:border-r sm:even:border-r-0 lg:border-r-auto lg:[&:nth-child(4n)]:border-r-0 p-6 pb-8 relative cursor-pointer"
              >
                <div className="aspect-[4/5] relative mb-6 flex items-center justify-center p-4 bg-[#f4f4f4]">
                  {/* Primary image */}
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-100 group-hover:opacity-0"
                  />
                  {/* Hover image */}
                  <img 
                    src={product.hover_image_url || product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-0 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 p-6">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product);
                      }}
                      className="bg-black text-white w-full py-4 text-xs font-semibold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                      Quick Add
                    </button>
                  </div>
                  <button className="absolute bottom-4 right-4 text-gray-500 hover:text-black z-0">
                    <Plus className="w-7 h-7 font-light stroke-[1.5]" />
                  </button>
                </div>
                <div className="flex flex-col">
                   <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-[15px] leading-snug text-brand-ink group-hover:underline pr-4">{product.name}</h3>
                      <span className="font-semibold text-[15px] tabular-nums">${product.price.toFixed(2)}</span>
                   </div>
                   <p className="text-[13px] text-gray-500 font-medium">{product.description}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
