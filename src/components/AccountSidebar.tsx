import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, LogOut, Package, Heart, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { supabase, Order, Product } from '../lib/supabase';
import { cn } from '../lib/utils';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

export default function AccountSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, loading, signOut } = useAuth();
  const { favorites, toggleFavorite, formatPrice } = usePersonalization();
  
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Personalized data
  const [address, setAddress] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');

  useEffect(() => {
    if (user && supabase) {
      fetchProfile();
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (user && favorites.length > 0) {
      fetchWishlistItems();
    } else {
      setWishlistProducts([]);
    }
  }, [favorites, user]);

  const fetchProfile = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('shipping_address').eq('id', user.id).single();
      if (data) {
        setAddress(data.shipping_address || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    if (!user || !supabase) return;
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const fetchWishlistItems = async () => {
    if (!supabase || favorites.length === 0) return;
    const { data } = await supabase.from('products').select('*').in('id', favorites);
    setWishlistProducts(data || []);
  };

  const handleUpdateAddress = async () => {
    if (!user || !supabase) return;
    setProfileLoading(true);
    try {
      await supabase.from('profiles').upsert({ id: user.id, email: user.email, shipping_address: address });
      alert('Address saved!');
    } catch (e) {
      console.error(e);
    }
    setProfileLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
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
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-extrabold text-xl tracking-tighter uppercase">
                {user ? 'Your Account' : (isLogin ? 'Sign In' : 'Create Account')}
              </h2>
              <button onClick={onClose} className="p-2 hover:opacity-50 transition-opacity">
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-brand-bg">
              {loading ? (
                <div className="flex justify-center mt-12"><div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" /></div>
              ) : user ? (
                // LOGGED IN VIEW
                <div className="space-y-6 mt-4">
                  {/* Tabs */}
                  <div className="flex gap-6 border-b border-[#e5e5e5] pb-4">
                    {[
                      { id: 'profile', label: 'Profile', icon: Lock },
                      { id: 'orders', label: 'Orders', icon: Package },
                      { id: 'wishlist', label: 'Wishlist', icon: Heart }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-opacity",
                          activeTab === tab.id ? "opacity-100" : "opacity-40 hover:opacity-100"
                        )}
                      >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="bg-white p-6 border border-[#e5e5e5]">
                        <h3 className="font-bold text-sm tracking-tight uppercase mb-2">Profile</h3>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase">{user.email}</p>
                      </div>

                      <div className="bg-white p-6 border border-[#e5e5e5]">
                        <h3 className="font-bold text-sm tracking-tight uppercase mb-4">Shipping Address</h3>
                        <textarea 
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter your full shipping address..."
                          className="w-full bg-[#f4f4f4] border border-[#e5e5e5] p-3 text-sm focus:outline-none focus:border-black min-h-[100px] resize-none mb-4"
                        />
                        <button 
                          onClick={handleUpdateAddress}
                          disabled={profileLoading}
                          className="w-full bg-transparent border border-black text-black p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                        >
                          {profileLoading ? 'Saving...' : 'Save Address'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'orders' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      {orders.length === 0 ? (
                        <div className="bg-white p-12 border border-[#e5e5e5] text-center">
                          <Package className="w-8 h-8 mx-auto mb-4 opacity-10" />
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No orders yet</p>
                        </div>
                      ) : (
                        orders.map(order => (
                          <div key={order.id} className="bg-white p-6 border border-[#e5e5e5] flex justify-between items-center group cursor-pointer hover:border-black transition-colors">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-[12px] font-bold">{formatPrice(order.total)} &bull; {order.status}</p>
                              <p className="text-[9px] opacity-40 uppercase mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'wishlist' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      {wishlistProducts.length === 0 ? (
                        <div className="bg-white p-12 border border-[#e5e5e5] text-center">
                          <Heart className="w-8 h-8 mx-auto mb-4 opacity-10" />
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Wishlist empty</p>
                        </div>
                      ) : (
                        wishlistProducts.map(product => (
                          <div key={product.id} className="bg-white p-4 border border-[#e5e5e5] flex gap-4 items-center group relative">
                            <div className="w-16 h-20 bg-[#f4f4f4] flex-shrink-0 flex items-center justify-center p-2">
                              <img src={product.image_url} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-[12px] uppercase tracking-tight group-hover:underline cursor-pointer">{product.name}</h4>
                              <p className="text-[11px] font-bold">{formatPrice(product.price)}</p>
                            </div>
                            <button 
                              onClick={() => toggleFavorite(product.id)}
                              className="p-2 opacity-20 hover:opacity-100 hover:text-red-500 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // LOGGED OUT VIEW
                <div className="bg-white p-8 border border-[#e5e5e5] mt-4">
                  <div className="flex justify-center mb-6">
                    <Lock className="w-8 h-8 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">
                      {isLogin ? "Welcome back. Please sign in." : "Join the club. Create an account."}
                    </p>
                    
                    {isLogin ? (
                      <SignInButton mode="modal">
                        <button className="w-full bg-black text-white p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                          Sign In
                        </button>
                      </SignInButton>
                    ) : (
                      <SignUpButton mode="modal">
                        <button className="w-full bg-black text-white p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                          Create Account
                        </button>
                      </SignUpButton>
                    )}

                    <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
                      <button 
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                      >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="p-6 border-t border-gray-100 bg-white">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 border border-[#e5e5e5] py-4 uppercase tracking-widest text-[11px] font-bold hover:bg-[#f4f4f4] transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
