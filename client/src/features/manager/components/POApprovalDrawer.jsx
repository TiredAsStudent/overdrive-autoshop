import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Calendar,
  Building2,
  User,
  Loader2,
  Store,
  Package,
  AlertCircle,
} from "lucide-react";
import { poApprovalService } from "../../../services/manager/poApproval.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const PurchaseOrderApprovalDrawer = ({ isOpen, onClose, poId }) => {
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && poId) {
      setLoading(true);
      setError("");
      poApprovalService
        .getPODetails(poId)
        .then((res) => setPo(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setPo(null);
    }
  }, [isOpen, poId]);

  if (po && po.status === "PENDING_APPROVAL") return null;

  const getBadgeVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "default";
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-[80] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <ShoppingCart size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {po?.purchase_order_number || "Loading..."}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Drafted By: {po?.created_by_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Document...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 text-center">
                  {error}
                </div>
              )}

              {po && !loading && (
                <>
                  {/* Status Banner */}
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                        Document Status
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                        {po.status.replace("_", " ")}
                      </span>
                    </div>
                    <StatusBadge
                      label={po.status.replace("_", " ")}
                      variant={getBadgeVariant(po.status)}
                    />
                  </div>

                  {/* Managerial Decision Info */}
                  <div
                    className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm ${po.status === "REJECTED" ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-300" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"}`}
                  >
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                          Managerial Decision
                        </p>
                        {po.resolved_by_name && (
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded border border-black/5 dark:border-white/5 truncate max-w-full">
                            By: {po.resolved_by_name} {po.resolved_by_last_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold leading-relaxed whitespace-pre-wrap break-words">
                        {po.approval_remarks ||
                          "No additional remarks provided."}
                      </p>
                    </div>
                  </div>

                  {/* Meta Linkages */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <Store size={16} className="text-slate-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Target Vendor
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {po.vendor_name}
                        </p>
                        {po.contact_person && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            Attn: {po.contact_person}
                          </p>
                        )}
                        {po.vendor_email && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {po.vendor_email}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 truncate mt-2 flex items-center gap-1 font-medium border-t border-slate-100 dark:border-slate-700/50 pt-2">
                          <Building2 size={10} /> {po.branch_name}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/20 shadow-sm flex flex-col justify-between">
                      <Calendar size={16} className="text-amber-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                          Submission & Delivery
                        </p>
                        <div className="space-y-1.5">
                          <div>
                            <p className="text-[9px] text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">
                              Purchase Date
                            </p>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-400 truncate">
                              {new Date(po.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest mt-1">
                              Delivery Target
                            </p>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-400 truncate">
                              {new Date(
                                po.expected_delivery_date,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Detail */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Requested Parts
                      </h3>
                    </div>
                    <div className="p-4 sm:p-5 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {po.items.map((item) => {
                        const net =
                          parseFloat(item.recorded_unit_cost) * item.quantity -
                          parseFloat(item.discount_amount);
                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[16px] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div className="p-1.5 rounded-md shrink-0 bg-white border border-slate-200 dark:border-slate-600 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                <Package size={14} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase italic">
                                  [{item.sku}] {item.item_name}
                                </p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest mt-0.5">
                                  {item.quantity}x @ ₱
                                  {parseFloat(
                                    item.recorded_unit_cost,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                  {parseFloat(item.discount_amount) > 0 && (
                                    <span className="text-amber-500 ml-1.5">
                                      (Disc: -₱
                                      {parseFloat(
                                        item.discount_amount,
                                      ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                      })}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono shrink-0">
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

                  {/* Totals Lock */}
                  <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 sm:p-6 text-white shadow-xl opacity-95">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-3">
                      Approved Financial Commitment
                    </p>
                    <div className="space-y-2 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(po.subtotal).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>VAT Allocation</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(po.vat_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/50">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
                        ₱
                        {parseFloat(po.grand_total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Staff Notes */}
                  {po.notes && (
                    <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Staff Justification
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words">
                        "{po.notes}"
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PurchaseOrderApprovalDrawer;
