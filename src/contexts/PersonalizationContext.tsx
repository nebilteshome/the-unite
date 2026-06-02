import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Notification, Favorite, Product } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Currency = {
  code: string;
  symbol: string;
  rate: number;
};

const CURRENCIES: Record<string, { symbol: string }> = {
  USD: { symbol: '$' },
  EUR: { symbol: '€' },
  GBP: { symbol: '£' },
  JPY: { symbol: '¥' },
  UGX: { symbol: 'USh' },
};

type PersonalizationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  favorites: string[]; // array of product IDs
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  
  currency: Currency;
  setCurrency: (code: string) => void;
  formatPrice: (amount: number) => string;
  
  loading: boolean;
};

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrencyState] = useState<Currency>({ code: 'USD', symbol: '$', rate: 1 });

  useEffect(() => {
    if (user && supabase) {
      fetchUserData();
      
      // Subscribe to Realtime Notifications
      const channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            // Play a subtle sound or show a toast if needed
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setNotifications([]);
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  // Auto-detect currency/country
  useEffect(() => {
    const detectLocale = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.currency && CURRENCIES[data.currency]) {
          setCurrency(data.currency);
        }
      } catch (err) {
        console.error("Locale detection failed", err);
      }
    };
    
    const savedCurrency = localStorage.getItem('currency_pref');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    } else {
      detectLocale();
    }
  }, []);

  const fetchUserData = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const [notifRes, favRes] = await Promise.all([
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('favorites').select('product_id')
      ]);
      
      setNotifications(notifRes.data || []);
      setFavorites((favRes.data || []).map(f => f.product_id));
    } catch (err) {
      console.error("Failed to fetch user personalization data", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (!user || !supabase) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!user || !supabase) return;
    
    const isFav = favorites.includes(productId);
    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (!error) {
        setFavorites(prev => prev.filter(id => id !== productId));
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId });
      
      if (!error) {
        setFavorites(prev => [...prev, productId]);
      }
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const setCurrency = (code: string) => {
    const config = CURRENCIES[code] || CURRENCIES.USD;
    setCurrencyState({ code, symbol: config.symbol, rate: 1 }); // Rate logic can be added later
    localStorage.setItem('currency_pref', code);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
    }).format(amount * currency.rate);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <PersonalizationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      favorites,
      toggleFavorite,
      isFavorite,
      currency,
      setCurrency,
      formatPrice,
      loading
    }}>
      {children}
    </PersonalizationContext.Provider>
  );
};

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};
