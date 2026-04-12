import React, { forwardRef } from 'react';
import BannerLogo from '../../assets/OverdriveLogo2.png';

const PdfGenerator = forwardRef(({ data }, ref) => {
  // Mock fallback data if none provided
  const invoice = data || {
    invoiceNo: 'INV-2026-001',
    date: 'April 10, 2026',
    customer: { name: 'Jay Agustin', phone: '0917-xxx-xxxx', address: 'Calamba, Laguna' },
    vehicle: { model: 'Toyota Hilux 2021', plate: 'ABC 1234' },
    items: [
      { desc: 'Fully Synthetic Oil Change', qty: 1, price: 4500 },
      { desc: 'Oil Filter (Genuine)', qty: 1, price: 850 },
      { desc: 'Brake Pad Replacement (Front)', qty: 2, price: 2200 },
    ],
    subtotal: 9750,
    markup: 2437.50, // 25%
    vat: 1462.50, // 12%
    total: 13650,
  };

  return (
    <div ref={ref} className="p-12 bg-white text-slate-900 max-w-[800px] mx-auto font-sans print:p-8">
      {/* PDF Header */}
      <div className="flex justify-between items-start border-b-4 border-amber-500 pb-8 mb-8">
        <div>
          <img src={BannerLogo} alt="Logo" className="h-16 mb-4 object-contain" />
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Premium Auto Care Specialists</p>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-black text-slate-900 uppercase">Invoice</h1>
          <p className="text-slate-500 font-bold">{invoice.invoiceNo}</p>
          <p className="text-xs mt-1">{invoice.date}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[10px] uppercase font-black text-slate-400 mb-2">Customer Details</h3>
          <p className="font-bold text-lg">{invoice.customer.name}</p>
          <p className="text-sm text-slate-600">{invoice.customer.phone}</p>
          <p className="text-sm text-slate-600">{invoice.customer.address}</p>
        </div>
        <div>
          <h3 className="text-[10px] uppercase font-black text-slate-400 mb-2">Vehicle Information</h3>
          <p className="font-bold text-lg">{invoice.vehicle.model}</p>
          <p className="text-sm font-mono bg-slate-100 px-2 py-0.5 inline-block rounded mt-1">
            PLATE: {invoice.vehicle.plate}
          </p>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-slate-900 text-left text-xs uppercase font-black">
            <th className="py-3">Description</th>
            <th className="py-3 text-center">Qty</th>
            <th className="py-3 text-right">Unit Price</th>
            <th className="py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item, i) => (
            <tr key={i} className="text-sm">
              <td className="py-4 font-medium">{item.desc}</td>
              <td className="py-4 text-center">{item.qty}</td>
              <td className="py-4 text-right">₱{item.price.toLocaleString()}</td>
              <td className="py-4 text-right font-bold">₱{(item.qty * item.price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₱{invoice.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Service Markup (25%)</span>
            <span>₱{invoice.markup.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Tax (VAT 12%)</span>
            <span>₱{invoice.vat.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-black border-t-2 border-slate-900 pt-2 mt-4">
            <span>TOTAL</span>
            <span className="text-amber-600">₱{invoice.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-widest leading-relaxed">
        <p>Thank you for choosing Overdrive Auto Shop</p>
        <p className="mt-1 font-bold">This is a system-generated document. No signature required.</p>
      </div>
    </div>
  );
});

export default PdfGenerator;