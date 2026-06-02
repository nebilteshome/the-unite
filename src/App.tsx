import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import posthog from 'posthog-js';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Collections from './pages/Collections';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Missing Clerk Publishable Key. Authentication will not work.");
}

function PostHogPageView() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture('$pageview');
  }, [location]);
  return null;
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error("VITE_CLERK_PUBLISHABLE_KEY is missing from environment variables.");
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-extrabold uppercase tracking-tighter mb-4">Setup Required</h1>
          <p className="text-sm opacity-70 mb-6">
            The environment variable <code className="bg-black/5 px-1 rounded font-bold">VITE_CLERK_PUBLISHABLE_KEY</code> is not set in your Vercel project settings.
          </p>
          <div className="bg-black/5 p-4 rounded text-left text-xs mb-6 font-mono">
            <p className="mb-2 font-bold text-red-600">Troubleshooting:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to Vercel Dashboard &gt; Settings &gt; Environment Variables</li>
              <li>Ensure the key name is exactly: <strong>VITE_CLERK_PUBLISHABLE_KEY</strong></li>
              <li>Ensure "Production" and "Preview" environments are checked</li>
              <li><strong>Crucial:</strong> You must trigger a NEW deployment (Redeploy) after saving the variables</li>
            </ol>
          </div>
          <div className="animate-pulse flex justify-center">
            <div className="w-2 h-2 bg-black rounded-full mx-1"></div>
            <div className="w-2 h-2 bg-black rounded-full mx-1"></div>
            <div className="w-2 h-2 bg-black rounded-full mx-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID || "test", currency: "USD" }}>
        <AuthProvider>
          <PersonalizationProvider>
            <CartProvider>
              <BrowserRouter>
                <PostHogPageView />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="collections" element={<Collections />} />
                    <Route path="gallery" element={<Gallery />} />
                    <Route path="admin" element={<Admin />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </PersonalizationProvider>
        </AuthProvider>
      </PayPalScriptProvider>
    </ClerkProvider>
  );
}

