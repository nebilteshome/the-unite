import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Bookmark, Search, User, ShoppingBag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import AccountSidebar from './AccountSidebar';
import CartSidebar from './CartSidebar';
import SearchSidebar from './SearchSidebar';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { items, isCartOpen, openCart, closeCart } = useCart();
  const { user } = useAuth();
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
    <div className="min-h-screen bg-brand-bg relative flex flex-col font-sans">
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 pointer-events-none",
          !mobileMenuOpen ? "mix-blend-difference text-white" : "bg-brand-bg text-brand-ink"
        )}
      >
        <div className="w-full px-6 flex items-center justify-between py-4 pointer-events-auto">
          
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
              <button className="text-[9px] font-bold hover:opacity-70 transition-opacity">UG / USD</button>
            </nav>

            <div className="flex items-center gap-3">
              {user && (
                <>
                  <button className="relative hover:opacity-70 transition-opacity hidden md:block">
                    <Bell className="w-3.5 h-3.5 stroke-[2]" />
                    <span className="absolute -top-1 -right-1.5 bg-brand-light text-brand-ink text-[7px] font-bold w-2.5 h-2.5 rounded-full flex items-center justify-center">
                      4
                    </span>
                  </button>
                  <button className="hover:opacity-70 transition-opacity hidden md:block">
                    <Bookmark className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </>
              )}
              <button onClick={() => setSearchOpen(true)} className="hover:opacity-70 transition-opacity">
                <Search className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button className="hover:opacity-70 transition-opacity hidden md:block" onClick={() => setAccountOpen(true)}>
                 <User className="w-3.5 h-3.5 stroke-[2]" />
              </button>
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-brand-bg flex flex-col pt-24 pb-8"
          >
            <nav className="flex flex-col gap-6 w-full px-6 font-bold text-sm tracking-widest uppercase text-brand-ink">
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
              <Link to="/collections" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">247 <Zap className="w-4 h-4 fill-current" /></Link>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Retail</Link>
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>The Vault</Link>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Prestige</Link>
              <div className="h-px bg-brand-ink/10 my-2" />
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="opacity-60 text-xs">Admin</Link>
            </nav>
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
    </div>
  );
}
