import React from "react";
import { Truck, PackageCheck, MapPin, Clock } from "lucide-react";

const TransferInbox = ({ transfers, onReceive }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
        Incoming Transfers (In Transit)
      </h3>

      {transfers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-black/10 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
          <Truck size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">
            No incoming deliveries at the moment.
          </p>
        </div>
      ) : (
        transfers.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
          >
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 relative">
                <Truck size={24} />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 border-2 border-white dark:border-slate-800 rounded-full animate-ping" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {item.partName}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                    <MapPin size={10} /> From: {item.from}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock size={10} /> Sent: {item.sentAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs font-black text-blue-500 uppercase tracking-tighter">
                  Qty to Receive
                </p>
                <p className="text-2xl font-black dark:text-white">
                  {item.qty}
                </p>
              </div>
              <button
                onClick={() => onReceive(item.id)}
                className="px-6 py-3 bg-emerald-500 text-white font-black rounded-xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
              >
                <PackageCheck size={18} /> Confirm Receipt
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TransferInbox;
