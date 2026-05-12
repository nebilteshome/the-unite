import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function CartSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutState, setCheckoutState] = useState<'idle' | 'processing' | 'success'>('idle');

  const handleCheckout = async () => {
    if (!supabase) return alert("Database not connected. Cannot process order.");
    if (items.length === 0) return;

    setCheckoutState('processing');
    
    // Simplistic checkout
    let name = "Anonymous";
    let email = user?.email || "anon@example.com";

    if (!user) {
       const pName = prompt("Enter your full name for the order:");
       if (pName) name = pName;
       const pEmail = prompt("Enter your email address:");
       if (pEmail) email = pEmail;
    } else {
       // if logged in we can try to get name from profile, but let's stick to email for now
       name = "User " + email.split('@')[0];
    }

    try {
      await supabase.from('orders').insert({
        customer_name: name,
        customer_email: email,
        total: total,
        status: 'pending' // or 'completed'
      });
      setCheckoutState('success');
      clearCart();
      setTimeout(() => {
        setCheckoutState('idle');
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Checkout failed", err);
      setCheckoutState('idle');
      alert("Checkout failed. Please try again.");
    }
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
                <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                <h2 className="font-extrabold text-xl tracking-tighter uppercase">Your Cart</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:opacity-50 transition-opacity">
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-brand-bg space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                  <ShoppingBag className="w-12 h-12 stroke-[1]" />
                  <p className="font-bold text-sm uppercase tracking-widest text-center">Your cart is empty.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-4 bg-white p-4 border border-[#e5e5e5]">
                    <div className="w-20 h-24 bg-[#f4f4f4] flex items-center justify-center border border-[#e5e5e5]">
                       <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 flex flex-col py-1">
                      <div className="flex justify-between items-start">
                        <div>
                           <h3 className="font-bold text-sm leading-snug tracking-tight uppercase pr-4">{item.product.name}</h3>
                           <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">${item.product.price.toFixed(2)} {item.size ? `• Size: ${item.size}` : ''}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id, item.size)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4 stroke-[1.5]" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center gap-3">
                        <div className="flex items-center border border-[#e5e5e5]">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size)} className="px-3 py-1 font-bold text-sm hover:bg-[#f4f4f4]">-</button>
                          <span className="px-3 py-1 font-bold text-[11px] text-center min-w-[32px]">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)} className="px-3 py-1 font-bold text-sm hover:bg-[#f4f4f4]">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-[#e5e5e5] bg-white space-y-4">
                <div className="flex items-center justify-between font-bold text-sm tracking-tight uppercase">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-[10px] text-gray-500 tracking-widest uppercase">
                  <span>Shipping & Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={checkoutState !== 'idle'}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 uppercase tracking-widest text-[11px] font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {checkoutState === 'processing' ? 'Processing...' : checkoutState === 'success' ? 'Order Placed!' : `Checkout • $${total.toFixed(2)}`}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
