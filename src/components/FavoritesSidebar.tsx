import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useCart } from '../contexts/CartContext';
import { supabase, Product } from '../lib/supabase';

export default function FavoritesSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { favorites, toggleFavorite, formatPrice } = usePersonalization();
  const { addToCart } = useCart();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && favorites.length > 0 && supabase) {
      fetchFavoriteProducts();
    }
  }, [isOpen, favorites]);

  const fetchFavoriteProducts = async () => {
    setLoading(true);
    const { data } = await supabase!.from('products').select('*').in('id', favorites);
    setProducts(data || []);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} 
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col font-sans"
          >
            <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 stroke-[1.5] fill-red-500 stroke-red-500" />
                <h2 className="font-extrabold text-xl tracking-tighter uppercase">Wishlist</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:opacity-50 transition-opacity">
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-brand-bg space-y-4">
              {favorites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                  <Heart className="w-12 h-12 stroke-[1]" />
                  <p className="font-bold text-sm uppercase tracking-widest text-center">Your wishlist is empty.</p>
                </div>
              ) : loading ? (
                 <div className="space-y-4">
                   {[1,2,3].map(i => <div key={i} className="h-32 bg-white animate-pulse border border-[#e5e5e5]" />)}
                 </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="flex gap-4 bg-white p-4 border border-[#e5e5e5] group">
                    <div className="w-20 h-24 bg-[#f4f4f4] flex items-center justify-center border border-[#e5e5e5] overflow-hidden">
                       <img src={product.image_url} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col py-1">
                      <div className="flex justify-between items-start">
                        <div>
                           <h3 className="font-bold text-sm leading-snug tracking-tight uppercase pr-4">{product.name}</h3>
                           <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">{formatPrice(product.price)}</p>
                        </div>
                        <button onClick={() => toggleFavorite(product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4 stroke-[1.5]" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center gap-3">
                        <button 
                          onClick={() => addToCart(product)}
                          className="flex-1 bg-black text-white py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-3 h-3" /> Add to Bag
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
