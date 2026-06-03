import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useSession, useClerk } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: any;
  loading: boolean;
  isAdmin: boolean;
  clerkUser: any;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false, 
  clerkUser: null,
  signOut: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let clerkUser: any = null;
  let clerkSession: any = null;
  let clerkSignOut: any = async () => {};
  let isLoaded = true;

  try {
    const userContext = useUser();
    const sessionContext = useSession();
    const clerkContext = useClerk();
    
    clerkUser = userContext.user;
    isLoaded = userContext.isLoaded;
    clerkSession = sessionContext.session;
    clerkSignOut = clerkContext.signOut;
  } catch (e) {
    // Clerk not initialized or Provider missing
    console.warn("Clerk hooks failed. Operating in guest mode.");
  }
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const syncWithSupabase = async () => {
      if (!isLoaded) return;

      if (!clerkUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const isAuthorizedAdmin = email === 'fffg3839@gmail.com';
      setIsAdmin(isAuthorizedAdmin);

      try {
        console.log("Starting Supabase sync for email:", email);
        
        // Trigger Sync API to link Clerk with Supabase
        const syncRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            clerkId: clerkUser.id, 
            email: email 
          })
        });

        if (!syncRes.ok) {
          const errorText = await syncRes.text();
          console.error("Sync API failed:", syncRes.status, errorText);
        } else {
          console.log("Sync API successful");
        }

        // 1. Get a Supabase-compatible JWT from Clerk
        console.log("Requesting Supabase JWT from Clerk...");
        const token = await clerkSession?.getToken({ template: 'supabase' });
        
        if (!token) {
          console.error("❌ FAILED TO GET SUPABASE JWT: The 'supabase' template is missing in Clerk or getToken failed.");
        } else {
          console.log("Successfully retrieved Supabase JWT");
        }

        if (token && supabase) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: '',
          });

          if (setSessionError) {
            console.error("Error setting Supabase session:", setSessionError.message);
          } else {
            console.log("Supabase session set successfully. Supabase User ID:", (await supabase.auth.getUser()).data.user?.id);
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .single();

          const authUser = {
            ...clerkUser,
            email: email,
          };

          if (profile) {
            setUser({ ...authUser, ...profile });
          } else {
            setUser(authUser);
          }
        } else {
          setUser(clerkUser);
        }
      } catch (err) {
        console.error("Error syncing with Supabase:", err);
        setUser(clerkUser);
      } finally {
        setLoading(false);
      }
    };

    syncWithSupabase();
  }, [isLoaded, clerkUser, clerkSession]);

  const signOut = async () => {
    await clerkSignOut();
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, clerkUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
