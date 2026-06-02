-- Supabase Schema for THEE UNITE

-- 1. Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    hover_image_url TEXT,
    stock_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT,
    total DECIMAL(10, 2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Profiles table (for Admin roles and user data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user',
    shipping_address TEXT,
    cart_items JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6.5 Create Drops table
CREATE TABLE IF NOT EXISTS public.drops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    release_date TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    video_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;

-- 7.5 Create helper function to check if user is admin
-- This avoids recursion by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Setup RLS Policies

-- Categories Policies
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin full access on categories" ON public.categories;
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on categories" ON public.categories FOR ALL 
    USING (public.is_admin());

-- Products Policies
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
DROP POLICY IF EXISTS "Allow admin full access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on products" ON public.products FOR ALL 
    USING (public.is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Allow public to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin full access on orders" ON public.orders;
CREATE POLICY "Allow public to insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access on orders" ON public.orders FOR ALL 
    USING (public.is_admin());

-- Collections Policies
DROP POLICY IF EXISTS "Allow public read access on collections" ON public.collections;
DROP POLICY IF EXISTS "Allow admin full access on collections" ON public.collections;
CREATE POLICY "Allow public read access on collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on collections" ON public.collections FOR ALL 
    USING (public.is_admin());

-- Gallery Policies
DROP POLICY IF EXISTS "Allow public read access on gallery" ON public.gallery;
DROP POLICY IF EXISTS "Allow admin full access on gallery" ON public.gallery;
CREATE POLICY "Allow public read access on gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on gallery" ON public.gallery FOR ALL 
    USING (public.is_admin());

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Users can view and update their own profile" ON public.profiles FOR ALL 
    USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT 
    USING (public.is_admin());

-- Drops Policies
DROP POLICY IF EXISTS "Allow public read access on drops" ON public.drops;
DROP POLICY IF EXISTS "Allow admin full access on drops" ON public.drops;
CREATE POLICY "Allow public read access on drops" ON public.drops FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on drops" ON public.drops FOR ALL 
    USING (public.is_admin());

-- 8.5 Storage Policies (Assuming a bucket named 'products' exists)
-- These must be applied to storage.objects
-- Note: You may need to create the 'products' bucket first in the Supabase Dashboard

-- Allow public to read files from 'products' bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'products');

-- Allow admins to upload/update/delete files in 'products' bucket
CREATE POLICY "Admin Full Access" ON storage.objects FOR ALL 
USING (bucket_id = 'products' AND public.is_admin());

-- 9. Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
