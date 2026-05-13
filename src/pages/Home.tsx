import React, { useEffect, useState } from 'react';
import { supabase, Category, Product } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

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

const CategoryBlock: React.FC<{ category: Category, products: Product[] }> = ({ category, products }) => {
  const { addToCart } = useCart();
  
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
             <Link to="/shop" className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-2.5 font-bold text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors w-full sm:w-auto text-center">
               Shop Mens
             </Link>
             <Link to="/shop" className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-2.5 font-bold text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors w-full sm:w-auto text-center">
               Shop Womens
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
                   {/* We simulate cropped clothes by setting mix-blend-multiply on white background images to drop out white */}
                   {/* Primary image */}
                   <img 
                     src={p.image_url} 
                     alt={p.name} 
                     className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-100 group-hover:opacity-0" 
                   />
                   {/* Hover image */}
                   <img 
                     src={p.hover_image_url || p.image_url} 
                     alt={p.name} 
                     className="w-full h-full object-contain mix-blend-multiply absolute inset-0 opacity-0 group-hover:opacity-100" 
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 p-6">
                     <button 
                       onClick={(e) => {
                         e.preventDefault();
                         addToCart(p);
                       }}
                       className="bg-black text-white w-full py-4 text-xs font-semibold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                     >
                       Quick Add
                     </button>
                   </div>
                   <button className="absolute bottom-4 right-4 text-gray-500 hover:text-black transition-colors z-0">
                     <Plus className="w-6 h-6 font-light stroke-[1.5]" />
                   </button>
                </div>
                <div className="flex flex-col">
                   <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-sm leading-snug text-brand-ink group-hover:underline pr-4">{p.name}</h3>
                      <span className="font-semibold text-sm tabular-nums">${p.price}</span>
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
         <Link to="/shop" className="bg-black text-white px-8 py-3.5 font-bold text-[11px] uppercase tracking-widest hover:opacity-80 transition-opacity whitespace-nowrap">
           Shop All {category.name}
         </Link>
      </div>
    </div>
  );
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
        const [{ data: cats, error: catError }, { data: prods, error: prodError }] = await Promise.all([
          supabase.from('categories').select('*').order('order_index', { ascending: true }),
          supabase.from('products').select('*')
        ]);
        
        if (catError || prodError) throw catError || prodError;

        if (cats && cats.length > 0) {
          setCategories(cats);
          setProducts(prods || []);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-ink/20 border-t-brand-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-brand-bg w-full">
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
