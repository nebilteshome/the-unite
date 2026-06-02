import React, { useState, useEffect } from 'react';
import { supabase, Category, Product, Order, Collection, GalleryItem, Drop } from '../lib/supabase';
import { RefreshCw, Plus, Trash2, Edit3, Image as ImageIcon, Lock, LogOut, X, Video, Film, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SignInButton } from '@clerk/clerk-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'orders' | 'collections' | 'gallery' | 'drops'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const { user, loading, isAdmin, signOut } = useAuth();
  
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showDropForm, setShowDropForm] = useState(false);
  
  const [catForm, setCatForm] = useState({ name: '', image_url: '', video_url: '' });
  const [prodForm, setProdForm] = useState({ name: '', description: '', price: '', image_url: '', category_id: '', images: [] as string[], stock_count: '0' });
  const [collForm, setCollForm] = useState({ title: '', description: '', image_url: '' });
  const [gallForm, setGallForm] = useState({ title: '', description: '', image_url: '', video_url: '' });
  const [dropForm, setDropForm] = useState({ title: '', release_date: '', image_url: '', video_url: '', is_active: true });

  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'category_media' | 'product_image' | 'collection_image' | 'gallery_batch' | 'drop_media') => {
    const files = e.target.files;
    if (!files || files.length === 0 || !supabase) return;

    if (type === 'gallery_batch') {
      setUploadProgress({ current: 0, total: files.length });
      const itemsToInsert = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          itemsToInsert.push({
            [isVideo ? 'video_url' : 'image_url']: publicUrl,
            title: '',
            description: ''
          });
          
          setUploadProgress({ current: i + 1, total: files.length });
        } catch (error: any) {
          console.error(`Error uploading file ${file.name}:`, error.message);
        }
      }

      if (itemsToInsert.length > 0) {
        const { error } = await supabase.from('gallery').insert(itemsToInsert);
        if (error) alert("Error saving gallery items: " + error.message);
        fetchAll();
      }
      
      setUploadProgress(null);
      return;
    }

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (type === 'category_media') {
        if (isVideo) {
          setCatForm({ ...catForm, video_url: publicUrl });
        } else {
          setCatForm({ ...catForm, image_url: publicUrl });
        }
      } else if (type === 'collection_image') {
        setCollForm({ ...collForm, image_url: publicUrl });
      } else if (type === 'drop_media') {
        if (isVideo) {
          setDropForm({ ...dropForm, video_url: publicUrl, image_url: '' });
        } else {
          setDropForm({ ...dropForm, image_url: publicUrl, video_url: '' });
        }
      } else {
        setProdForm(prev => ({ 
          ...prev, 
          image_url: prev.image_url || publicUrl,
          images: [...prev.images, publicUrl] 
        }));
      }
    } catch (error: any) {
      alert("Error uploading file: " + error.message);
    }
  };

  const fetchAll = async () => {
    if (!supabase) return;
    setLoadingItems(true);
    try {
      const [
        { data: catData, error: catError },
        { data: prodData, error: prodError },
        { data: orderData, error: orderError },
        { data: collData, error: collError },
        { data: gallData, error: gallError },
        { data: dropData, error: dropError }
      ] = await Promise.all([
        supabase.from('categories').select('*').order('order_index'),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('collections').select('*').order('created_at', { ascending: false }),
        supabase.from('gallery').select('*').order('created_at', { ascending: false }),
        supabase.from('drops').select('*').order('created_at', { ascending: false })
      ]);

      if (catError) throw catError;
      if (prodError) throw prodError;
      if (orderError) throw orderError;
      if (collError) throw collError;
      if (gallError) throw gallError;
      if (dropError) throw dropError;

      setCategories(catData || []);
      setProducts(prodData || []);
      setOrders(orderData || []);
      setCollections(collData || []);
      setGalleryItems(gallData || []);
      setDrops(dropData || []);
    } catch (err: any) {
      if (err?.message !== "Invalid API key") {
        console.error("Admin fetch error", err);
      }
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    try {
      // Convert local datetime-local string to absolute UTC ISO string
      const utcDate = new Date(dropForm.release_date).toISOString();
      const { error } = await supabase.from('drops').insert([{
        ...dropForm,
        release_date: utcDate
      }]);
      if (error) throw error;
      setShowDropForm(false);
      setDropForm({ title: '', release_date: '', image_url: '', video_url: '', is_active: true });
      fetchAll();
    } catch (err: any) {
      alert("Error adding drop: " + err.message);
    }
  };

  const handleDeleteDrop = async (id: string) => {
    if (!supabase || !confirm("Delete this drop?")) return;
    const { error } = await supabase.from('drops').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchAll();
  };

  const handleToggleDropActive = async (id: string, current: boolean) => {
    if (!supabase) return;
    const { error } = await supabase.from('drops').update({ is_active: !current }).eq('id', id);
    if (error) alert(error.message);
    else fetchAll();
  };

  useEffect(() => {
    if (user && supabase) {
      fetchAll();

      // Realtime Subscriptions
      const ordersChannel = supabase
        .channel('admin-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll())
        .subscribe();
      
      const productsChannel = supabase
        .channel('admin-products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAll())
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(productsChannel);
      };
    }
  }, [user]);

  const updateOrderStatus = async (id: string, status: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) alert("Failed to update status: " + error.message);
    else fetchAll();
  };

  const stats = {
    totalSales: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalProducts: products.length
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    try {
      const payload: any = {
        name: catForm.name,
        image_url: catForm.image_url || null,
        order_index: categories.length
      };
      
      if (catForm.video_url) {
        payload.video_url = catForm.video_url;
      }

      const { error } = await supabase.from('categories').insert(payload);

      if (error) throw error;

      setCatForm({ name: '', image_url: '', video_url: '' });
      setShowCategoryForm(false);
      fetchAll();
    } catch (error: any) {
      console.error("Error adding category:", error);
      alert("Error adding category: " + error.message);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    await supabase.from('products').insert({
      category_id: prodForm.category_id,
      name: prodForm.name,
      description: prodForm.description,
      price: parseFloat(prodForm.price || '0'),
      image_url: prodForm.image_url,
      images: prodForm.images,
      stock_count: parseInt(prodForm.stock_count || '0')
    });
    setProdForm({ name: '', description: '', price: '', image_url: '', category_id: '', images: [], stock_count: '0' });
    setShowProductForm(false);
    fetchAll();
  };

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    const { error } = await supabase.from('collections').insert({
      title: collForm.title,
      description: collForm.description,
      image_url: collForm.image_url
    });
    
    if (error) alert(error.message);
    else {
      setCollForm({ title: '', description: '', image_url: '' });
      setShowCollectionForm(false);
      fetchAll();
    }
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    const { error } = await supabase.from('gallery').insert({
      image_url: gallForm.image_url || null,
      video_url: gallForm.video_url || null
    });
    
    if (error) alert(error.message);
    else {
      setGallForm({ title: '', description: '', image_url: '', video_url: '' });
      setShowGalleryForm(false);
      fetchAll();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!supabase) return;
    if (window.confirm("Are you sure you want to delete this product?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchAll();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!supabase) return;
    if (window.confirm("Are you sure you want to delete this category? All its products might be affected.")) {
      await supabase.from('categories').delete().eq('id', id);
      fetchAll();
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!supabase) return;
    if (window.confirm("Are you sure you want to delete this collection?")) {
      await supabase.from('collections').delete().eq('id', id);
      fetchAll();
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!supabase) return;
    if (window.confirm("Are you sure you want to delete this gallery item?")) {
      await supabase.from('gallery').delete().eq('id', id);
      fetchAll();
    }
  };

  if (!supabase) {
    return (
      <div className="pt-40 px-6 max-w-4xl mx-auto min-h-screen text-center">
        <h1 className="font-extrabold text-3xl md:text-5xl uppercase tracking-tighter mb-8">Admin Dashboard</h1>
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-xl mx-auto">
          <p className="text-red-500 font-bold mb-4 uppercase tracking-widest text-sm">Supabase Connection Required</p>
          <p className="opacity-70 text-sm leading-relaxed text-left font-medium">
            To use the secure admin dashboard and manage the homepage layout, products, and orders, please connect your Supabase project.
            <br /><br />
            1. Provide your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.<br />
            2. Enable Email/Password Auth in Supabase, and create an Admin user.<br />
            3. Run the SQL schema to create <code>categories</code>, <code>products</code>, and <code>orders</code> tables.<br />
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="pt-40 px-6 max-w-[1600px] mx-auto min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="pt-40 px-6 max-w-md mx-auto min-h-screen">
        <div className="bg-[#f4f4f4] p-8 border border-[#e5e5e5]">
          <div className="flex justify-center mb-6">
            <Lock className="w-8 h-8 opacity-20" />
          </div>
          <h1 className="font-extrabold text-2xl uppercase tracking-tighter mb-6 text-center">Admin Access</h1>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Please sign in to continue</p>
            {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? (
              <SignInButton mode="modal">
                <button className="w-full bg-black text-white p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                  Sign In to Dashboard
                </button>
              </SignInButton>
            ) : (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
                Clerk configuration missing. Please add VITE_CLERK_PUBLISHABLE_KEY to .env
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="pt-40 px-6 max-w-[1600px] mx-auto min-h-screen flex flex-col items-center">
        <h1 className="font-extrabold text-3xl md:text-5xl uppercase tracking-tighter mb-8 text-center text-red-600">Access Denied</h1>
        <p className="opacity-70 text-sm leading-relaxed text-center font-medium max-w-lg mb-8">
          You are logged in as {user.email}, but you are not authorized to view the admin dashboard.
          You must be an administrator to access this area.
        </p>
        <button 
          onClick={signOut}
          className="bg-black text-white p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="pt-40 px-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-extrabold text-3xl md:text-5xl uppercase tracking-tighter">Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest hidden sm:block">{user.email}</span>
          <button 
            onClick={fetchAll}
            className="flex items-center gap-2 px-6 py-3 border border-[#e5e5e5] hover:border-black transition-colors uppercase tracking-widest text-[10px] font-bold"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button 
            onClick={signOut}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors uppercase tracking-widest text-[10px] font-bold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="flex gap-8 mb-12 border-b border-[#e5e5e5] pb-4 overflow-x-auto hide-scrollbar">
        {(['drops', 'categories', 'products', 'collections', 'gallery', 'orders'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`uppercase tracking-widest text-[11px] font-bold transition-opacity whitespace-nowrap ${activeTab === tab ? 'opacity-100 border-b-2 border-brand-ink pb-4 -mb-[18px]' : 'opacity-40 hover:opacity-100'}`}
          >
            {tab === 'categories' ? 'Categories (Home)' : tab === 'drops' ? 'New Drops' : tab}
          </button>
        ))}
      </div>

      {loadingItems ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-brand-ink/20 rounded max-w-md"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-brand-ink/20 rounded col-span-2"></div>
                <div className="h-2 bg-brand-ink/20 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-brand-ink/20 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 md:p-8 mb-20 border border-[#e5e5e5]">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total Sales', value: `$${stats.totalSales.toFixed(2)}` },
              { label: 'Total Orders', value: stats.totalOrders },
              { label: 'Pending', value: stats.pendingOrders },
              { label: 'Products', value: stats.totalProducts },
            ].map((s, i) => (
              <div key={i} className="bg-[#f9f9f9] p-4 border border-[#e5e5e5]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
                <p className="text-xl font-extrabold tracking-tighter">{s.value}</p>
              </div>
            ))}
          </div>

          {/* DROPS TAB */}
          {activeTab === 'drops' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-extrabold text-2xl uppercase tracking-tighter">New Drops / Announcements</h2>
                <button onClick={() => setShowDropForm(!showDropForm)} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors">
                  <Plus className="w-4 h-4" /> Create Drop
                </button>
              </div>

              {showDropForm && (
                <form onSubmit={handleAddDrop} className="mb-12 bg-[#f4f4f4] p-6 border border-[#e5e5e5]">
                  <h3 className="font-bold text-sm uppercase mb-4">Configure New Drop</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Drop Title / Category Name</label>
                        <input type="text" placeholder="e.g. Owners Club SS26" value={dropForm.title} onChange={e => setDropForm({...dropForm, title: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none bg-white" required />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Release Date & Time</label>
                        <input type="datetime-local" value={dropForm.release_date} onChange={e => setDropForm({...dropForm, release_date: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none bg-white" required />
                        <p className="text-[8px] text-gray-400 uppercase">Times are set in your local time and synced globally.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={dropForm.is_active} onChange={e => setDropForm({...dropForm, is_active: e.target.checked})} className="w-4 h-4 accent-black" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Active (Visible on Home)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Media (Image or Video)</label>
                      <div className="flex gap-6">
                        <div className="relative group">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Preview</p>
                          <div className="w-32 h-40 bg-white border border-[#e5e5e5] flex items-center justify-center overflow-hidden relative">
                            {dropForm.video_url ? (
                              <video src={dropForm.video_url} className="w-full h-full object-cover" muted />
                            ) : dropForm.image_url ? (
                              <img src={dropForm.image_url} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 opacity-10" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-4">
                          <label className="cursor-pointer bg-white border border-[#e5e5e5] px-4 py-3 text-[9px] font-bold uppercase tracking-widest hover:border-black transition-colors text-center">
                            Upload Media
                            <input type="file" accept="image/*,video/*" onChange={e => handleFileUpload(e, 'drop_media')} className="hidden" />
                          </label>
                          <p className="text-[8px] text-gray-400 max-w-[120px] uppercase leading-relaxed">Recommended: 16:9 or 4:5 ratio high resolution media.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button type="submit" className="bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                      Save Drop
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4">
                {drops.length === 0 ? (
                  <p className="text-sm opacity-40 text-center py-12">No drops configured yet.</p>
                ) : (
                  drops.map(drop => (
                    <div key={drop.id} className="flex flex-col md:flex-row items-center gap-6 p-4 border border-[#e5e5e5] hover:border-black transition-colors">
                      <div className="w-full md:w-32 h-20 bg-[#f4f4f4] overflow-hidden">
                        {drop.video_url ? (
                          <video src={drop.video_url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={drop.image_url} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-sm uppercase tracking-tight">{drop.title}</h4>
                          {!drop.is_active && <span className="bg-gray-200 text-[8px] font-bold uppercase px-1.5 py-0.5 tracking-widest">Draft</span>}
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(drop.release_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleDropActive(drop.id, drop.is_active)}
                          className={cn("px-4 py-2 text-[9px] font-bold uppercase tracking-widest border transition-colors", drop.is_active ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100" : "border-gray-200 text-gray-400 hover:border-black hover:text-black")}
                        >
                          {drop.is_active ? 'Visible' : 'Enable'}
                        </button>
                        <button onClick={() => handleDeleteDrop(drop.id)} className="p-2 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (

            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-extrabold text-2xl uppercase tracking-tighter">Homepage Categories</h2>
                <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>

              {showCategoryForm && (
                <form onSubmit={handleAddCategory} className="mb-8 bg-[#f4f4f4] p-6 border border-[#e5e5e5]">
                  <h3 className="font-bold text-sm uppercase mb-4">New Category</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Category Name</label>
                      <input type="text" placeholder="e.g. Owners Club SS26" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none bg-white" required />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Hero Media (Image or Video)</label>
                      <div className="flex flex-wrap gap-6">
                        {/* Image Preview */}
                        <div className="relative group">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Primary Image</p>
                          <div className="w-32 h-40 bg-white border border-[#e5e5e5] flex items-center justify-center overflow-hidden relative">
                            {catForm.image_url ? (
                              <>
                                <img src={catForm.image_url} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setCatForm({...catForm, image_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <ImageIcon className="w-8 h-8 opacity-10" />
                            )}
                          </div>
                        </div>

                        {/* Video Preview */}
                        <div className="relative group">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Hero Video (Optional)</p>
                          <div className="w-32 h-40 bg-white border border-[#e5e5e5] flex items-center justify-center overflow-hidden relative">
                            {catForm.video_url ? (
                              <>
                                <video src={catForm.video_url} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <Film className="w-6 h-6 text-white opacity-50" />
                                </div>
                                <button type="button" onClick={() => setCatForm({...catForm, video_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <Film className="w-8 h-8 opacity-10" />
                            )}
                          </div>
                        </div>

                        {/* Upload Button */}
                        <div className="flex flex-col justify-end">
                          <label className="w-32 h-40 border-2 border-dashed border-[#e5e5e5] flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors bg-white/50">
                            <Plus className="w-6 h-6 opacity-20" />
                            <span className="text-[8px] uppercase font-bold mt-2 opacity-40">Upload Media</span>
                            <input type="file" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'category_media')} className="hidden" />
                          </label>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="url" placeholder="Paste Image URL" value={catForm.image_url} onChange={e => setCatForm({...catForm, image_url: e.target.value})} className="border border-[#e5e5e5] p-2 text-[10px] focus:border-black outline-none bg-white" />
                        <input type="url" placeholder="Paste Video URL" value={catForm.video_url} onChange={e => setCatForm({...catForm, video_url: e.target.value})} className="border border-[#e5e5e5] p-2 text-[10px] focus:border-black outline-none bg-white" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-2">
                    <button type="submit" className="bg-black text-white px-8 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors">Save Category</button>
                    <button type="button" onClick={() => setShowCategoryForm(false)} className="px-8 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-100 border border-[#e5e5e5] transition-colors">Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {categories.length === 0 ? <p className="opacity-50 text-sm font-medium p-4 border border-[#e5e5e5]">No categories found. Start by adding one.</p> : null}
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between border border-[#e5e5e5] p-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-24 bg-[#e5e5e5] overflow-hidden flex-shrink-0 relative">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : cat.video_url ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/10">
                            <Film className="w-8 h-8 opacity-20" />
                          </div>
                        ) : (
                          <ImageIcon className="w-full h-full p-6 opacity-20" />
                        )}
                        {cat.video_url && (
                          <div className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-sm">
                            <Film className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg tracking-tight uppercase">{cat.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID: {cat.id}</p>
                          {cat.video_url && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 font-bold uppercase tracking-tighter">Video</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-3 text-brand-ink/40 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5 stroke-[1.5]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-extrabold text-2xl uppercase tracking-tighter">Products</h2>
                <button onClick={() => setShowProductForm(!showProductForm)} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {showProductForm && (
                <form onSubmit={handleAddProduct} className="mb-8 bg-[#f4f4f4] p-6 border border-[#e5e5e5]">
                  <h3 className="font-bold text-sm uppercase mb-4">New Product</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={prodForm.category_id} onChange={e => setProdForm({...prodForm, category_id: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" required>
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="text" placeholder="Product Name" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" required />
                    <input type="text" placeholder="Description/Variants (e.g. Jet Black 5 Colours)" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" required />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" step="0.01" placeholder="Price" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none w-full" required />
                      <input type="number" placeholder="Stock Count" value={prodForm.stock_count} onChange={e => setProdForm({...prodForm, stock_count: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none w-full" required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Product Images (First one is main)</label>
                      <div className="flex flex-wrap gap-4 mb-4">
                        {prodForm.images.map((img, i) => (
                          <div key={i} className="relative w-20 h-24 bg-white border border-[#e5e5e5]">
                            <img src={img} className="w-full h-full object-contain" />
                            <button 
                              type="button"
                              onClick={() => setProdForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className="w-20 h-24 border-2 border-dashed border-[#e5e5e5] flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors">
                          <Plus className="w-6 h-6 opacity-20" />
                          <span className="text-[8px] uppercase font-bold mt-1 opacity-40">Add</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'product_image')} className="hidden" />
                        </label>
                      </div>
                      <input type="url" placeholder="Add Image URL instead" className="w-full border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setProdForm(prev => ({ 
                              ...prev, 
                              image_url: prev.image_url || val,
                              images: [...prev.images, val] 
                            }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }} />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" className="bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800">Save Product</button>
                    <button type="button" onClick={() => setShowProductForm(false)} className="px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-100 border border-[#e5e5e5]">Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {products.length === 0 ? <p className="opacity-50 text-sm font-medium p-4 border border-[#e5e5e5]">No products found.</p> : null}
                {products.map((prod) => {
                  const cat = categories.find(c => c.id === prod.category_id);
                  return (
                    <div key={prod.id} className="flex items-center justify-between border border-[#e5e5e5] p-4 bg-[#f9f9f9]">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-24 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center p-2 border border-[#e5e5e5]">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <ImageIcon className="w-full h-full p-4 opacity-20" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lg tracking-tight uppercase">{prod.name}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                             <p className="text-[11px] font-bold text-gray-500 uppercase">${prod.price.toFixed(2)} &bull; {cat?.name || 'Unknown'}</p>
                             
                             <div className="flex items-center gap-2">
                               <div className={cn(
                               "px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter",
                               prod.stock_count <= 5 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                             )}>
                               Stock: {prod.stock_count}
                             </div>
                          </div>
                        </div>
                      </div>
                      </div>
                      <button onClick={() => handleDeleteProduct(prod.id)} className="p-3 text-brand-ink/40 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5 stroke-[1.5]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COLLECTIONS TAB */}
          {activeTab === 'collections' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-extrabold text-2xl uppercase tracking-tighter">Collections</h2>
                <button onClick={() => setShowCollectionForm(!showCollectionForm)} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors">
                  <Plus className="w-4 h-4" /> Add Collection
                </button>
              </div>

              {showCollectionForm && (
                <form onSubmit={handleAddCollection} className="mb-8 bg-[#f4f4f4] p-6 border border-[#e5e5e5]">
                  <h3 className="font-bold text-sm uppercase mb-4">New Collection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Collection Title" value={collForm.title} onChange={e => setCollForm({...collForm, title: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" required />
                    <input type="text" placeholder="Description" value={collForm.description} onChange={e => setCollForm({...collForm, description: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" required />
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Collection Image</label>
                      <input type="url" placeholder="Image URL" value={collForm.image_url} onChange={e => setCollForm({...collForm, image_url: e.target.value})} className="w-full border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none mb-2" required />
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'collection_image')} className="text-xs" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" className="bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800">Save Collection</button>
                    <button type="button" onClick={() => setShowCollectionForm(false)} className="px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-100 border border-[#e5e5e5]">Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {collections.length === 0 ? <p className="opacity-50 text-sm font-medium p-4 border border-[#e5e5e5]">No collections found.</p> : null}
                {collections.map((coll) => (
                  <div key={coll.id} className="flex items-center justify-between border border-[#e5e5e5] p-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-white overflow-hidden flex-shrink-0 border border-[#e5e5e5]">
                        {coll.image_url ? (
                          <img src={coll.image_url} alt={coll.title} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-full h-full p-6 opacity-20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg tracking-tight uppercase">{coll.title}</p>
                        <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">{coll.description}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCollection(coll.id)} className="p-3 text-brand-ink/40 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5 stroke-[1.5]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-extrabold text-2xl uppercase tracking-tighter">The Vault (Gallery)</h2>
                <div className="flex gap-4">
                   <label className="flex items-center gap-2 bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" /> Batch Upload (Images/Videos)
                    <input type="file" multiple accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'gallery_batch')} className="hidden" />
                  </label>
                  <button onClick={() => setShowGalleryForm(!showGalleryForm)} className="flex items-center gap-2 border border-[#e5e5e5] px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-100 transition-colors">
                    <Edit3 className="w-4 h-4" /> Single Add
                  </button>
                </div>
              </div>

              {uploadProgress && (
                <div className="mb-8 p-4 bg-brand-ink/5 border border-brand-ink/10">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Uploading Media...</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest">{uploadProgress.current} / {uploadProgress.total}</p>
                  </div>
                  <div className="w-full h-1 bg-gray-200">
                    <div 
                      className="h-full bg-black transition-all duration-300" 
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {showGalleryForm && (
                <form onSubmit={handleAddGalleryItem} className="mb-8 bg-[#f4f4f4] p-6 border border-[#e5e5e5]">
                  <h3 className="font-bold text-sm uppercase mb-4">New Gallery Item</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-wrap gap-6">
                      {/* Image Preview */}
                      <div className="relative group">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Image</p>
                        <div className="w-32 h-40 bg-white border border-[#e5e5e5] flex items-center justify-center overflow-hidden relative rounded-md">
                          {gallForm.image_url ? (
                            <>
                              <img src={gallForm.image_url} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setGallForm({...gallForm, image_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="w-8 h-8 opacity-10" />
                          )}
                        </div>
                      </div>

                      {/* Video Preview */}
                      <div className="relative group">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Video</p>
                        <div className="w-32 h-40 bg-white border border-[#e5e5e5] flex items-center justify-center overflow-hidden relative rounded-md">
                          {gallForm.video_url ? (
                            <>
                              <video src={gallForm.video_url} className="w-full h-full object-cover" muted />
                              <button type="button" onClick={() => setGallForm({...gallForm, video_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <Film className="w-8 h-8 opacity-10" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Image URL</label>
                        <input type="url" placeholder="Paste Image URL" value={gallForm.image_url} onChange={e => setGallForm({...gallForm, image_url: e.target.value})} className="w-full border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none bg-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Video URL</label>
                        <input type="url" placeholder="Paste Video URL" value={gallForm.video_url} onChange={e => setGallForm({...gallForm, video_url: e.target.value})} className="w-full border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none bg-white" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button type="submit" className="bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800">Save Item</button>
                    <button type="button" onClick={() => setShowGalleryForm(false)} className="px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-100 border border-[#e5e5e5]">Cancel</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {galleryItems.length === 0 ? <p className="col-span-full opacity-50 text-sm font-medium p-4 border border-[#e5e5e5]">No gallery items found.</p> : null}
                {galleryItems.map((item) => (
                  <div key={item.id} className="relative group aspect-[3/4] bg-[#f9f9f9] border border-[#e5e5e5] overflow-hidden rounded-md">
                    {item.video_url ? (
                      <video src={item.video_url} className="w-full h-full object-cover" muted />
                    ) : item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-full h-full p-8 opacity-10" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => handleDeleteGalleryItem(item.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.video_url && (
                      <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded-sm">
                        <Film className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              <div className="mb-8">
                <h2 className="font-extrabold text-2xl uppercase tracking-tighter">Orders</h2>
                <p className="text-sm opacity-60 mt-2 max-w-2xl font-medium">
                  Recent customer orders are populated here.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="uppercase tracking-widest text-[10px] font-bold text-gray-500 border-b border-[#e5e5e5]">
                     <tr>
                      <th className="pb-4">Order ID</th>
                      <th className="pb-4">Customer</th>
                      <th className="pb-4">Total</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 min-w-32">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-opacity-50 font-medium border-b border-[#e5e5e5]">No orders yet.</td>
                      </tr>
                    ) : null}
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#f4f4f4] transition-colors">
                        <td className="py-4 font-mono text-[11px] font-medium">{order.id.split('-')[0]}</td>
                        <td className="py-4 font-semibold">{order.customer_name} <br/><span className="text-[11px] text-gray-500 font-normal">{order.customer_email}</span></td>
                        <td className="py-4 font-bold">${order.total.toFixed(2)}</td>
                        <td className="py-4">
                          <select 
                            value={order.status} 
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={cn(
                              "px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer",
                              order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-brand-ink/10 text-brand-ink'
                            )}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-4 text-xs font-medium text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
