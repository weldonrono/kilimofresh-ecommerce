import React, { useState } from 'react';
import { INITIAL_PRODUCTS } from '../data/mockData';
import { ProductItem } from '../types/architecture';
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const LiveStorefrontPreview: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [phone, setPhone] = useState('+254 712 345 678');
  
  // Checkout flow state
  const [isStkPromptOpen, setIsStkPromptOpen] = useState(false);
  const [mpesaPin, setMpesaPin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    receiptNumber: string;
    amount: number;
    phone: string;
    time: string;
    status: 'success' | 'out_of_stock';
  } | null>(null);

  const handleOpenCheckout = (product: ProductItem) => {
    setSelectedProduct(product);
    setPaymentResult(null);
    setMpesaPin('');
    setIsStkPromptOpen(true);
  };

  const handleConfirmPin = async () => {
    if (!selectedProduct) return;
    setIsProcessingPayment(true);

    // Simulate mobile network delay (1.2s - Safaricom PIN validation)
    await new Promise(r => setTimeout(r, 1200));

    // Verify stock in state
    if (selectedProduct.stock <= 0) {
      setPaymentResult({
        receiptNumber: 'N/A',
        amount: selectedProduct.priceKES,
        phone,
        time: new Date().toLocaleTimeString(),
        status: 'out_of_stock'
      });
      setIsProcessingPayment(false);
      return;
    }

    // Decrement stock
    const receipt = `SJ14KP${Math.floor(1000 + Math.random() * 9000)}X`;
    setProducts(prev =>
      prev.map(p =>
        p.id === selectedProduct.id
          ? { ...p, stock: Math.max(0, p.stock - 1) }
          : p
      )
    );

    setSelectedProduct(prev => prev ? { ...prev, stock: Math.max(0, prev.stock - 1) } : null);

    setPaymentResult({
      receiptNumber: receipt,
      amount: selectedProduct.priceKES,
      phone,
      time: new Date().toLocaleTimeString(),
      status: 'success'
    });

    setIsProcessingPayment(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Storefront Intro Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              KilimoFresh Live Commerce Front
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">06:00 AM Harvest Drop Active</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Farm-to-Table Produce Drops with Real-Time Stock Decrements
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg shrink-0">
          <ShieldCheck className="w-4 h-4" />
          Protected by Redis SETNX &amp; Postgres FOR UPDATE
        </div>
      </div>

      {/* Produce Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => {
          const isSoldOut = product.stock <= 0;

          return (
            <div
              key={product.id}
              className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  
                  {/* Stock Tag */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                      isSoldOut
                        ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                        : product.stock <= 3
                        ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900/90 text-emerald-400 border-slate-700'
                    }`}>
                      {isSoldOut ? 'SOLD OUT' : `${product.stock} units left`}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-300">
                      <Clock className="w-3.5 h-3.5" />
                      {product.harvestTime}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{product.region}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {product.tagline}
                  </p>
                  <div className="text-[11px] text-slate-500 mt-2 font-mono">
                    Direct Partner: {product.farmer}
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Price (KES)</div>
                    <div className="text-lg font-extrabold text-white font-mono">
                      KES {product.priceKES}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCheckout(product)}
                    disabled={isSoldOut}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                      isSoldOut
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-sm'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    {isSoldOut ? 'Sold Out' : 'M-Pesa STK'}
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Simulated Safaricom M-Pesa STK Push Modal */}
      {isStkPromptOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Safaricom Header */}
            <div className="bg-[#008938] px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white text-[#008938] flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <span className="text-sm font-bold tracking-tight">M-PESA Express</span>
              </div>
              <button
                onClick={() => setIsStkPromptOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt Body */}
            <div className="p-5">
              {!paymentResult ? (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Safaricom Daraja STK Push prompt sent to your mobile SIM. Enter M-Pesa PIN to authorize payment to KilimoFresh.
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Paybill:</span>
                      <span className="text-white">890200 (KilimoFresh)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Item:</span>
                      <span className="text-white truncate max-w-[170px]">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Amount:</span>
                      <span className="text-emerald-400 font-bold">KES {selectedProduct.priceKES}</span>
                    </div>
                  </div>

                  {/* Phone input */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Target Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* PIN Input */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Enter 4-Digit M-Pesa PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="****"
                      value={mpesaPin}
                      onChange={(e) => setMpesaPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-white tracking-widest text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleConfirmPin}
                      disabled={isProcessingPayment || mpesaPin.length < 4}
                      className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isProcessingPayment || mpesaPin.length < 4
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#008938] hover:bg-[#007430] text-white shadow-sm'
                      }`}
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing Daraja Webhook...
                        </>
                      ) : (
                        'Confirm & Send PIN'
                      )}
                    </button>
                  </div>
                </div>
              ) : paymentResult.status === 'success' ? (
                /* Successful Receipt */
                <div className="text-center py-2 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Payment Confirmed!</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Safaricom Daraja webhook verified &amp; inventory decremented.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-left space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>M-Pesa Receipt:</span>
                      <span className="text-emerald-400 font-bold">{paymentResult.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Amount Paid:</span>
                      <span className="text-white">KES {paymentResult.amount}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Recipient:</span>
                      <span className="text-white">KilimoFresh Ltd</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Phone:</span>
                      <span className="text-slate-300">{paymentResult.phone}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Timestamp:</span>
                      <span className="text-slate-300">{paymentResult.time}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono leading-relaxed">
                    Redis SETNX lock held for 60s. BullMQ notification worker dispatched to dispatch hub.
                  </div>

                  <button
                    onClick={() => setIsStkPromptOpen(false)}
                    className="w-full py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Sold Out / Rejection */
                <div className="text-center py-2 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Produce Sold Out!</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Postgres row lock prevented overselling. Stock reached 0.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsStkPromptOpen(false)}
                    className="w-full py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
