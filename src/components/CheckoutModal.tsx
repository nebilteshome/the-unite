import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CreditCard, Truck, Check } from 'lucide-react';
import posthog from 'posthog-js';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { cn } from '../lib/utils';

export default function CheckoutModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, total, clearCart } = useCart();
  const { user, clerkUser } = useAuth();
  const { formatPrice } = usePersonalization();
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');

  const clerkId = clerkUser?.id;

  useEffect(() => {
    if (isOpen) {
      posthog.capture('checkout_started', {
        total: total,
        item_count: items.length
      });
    }
  }, [isOpen]);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment and order creation
    setTimeout(() => {
      setIsProcessing(false);
      posthog.capture('purchase_completed', {
        total: total,
        item_count: items.length,
        items: items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity }))
      });
      setStep('success');
      clearCart();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[800px] md:h-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 hover:opacity-50 transition-opacity">
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Form */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border", step === 'shipping' ? "bg-black text-white border-black" : "bg-green-500 text-white border-green-500")}>
               {step === 'shipping' ? '1' : <Check className="w-4 h-4" />}
            </div>
            <div className="h-px w-8 bg-gray-200" />
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border", step === 'payment' ? "bg-black text-white border-black" : step === 'success' ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-400 border-gray-200")}>
               {step === 'success' ? <Check className="w-4 h-4" /> : '2'}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'shipping' && (
              <motion.div 
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-extrabold uppercase tracking-tighter mb-6">Shipping Details</h2>
                <form onSubmit={handleSubmitShipping} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="Email Address" 
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none transition-colors" 
                      required 
                      autoComplete="email"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        name="firstName" 
                        placeholder="First Name" 
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none transition-colors" 
                        required 
                        autoComplete="given-name"
                      />
                      <input 
                        type="text" 
                        name="lastName" 
                        placeholder="Last Name" 
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none transition-colors" 
                        required 
                        autoComplete="family-name"
                      />
                    </div>
                    <input 
                      type="text" 
                      name="address" 
                      placeholder="Shipping Address" 
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none transition-colors" 
                      required 
                      autoComplete="street-address"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        name="city" 
                        placeholder="City" 
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none transition-colors" 
                        required 
                        autoComplete="address-level2"
                      />
                      <input 
                        type="text" 
                        name="postalCode" 
                        placeholder="Postal Code" 
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none transition-colors" 
                        required 
                        autoComplete="postal-code"
                      />
                    </div>
                    <select 
                      name="country" 
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none transition-colors bg-transparent appearance-none"
                    >
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Uganda</option>
                      <option>Europe</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-transparent border border-black text-black py-4 mt-6 uppercase font-bold text-[11px] tracking-widest flex items-center justify-center gap-2 group hover:bg-black hover:text-white transition-colors">
                    Continue to Payment <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button onClick={() => setStep('shipping')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-6 transition-colors">
                  <ChevronLeft className="w-3 h-3" /> Back to Shipping
                </button>
                <h2 className="text-2xl font-extrabold uppercase tracking-tighter mb-6">Payment Method</h2>
                
                <div className="space-y-4 mb-8">
                  <PayPalButtons 
                    style={{ layout: "vertical", color: "black", shape: "rect", label: "pay" }}
                    disabled={isProcessing}
                    createOrder={async () => {
                      const res = await fetch("/api/orders/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          items: items.map(i => ({ id: i.product.id, quantity: i.quantity })),
                          formData 
                        }),
                      });
                      const order = await res.json();
                      return order.id;
                    }}
                    onApprove={async (data) => {
                      setIsProcessing(true);
                      try {
                        const res = await fetch("/api/orders/capture", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                            orderID: data.orderID,
                            formData,
                            clerkId: clerkId // Assuming clerkId is available from useAuth
                          }),
                        });
                        const details = await res.json();
                        
                        if (details.status === 'COMPLETED') {
                          posthog.capture('purchase_completed', {
                            total: total,
                            item_count: items.length,
                            payment_id: data.orderID,
                            items: items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity }))
                          });
                          setStep('success');
                          clearCart();
                        } else {
                          alert("Payment failed. Please try again.");
                        }
                      } catch (err) {
                        console.error(err);
                        alert("An error occurred during payment.");
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    onCancel={() => {
                      posthog.capture('payment_cancelled', { total });
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      posthog.capture('payment_error', { error: err.toString() });
                    }}
                  />
                </div>

                <div className="bg-gray-50 p-6 rounded-sm mb-8">
                   <p className="text-[10px] leading-relaxed opacity-60 font-medium">
                     By clicking 'Pay Now', you agree to our Terms of Service and Privacy Policy. All transactions are secure and encrypted.
                   </p>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white stroke-[3]" />
                </div>
                <h2 className="text-3xl font-extrabold uppercase tracking-tighter mb-2">Order Confirmed</h2>
                <p className="text-sm opacity-60 font-medium mb-8">Thank you for your purchase. We've sent a confirmation email to {formData.email}</p>
                <button 
                  onClick={onClose}
                  className="bg-transparent border border-black text-black px-10 py-4 uppercase font-bold text-[11px] tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Order Summary (Desktop Only) */}
        {step !== 'success' && (
          <div className="w-full md:w-80 bg-[#f9f9f9] p-6 md:p-10 border-l border-gray-100 hidden md:flex flex-col">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-6 opacity-40">Order Summary</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                  <div className="w-12 h-16 bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center p-1">
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase truncate">{item.product.name}</p>
                    <p className="text-[9px] opacity-40 font-bold uppercase">Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}</p>
                    <p className="text-[10px] font-bold mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-40">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold uppercase tracking-tighter pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
