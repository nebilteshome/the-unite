import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AccountSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, loading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile data
  const [address, setAddress] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user && supabase) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('shipping_address').eq('id', user.id).single();
      if (data) {
        setAddress(data.shipping_address || '');
      } else if (error && error.code === 'PGRST116') {
        // user role doesnt exist yet, create one
        await supabase.from('profiles').insert({ id: user.id, email: user.email });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError('Database not connected.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthError('Check your email to verify your account, or sign in if confirm email is disabled.');
      }
    }
    setAuthLoading(false);
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
    if (supabase) await supabase.auth.signOut();
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
                <div className="space-y-8 mt-4">
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
                      className="w-full bg-black text-white p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {profileLoading ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </div>
              ) : (
                // LOGGED OUT VIEW
                <div className="bg-white p-8 border border-[#e5e5e5] mt-4">
                  <div className="flex justify-center mb-6">
                    <Lock className="w-8 h-8 opacity-20" />
                  </div>
                  <form onSubmit={handleAuth} className="space-y-4">
                    {authError && <p className="text-red-500 text-[10px] font-bold uppercase p-3 bg-red-500/10 border border-red-500/20">{authError}</p>}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-[#f4f4f4] border border-[#e5e5e5] p-3 text-sm focus:outline-none focus:border-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-[#f4f4f4] border border-[#e5e5e5] p-3 text-sm focus:outline-none focus:border-black"
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className="w-full bg-black text-white p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors mt-4"
                    >
                      {authLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>
                  <div className="mt-6 pt-6 border-t border-[#e5e5e5] text-center">
                    <button 
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                    >
                      {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
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
