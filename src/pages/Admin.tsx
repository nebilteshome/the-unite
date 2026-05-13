import React, { useState, useEffect } from 'react';
import { supabase, Category, Product, Order } from '../lib/supabase';
import { RefreshCw, Plus, Trash2, Edit3, Image as ImageIcon, Lock, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'orders' | 'collections' | 'gallery'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const { user, loading, session, isAdmin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  
  const [catForm, setCatForm] = useState({ name: '', image_url: '', video_url: '' });
  const [prodForm, setProdForm] = useState({ name: '', description: '', price: '', image_url: '', category_id: '', images: [] as string[] });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'category_image' | 'category_video' | 'product_image') => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (type === 'category_image') {
        setCatForm({ ...catForm, image_url: publicUrl });
      } else if (type === 'category_video') {
        setCatForm({ ...catForm, video_url: publicUrl });
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
      const [catRes, prodRes, orderRes] = await Promise.all([
        supabase.from('categories').select('*').order('order_index'),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false })
      ]);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
      setOrders(orderRes.data || []);
    } catch (err: any) {
      if (err?.message !== "Invalid API key") {
        console.error("Admin fetch error", err);
      }
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (user && supabase) {
      fetchAll();
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    await supabase.from('categories').insert({
      name: catForm.name,
      image_url: catForm.image_url,
      video_url: catForm.video_url,
      order_index: categories.length
    });
    setCatForm({ name: '', image_url: '', video_url: '' });
    setShowCategoryForm(false);
    fetchAll();
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
      images: prodForm.images
    });
    setProdForm({ name: '', description: '', price: '', image_url: '', category_id: '', images: [] });
    setShowProductForm(false);
    fetchAll();
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

  if (!user || !session) {
    return (
      <div className="pt-40 px-6 max-w-md mx-auto min-h-screen">
        <div className="bg-[#f4f4f4] p-8 border border-[#e5e5e5]">
          <div className="flex justify-center mb-6">
            <Lock className="w-8 h-8 opacity-20" />
          </div>
          <h1 className="font-extrabold text-2xl uppercase tracking-tighter mb-6 text-center">Admin Access</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && <p className="text-red-500 text-xs font-bold uppercase p-3 bg-red-500/10 border border-red-500/20">{authError}</p>}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] p-3 text-sm focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] p-3 text-sm focus:outline-none focus:border-black"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-black text-white p-4 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
            >
              {authLoading ? 'Authenticating...' : 'Login to Dashboard'}
            </button>
          </form>
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
          onClick={handleLogout}
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
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest hidden sm:block">{session.user.email}</span>
          <button 
            onClick={fetchAll}
            className="flex items-center gap-2 px-6 py-3 border border-[#e5e5e5] hover:border-black transition-colors uppercase tracking-widest text-[10px] font-bold"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors uppercase tracking-widest text-[10px] font-bold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="flex gap-8 mb-12 border-b border-[#e5e5e5] pb-4 overflow-x-auto hide-scrollbar">
        {(['categories', 'products', 'collections', 'gallery', 'orders'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`uppercase tracking-widest text-[11px] font-bold transition-opacity whitespace-nowrap ${activeTab === tab ? 'opacity-100 border-b-2 border-brand-ink pb-4 -mb-[18px]' : 'opacity-40 hover:opacity-100'}`}
          >
            {tab === 'categories' ? 'Categories (Home)' : tab}
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
        <div className="bg-white p-8 mb-20 border border-[#e5e5e5]">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Category Name" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" required />
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Category Hero Image</label>
                      <input type="url" placeholder="Image URL" value={catForm.image_url} onChange={e => setCatForm({...catForm, image_url: e.target.value})} className="w-full border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none mb-2" required />
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'category_image')} className="text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Category Hero Video (Optional)</label>
                      <input type="url" placeholder="Video URL" value={catForm.video_url} onChange={e => setCatForm({...catForm, video_url: e.target.value})} className="w-full border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none mb-2" />
                      <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'category_video')} className="text-xs" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" className="bg-black text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800">Save Category</button>
                    <button type="button" onClick={() => setShowCategoryForm(false)} className="px-6 py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-gray-100 border border-[#e5e5e5]">Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {categories.length === 0 ? <p className="opacity-50 text-sm font-medium p-4 border border-[#e5e5e5]">No categories found. Start by adding one.</p> : null}
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between border border-[#e5e5e5] p-4 bg-[#f9f9f9]">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-24 bg-[#e5e5e5] overflow-hidden flex-shrink-0">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-full h-full p-6 opacity-20" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg tracking-tight uppercase">{cat.name}</p>
                        <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">ID: {cat.id}</p>
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
                    <input type="number" step="0.01" placeholder="Price" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} className="border border-[#e5e5e5] p-3 text-sm focus:border-black outline-none" required />
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
                          <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">${prod.price.toFixed(2)} &bull; {cat?.name || 'Unknown'}</p>
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

          {/* COLLECTIONS & GALLERY TABS (Placeholders for extended schemas) */}
          {(activeTab === 'collections' || activeTab === 'gallery') && (
            <div>
              <div className="mb-8">
                <h2 className="font-extrabold text-2xl uppercase tracking-tighter capitalize">{activeTab === 'collections' ? 'Collections' : 'The Vault (Gallery)'}</h2>
                <p className="text-sm opacity-60 mt-2 max-w-2xl font-medium">
                  Add and modify curated imagery/collections. To activate this, ensure a `{activeTab}` table is created in your Supabase database schema with columns for `id`, `title`, `description`, `image_url`.
                </p>
              </div>
              <div className="bg-[#f4f4f4] p-8 text-center border border-[#e5e5e5]">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Module Not Yet Connected</p>
                <button className="bg-black text-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:opacity-80">
                  Request Schema Setup
                </button>
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
                        <td className="py-4 font-mono text-[11px] font-medium">{order.id}</td>
                        <td className="py-4 font-semibold">{order.customer_name} <br/><span className="text-[11px] text-gray-500 font-normal">{order.customer_email}</span></td>
                        <td className="py-4 font-bold">${order.total.toFixed(2)}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-brand-ink/10 text-brand-ink'}`}>
                             {order.status}
                          </span>
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
