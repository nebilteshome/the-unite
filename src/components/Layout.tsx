import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Bookmark, Search, User, ShoppingBag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { cn } from '../lib/utils';
import AccountSidebar from './AccountSidebar';
import CartSidebar from './CartSidebar';
import SearchSidebar from './SearchSidebar';
import FavoritesSidebar from './FavoritesSidebar';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';

export default function Layout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const location = useLocation();
  const { items, isCartOpen, openCart, closeCart } = useCart();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, currency, setCurrency, favorites } = usePersonalization();
  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setIsPastHero(window.scrollY > window.innerHeight - 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg relative flex flex-col font-sans pb-[env(safe-area-inset-bottom)]">
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 pointer-events-none pt-[env(safe-area-inset-top)]",
          !mobileMenuOpen ? "mix-blend-difference text-white" : "bg-brand-bg text-brand-ink"
        )}
      >
        <div className="w-full px-4 md:px-6 flex items-center justify-between py-4 pointer-events-auto">
          
          {/* Left Nav */}
          <nav className="hidden md:flex items-center gap-8 w-1/3">
            <Link to="/shop" className="text-[10px] font-semibold hover:opacity-70 transition-opacity uppercase tracking-widest">
              Shop
            </Link>
            <Link to="/collections" className="text-[10px] font-semibold hover:opacity-70 transition-opacity flex items-center gap-1 uppercase tracking-widest">
              247 <Zap className="w-3 h-3 fill-current" />
            </Link>
          </nav>

          {/* Center Logo */}
          <div className="w-1/3 flex justify-center">
            <Link to="/" className="flex items-center group z-50 relative overflow-hidden h-[30px]">
              <AnimatePresence mode="wait">
                {(!isPastHero || !isHome) ? (
                  <motion.span 
                    key="full-logo"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="font-extrabold text-lg md:text-xl tracking-tighter uppercase whitespace-nowrap leading-none mt-1"
                  >
                    Thee Unite
                  </motion.span>
                ) : (
                  <motion.span 
                    key="u-logo"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="font-extrabold text-xl md:text-2xl tracking-tighter uppercase leading-none mt-1"
                  >
                    U
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Right Nav */}
          <div className="flex items-center justify-end gap-5 w-1/3">
            <nav className="hidden xl:flex items-center gap-6 mr-4 uppercase tracking-widest">
              <Link to="/" className="text-[9px] font-bold hover:opacity-70 transition-opacity">Retail</Link>
              <Link to="/gallery" className="text-[9px] font-bold hover:opacity-70 transition-opacity">The Vault</Link>
              <Link to="/" className="text-[9px] font-bold hover:opacity-70 transition-opacity">Prestige</Link>
              <select 
                value={currency.code} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-[9px] font-bold outline-none border-none cursor-pointer uppercase tracking-widest"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="UGX">UGX (USh)</option>
              </select>
            </nav>

            <div className="flex items-center gap-3">
              {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && (
                <SignedIn>
                  <div className="relative">
                    <button 
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="relative hover:opacity-70 transition-opacity hidden md:block"
                    >
                      <Bell className="w-3.5 h-3.5 stroke-[2]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1.5 bg-brand-light text-brand-ink text-[7px] font-bold w-2.5 h-2.5 rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-4 w-80 bg-white border border-[#e5e5e5] shadow-xl p-4 text-brand-ink overflow-hidden"
                        >
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#f4f4f4]">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest">Notifications</h3>
                            <button onClick={() => markAllAsRead()} className="text-[8px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Mark all read</button>
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto hide-scrollbar space-y-3">
                            {notifications.length === 0 ? (
                              <p className="text-[10px] opacity-40 py-4 text-center">No notifications yet</p>
                            ) : (
                              notifications.map(n => (
                                <div 
                                  key={n.id} 
                                  onClick={() => markAsRead(n.id)}
                                  className={cn(
                                    "p-3 rounded-sm transition-colors cursor-pointer",
                                    n.is_read ? "bg-transparent opacity-60" : "bg-[#f4f4f4]"
                                  )}
                                >
                                  <p className="text-[10px] font-bold uppercase mb-1">{n.title}</p>
                                  <p className="text-[10px] leading-relaxed mb-1">{n.message}</p>
                                  <p className="text-[8px] opacity-40 uppercase">{new Date(n.created_at).toLocaleDateString()}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button onClick={() => setFavOpen(true)} className="relative hover:opacity-70 transition-opacity hidden md:block">
                    <Bookmark className="w-3.5 h-3.5 stroke-[2]" />
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-bold w-2.5 h-2.5 rounded-full flex items-center justify-center">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                </SignedIn>
              )}

              <button onClick={() => setSearchOpen(true)} className="hover:opacity-70 transition-opacity">
                <Search className="w-3.5 h-3.5 stroke-[2]" />
              </button>

              <button className="hover:opacity-70 transition-opacity hidden md:block" onClick={() => setAccountOpen(true)}>
                 <User className="w-3.5 h-3.5 stroke-[2]" />
              </button>

              {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && (
                <SignedIn>
                  <div className="hidden md:block scale-90 -mr-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              )}

              {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && (
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-[9px] font-bold uppercase tracking-widest bg-transparent border border-current px-4 py-2 hover:bg-white hover:text-black transition-all hidden md:block">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
              )}

              <button onClick={openCart} className="relative hover:opacity-70 transition-opacity">
                 <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
                 {cartItemCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-brand-light text-brand-ink text-[7px] font-bold w-2.5 h-2.5 rounded-full flex items-center justify-center">
                     {cartItemCount}
                   </span>
                 )}
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden z-50 relative ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 stroke-[2]" /> : <Menu className="w-4 h-4 stroke-[2]" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-brand-bg flex flex-col pt-24 pb-8 overflow-y-auto"
          >
            <nav className="flex flex-col gap-6 w-full px-6 font-bold text-sm tracking-widest uppercase text-brand-ink mb-12">
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
              <Link to="/collections" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">247 <Zap className="w-4 h-4 fill-current" /></Link>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Retail</Link>
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>The Vault</Link>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Prestige</Link>
            </nav>

            <div className="mt-auto px-6 space-y-8">
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => { setFavOpen(true); setMobileMenuOpen(false); }}
                  className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b border-brand-ink/10 pb-4"
                >
                  <span>Wishlist</span>
                  <span className="opacity-40">{favorites.length} Items</span>
                </button>
                <div className="flex items-center justify-between border-b border-brand-ink/10 pb-4">
                  <button 
                    onClick={() => { setAccountOpen(true); setMobileMenuOpen(false); }}
                    className="text-[10px] font-bold uppercase tracking-widest"
                  >
                    <span>Account</span>
                  </button>
                  <div className="flex items-center gap-4">
                    {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && (
                      <SignedIn>
                        <div className="scale-90">
                          <UserButton afterSignOutUrl="/" />
                        </div>
                      </SignedIn>
                    )}
                    {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && (
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button className="text-[10px] font-bold uppercase tracking-widest bg-transparent border border-brand-ink/20 px-4 py-2 hover:border-brand-ink transition-all">
                            Sign In
                          </button>
                        </SignInButton>
                      </SignedOut>
                    )}
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <select 
                  value={currency.code} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent text-[10px] font-bold outline-none border-none cursor-pointer uppercase tracking-widest"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="UGX">UGX (USh)</option>
                </select>
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="opacity-40 text-[9px] font-bold uppercase tracking-widest">Admin</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-brand-ink text-brand-bg py-20 mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 font-medium">
          <div className="md:col-span-2">
            <h3 className="font-extrabold text-3xl tracking-tighter mb-6 uppercase">Thee Unite</h3>
            <p className="text-sm opacity-70 max-w-sm leading-relaxed">
              Curated luxury for the modern seas. Refined cruising apparel and timeless collections.
            </p>
          </div>
          <div>
            <h4 className="uppercase text-xs font-bold tracking-widest text-[#666] mb-6">Shop</h4>
            <nav className="flex flex-col gap-4 text-sm opacity-80">
              <Link to="/shop" className="hover:opacity-100 transition-opacity">Mens</Link>
              <Link to="/shop" className="hover:opacity-100 transition-opacity">Womens</Link>
              <Link to="/collections" className="hover:opacity-100 transition-opacity">Collections</Link>
            </nav>
          </div>
          <div>
            <h4 className="uppercase text-xs font-bold tracking-widest text-[#666] mb-6">Support</h4>
            <nav className="flex flex-col gap-4 text-sm opacity-80">
              <Link to="/" className="hover:opacity-100 transition-opacity">Help Center</Link>
              <Link to="/" className="hover:opacity-100 transition-opacity">Returns</Link>
              <Link to="/admin" className="hover:opacity-100 transition-opacity text-brand-bg">Admin</Link>
            </nav>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs opacity-50 font-medium">
          <p>&copy; {new Date().getFullYear()} Thee Unite. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
             <Link to="/">Terms</Link>
             <Link to="/">Privacy</Link>
          </div>
        </div>
      </footer>
      {/* Account Sidebar */}
      <AccountSidebar isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
      {/* Search Sidebar */}
      <SearchSidebar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* Favorites Sidebar */}
      <FavoritesSidebar isOpen={favOpen} onClose={() => setFavOpen(false)} />
    </div>
  );
}
