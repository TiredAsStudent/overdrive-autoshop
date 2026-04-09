import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Printer, Share2, ArrowRightLeft } from 'lucide-react';
import LineItemBuilder from '../../features/staff/components/LineItemBuilder';
import ServiceTemplateSelector from '../../features/staff/components/ServiceTemplateSelector';
import PdfGenerator from '../../components/shared/PdfGenerator';
import { useReactToPrint } from 'react-to-print';

const Estimates = () => {
  const { activeVehicle, activeCustomer } = useApp();
  const [items, setItems] = useState([{ desc: 'Labor Charge', qty: 1, price: 500 }]);
  
  const pdfRef = useRef();
  const handlePrint = useReactToPrint({ content: () => pdfRef.current });

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const markup = subtotal * 0.25;
  const vat = (subtotal + markup) * 0.12;
  const grandTotal = subtotal + markup + vat;

  const addTemplate = (template) => setItems([...items, ...template.items]);

  const copyEstimateLink = () => {
    navigator.clipboard.writeText(`https://overdrive-portal.com/view/est-999`);
    alert("Unique link copied! You can now paste this into Messenger or Viber.");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* LEFT: Builder Section */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <FileText className="text-amber-500" /> Professional Quote
            </h2>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Target Vehicle</p>
              <p className="text-lg font-black dark:text-overdrive-yellow">{activeVehicle || 'SELECT VEHICLE'}</p>
            </div>
          </div>

          <ServiceTemplateSelector onSelect={addTemplate} />
          <LineItemBuilder items={items} setItems={setItems} />
        </div>
      </div>

      {/* RIGHT: Summary & Actions */}
      <div className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/20">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Estimate Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Parts & Labor</span>
              <span>₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Service Markup (25%)</span>
              <span>₱{markup.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax (VAT 12%)</span>
              <span>₱{vat.toLocaleString()}</span>
            </div>
            <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-end">
              <span className="font-bold">Estimated Total</span>
              <span className="text-3xl font-black text-overdrive-yellow">₱{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button onClick={handlePrint} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
              <Printer size={18} /> Print Physical PDF
            </button>
            <button onClick={copyEstimateLink} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
              <Share2 size={18} /> Copy Social Link
            </button>
            <button className="w-full py-4 bg-overdrive-yellow text-slate-900 rounded-xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
              <ArrowRightLeft size={18} /> Convert to Sales Order
            </button>
          </div>
        </div>
      </div>

      {/* HIDDEN PDF TEMPLATE FOR PRINTING */}
      <div className="hidden">
        <PdfGenerator ref={pdfRef} data={{
          invoiceNo: 'EST-2026-001',
          date: new Date().toLocaleDateString(),
          customer: { name: activeCustomer?.name || 'Guest' },
          vehicle: { plate: activeVehicle, model: 'Verified Vehicle' },
          items, subtotal, markup, vat, total: grandTotal
        }} />
      </div>
    </div>
  );
};

export default Estimates;