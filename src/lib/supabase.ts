/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export type Category = {
  id: string;
  name: string;
  image_url?: string;
  video_url?: string;
  order_index: number;
  created_at: string;
}

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  hover_image_url?: string;
  images?: string[];
  stock_count: number;
  created_at: string;
}

export type Order = {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  items?: any[];
  created_at: string;
}

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order_status' | 'new_product' | 'promotion' | 'restock';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export type Profile = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  shipping_address?: string;
  cart_items?: any;
  currency_preference: string;
  country?: string;
  created_at: string;
}

export type Collection = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
}

export type GalleryItem = {
  id: string;
  title?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
}

export type Drop = {
  id: string;
  title: string;
  release_date: string;
  image_url?: string;
  video_url?: string;
  is_active: boolean;
  created_at: string;
}
