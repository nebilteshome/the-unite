import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, Category, Product, Drop } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Clock, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import confetti from 'canvas-confetti';
import { useCart } from '../contexts/CartContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { cn } from '../lib/utils';

// Updated Fallback Data to match brand style
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Owners Club SS26',
    image_url: 'https://images.unsplash.com/photo-1512353087810-258ccf656322?ixlib=rb-4.0.3&auto=format&fit=crop&w=2500&q=80',
    order_index: 0,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Thee Unite X Belstaff',
    image_url: 'https://images.unsplash.com/photo-1620802051773-455bdaef30e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2500&q=80',
    order_index: 1,
    created_at: new Date().toISOString()
  }
];

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '101',
    category_id: '1',
    name: 'Thee Unite Zip Through Hoodie',
    description: 'Chalk   4 Colours',
    price: 215,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    hover_image_url: 'https://images.unsplash.com/photo-1572495532056-8583af1cbf11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '102',
    category_id: '1',
    name: 'Owners Club Hoodie',
    description: 'Sienna   4 Colours',
    price: 210,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    hover_image_url: 'https://images.unsplash.com/photo-1572495532056-8583af1cbf11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '103',
    category_id: '1',
    name: 'Owners Club Sweatpant',
    description: 'Jet Black   5 Colours',
    price: 175,
    image_url: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    hover_image_url: 'https://images.unsplash.com/photo-1584865288642-42078afe6942?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '104',
    category_id: '1',
    name: 'Owners Club Sweater',
    description: 'Sky Blue   4 Colours',
    price: 190,
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    hover_image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '201',
    category_id: '2',
    name: 'Rams x Thee Unite T-Shirt',
    description: 'Stained Black   4 Colours',
    price: 165,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    hover_image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '202',
    category_id: '2',
    name: 'Eagles x Thee Unite Hoodie',
    description: 'Vintage Grey   4 Colours',
    price: 270,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    hover_image_url: 'https://images.unsplash.com/photo-1572495532056-8583af1cbf11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  }
];

const CountdownTimer: React.FC<{ targetDate: string, onComplete?: () => void }> = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onComplete) onComplete();
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className="flex gap-4 md:gap-8 mt-8">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Mins', value: timeLeft.minutes },
        { label: 'Secs', value: timeLeft.seconds }
      ].map((item, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex flex-col items-center"
        >
          <span className="text-2xl md:text-5xl font-extrabold tracking-tighter text-white tabular-nums">
            {String(item.value).padStart(2, '0')}
          </span>
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/40 mt-2">
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

const DropHero: React.FC<{ drop: Drop }> = ({ drop }) => {
  const [isLive, setIsLive] = useState(false);

  const triggerCelebration = useCallback(() => {
    setIsLive(true);
    
    // Fireworks effect
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  // Check if already live on mount
  useEffect(() => {
    if (new Date(drop.release_date).getTime() <= new Date().getTime()) {
      setIsLive(true);
    }
  }, [drop.release_date]);

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {drop.video_url ? (
        <video src={drop.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-70" />
      ) : (
        <img src={drop.image_url} alt={drop.title} className="absolute inset-0 w-full h-full object-cover opacity-70" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <motion.span 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-[10px] md:text-[12px] font-bold uppercase tracking-[0.3em] mb-6 transition-colors duration-500",
            isLive ? "text-green-400" : "text-white animate-pulse"
          )}
        >
          {isLive ? '• Now Available' : 'Upcoming Drop'}
        </motion.span>
        
        <motion.h1 
          layout
          className="text-4xl md:text-7xl lg:text-8xl text-white font-extrabold tracking-tighter uppercase leading-none max-w-5xl"
        >
          {drop.title}
        </motion.h1>

        <AnimatePresence mode="wait">
          {!isLive ? (
            <motion.div
              key="timer"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              transition={{ duration: 0.8 }}
            >
              <CountdownTimer targetDate={drop.release_date} onComplete={triggerCelebration} />
            </motion.div>
          ) : (
            <motion.div
              key="live-action"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-12"
            >
              <Link to="/shop" className="bg-transparent border border-white text-white px-16 py-5 font-bold text-[12px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center gap-3 group">
                <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Shop Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {!isLive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12"
          >
            <button className="bg-transparent border border-white/30 backdrop-blur-md text-white px-12 py-4 font-bold text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Join Waitlist
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const CategoryBlock: React.FC<{ category: Category, products: Product[] }> = ({ category, products }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite, formatPrice } = usePersonalization();
  
  return (
    <div className="flex flex-col bg-brand-bg relative z-10 w-full mb-0 border-b-8 border-brand-bg">
      {/* Hero Section */}
      <div className="relative h-screen w-full flex items-center justify-center bg-black">
        {category.video_url ? (
          <video 
            src={category.video_url} 
            autoPlay 
            muted 
            loop 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <img 
            src={category.image_url} 
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center mt-auto pb-24 px-4 w-full">
          <h2 className="text-3xl md:text-5xl lg:text-6xl text-white font-extrabold tracking-tighter mb-8 drop-shadow-lg text-center max-w-4xl leading-tight">
            {category.name}
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
             <Link to={`/shop#${category.id}`} className="bg-transparent border border-white text-white px-12 py-3.5 font-bold text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors w-full sm:w-auto text-center">
               Shop
             </Link>
          </div>
        </div>
      </div>

      {/* Products Row Horizontal Scroll */}
      <div className="w-full bg-[#f4f4f4] pl-0 lg:pl-[2px]">
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
           {products.map((p, idx) => (
             <div 
                key={p.id}
                className="group flex-shrink-0 snap-start border-r border-[#e5e5e5] p-5 pb-6 relative w-[240px] sm:w-[280px] md:w-[320px] lg:w-[360px] cursor-pointer"
             >
                <div className="aspect-[4/5] relative mb-4 flex items-center justify-center p-3 bg-[#f4f4f4]">
                   {/* Favorite Button */}
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       toggleFavorite(p.id);
                     }}
                     className="absolute top-4 right-4 z-20 hover:scale-110 transition-transform"
                   >
                     <Heart 
                       className={cn(
                         "w-5 h-5",
                         isFavorite(p.id) ? "fill-red-500 stroke-red-500" : "stroke-gray-400"
                       )} 
                     />
                   </button>
                   
                   {/* We simulate cropped clothes by setting mix-blend-multiply on white background images to drop out white */}
                   {/* Primary image */}
                   <img 
                     src={p.image_url} 
                     alt={p.name} 
                     className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-100 group-hover:opacity-0 transition-opacity duration-0" 
                   />
                   {/* Hover image */}
                   <img 
                     src={p.hover_image_url || p.image_url} 
                     alt={p.name} 
                     className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-0" 
                   />
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       addToCart(p);
                     }}
                     className="absolute bottom-4 right-4 text-gray-400 hover:text-black transition-colors z-20"
                   >
                     <Plus className="w-6 h-6 font-light stroke-[1.5]" />
                   </button>
                </div>
                <div className="flex flex-col">
                   <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm leading-snug text-brand-ink group-hover:underline pr-4">{p.name}</h3>
                      <span className="font-semibold text-sm tabular-nums">{formatPrice(p.price)}</span>
                   </div>
                   <p className="text-[11px] text-gray-500 font-semibold uppercase">{p.description}</p>
                </div>
             </div>
           ))}
           {/* If products < 4, fill empty space to allow natural layout */}
           {products.length < 4 && (
             <div className="flex-1 border-r border-[#e5e5e5] hidden lg:block" />
           )}
        </div>
      </div>

      {/* Shop All Button Block */}
      <div className="flex justify-center py-16 bg-[#f4f4f4] border-t border-[#e5e5e5]">
         <Link to={`/shop#${category.id}`} className="bg-transparent border border-black text-black px-12 py-3.5 font-bold text-[11px] uppercase tracking-widest hover:bg-black hover:text-white transition-all whitespace-nowrap">
           Shop All {category.name}
         </Link>
      </div>
    </div>
  );
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setCategories(FALLBACK_CATEGORIES);
        setProducts(FALLBACK_PRODUCTS);
        setLoading(false);
        return;
      }

      try {
        const [
          { data: cats, error: catError }, 
          { data: prods, error: prodError },
          { data: dropData, error: dropError }
        ] = await Promise.all([
          supabase.from('categories').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('*'),
          supabase.from('drops').select('*').eq('is_active', true).order('release_date', { ascending: true })
        ]);
        
        if (catError || prodError || dropError) throw catError || prodError || dropError;

        if (cats && cats.length > 0) {
          setCategories(cats);
          setProducts(prods || []);
          setDrops(dropData || []);
        } else {
          setCategories(FALLBACK_CATEGORIES);
          setProducts(FALLBACK_PRODUCTS);
        }
      } catch (err: any) {
        if (err?.message !== "Invalid API key") {
          console.error("Failed to fetch data:", err);
        }
        setCategories(FALLBACK_CATEGORIES);
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeDrop = useMemo(() => {
    if (drops.length === 0) return null;
    // Return first upcoming drop
    return drops[0];
  }, [drops]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-ink/20 border-t-brand-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-brand-bg w-full">
      {/* Show active drop if exists */}
      {activeDrop && <DropHero drop={activeDrop} />}

      {categories.map((category) => (
        <CategoryBlock 
          key={category.id} 
          category={category} 
          products={products.filter(p => p.category_id === category.id)} 
        />
      ))}

      {/* Ensure Supabase Setup Notice */}
      {!supabase && (
        <div className="fixed bottom-4 right-4 bg-white border border-brand-ink/10 text-brand-ink p-4 shadow-xl text-xs z-50 max-w-sm rounded-lg">
          <p className="font-bold text-sm mb-2">Database Disconnected</p>
          <p className="opacity-70 font-medium">
            Currently showing preview layout pattern. Please provide Supabase credentials in your env settings to enable the Admin panel and manage real data.
          </p>
        </div>
      )}
    </div>
  );
}
