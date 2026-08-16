import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Calendar,
  Building2,
  User,
  Printer,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { estimateService } from "../../../services/staff/estimate.service";

const EstimateDrawer = ({ isOpen, onClose, estimateId }) => {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && estimateId) {
      setLoading(true);
      setError("");
      estimateService
        .getEstimateDetails(estimateId)
        .then((res) => setEstimate(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setEstimate(null);
    }
  }, [isOpen, estimateId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "APPROVED":
      case "CONVERTED":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "REJECTED":
      case "EXPIRED":
        return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      default:
        return "text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-[110] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {estimate?.estimate_number || "Loading..."}
                  </h2>

                  {estimate && (
                    <div className="flex flex-col items-start gap-1.5 mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(estimate.status)}`}
                      >
                        {estimate.status.replace("_", " ")}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck size={12} className="text-amber-500" />
                        Prepared by:{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {estimate.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Document...
                  </p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              {estimate && !loading && (
                <div className="space-y-6">
                  {/* Meta Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800/50 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <User size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Customer
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {estimate.customer_name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {estimate.contact_number}
                      </p>
                    </div>
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800/50 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <Calendar size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Valid Until
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {new Date(estimate.valid_until).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Building2 size={10} /> {estimate.branch_name}
                      </p>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Itemized Breakdown
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3">
                      {estimate.items.map((item) => {
                        const isService = item.line_type === "SERVICE";
                        const gross =
                          parseFloat(item.recorded_selling_price) *
                          item.quantity;
                        const net = gross - parseFloat(item.discount_amount);

                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[16px] sm:rounded-[20px] flex items-center justify-between"
                          >
                            <div className="flex flex-col min-w-0 flex-1 pr-4">
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase italic">
                                {isService ? item.service_name : item.item_name}
                              </p>
                              <p className="text-[9px] font-bold text-slate-500 tracking-widest mt-0.5">
                                {item.quantity}x @ ₱
                                {parseFloat(
                                  item.recorded_selling_price,
                                ).toLocaleString()}
                                {parseFloat(item.discount_amount) > 0 && (
                                  <span className="text-amber-500 ml-1">
                                    (Disc: -₱{item.discount_amount})
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              ₱
                              {net.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl">
                    <div className="space-y-1.5 mb-4 text-sm font-medium text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>
                          ₱
                          {parseFloat(estimate.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT Segment</span>
                        <span>
                          ₱
                          {parseFloat(estimate.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl font-black text-amber-500">
                        ₱
                        {parseFloat(estimate.grand_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {estimate.notes && (
                    <div className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">
                        Staff Notes
                      </p>
                      <p className="text-xs text-amber-900 dark:text-amber-200/80 italic">
                        "{estimate.notes}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer Stub */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                disabled={!estimate || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Document
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EstimateDrawer;
