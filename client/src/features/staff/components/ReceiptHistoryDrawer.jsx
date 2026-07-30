import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  History,
  CheckCircle2,
  FileText,
  Calculator,
  Store,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { receiptService } from "../../../services/staff/receipt.service";

const ReceiptHistoryDrawer = ({ isOpen, onClose, scanId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Viewer States (No HTML5 Canvas)
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && scanId) {
      setLoading(true);
      setError("");
      setZoom(1);
      setRotation(0);
      setImageError(false);
      receiptService
        .getHistoryDetails(scanId)
        .then((res) => setData(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, scanId]);

  if (!isOpen) return null;

  const getConfidenceBadge = (score) => {
    const s = parseFloat(score);
    if (s >= 85)
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (s >= 60)
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20";
  };

  const handleNavigateToExpense = () => {
    onClose();
    // Navigate to expenses and search for this exact expense number
    navigate(`/staff/purchases/expenses?search=${data.expense_number}`);
  };

  const fileUrl = `${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000"}${data?.file_path}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full lg:w-[1000px] xl:w-[1200px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 lg:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Archived Document Record
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Immutable Audit Trail
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {loading && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">
                    Retrieving Archive...
                  </p>
                </div>
              )}

              {error && (
                <div className="w-full p-8 flex items-center justify-center">
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                    {error}
                  </div>
                </div>
              )}

              {data && !loading && (
                <>
                  {/* LEFT PANE: Document Viewer */}
                  <div className="w-full lg:w-[55%] h-[40vh] lg:h-full bg-slate-200 dark:bg-[#0B1120] relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-300 dark:border-slate-800">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <button
                        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                        className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <span className="text-[10px] font-black w-8 text-center text-slate-700 dark:text-slate-300">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                        className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <ZoomIn size={16} />
                      </button>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                      <button
                        onClick={() => setRotation((r) => r + 90)}
                        className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <RotateCw size={16} />
                      </button>
                    </div>

                    <div
                      className={`flex-1 overflow-hidden flex items-center justify-center ${isDesktop ? "cursor-move" : "cursor-auto"}`}
                    >
                      <motion.div
                        drag={isDesktop}
                        dragConstraints={{
                          left: -500,
                          right: 500,
                          top: -500,
                          bottom: 500,
                        }}
                        animate={{ scale: zoom, rotate: rotation }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className={`w-full h-full flex items-center justify-center p-8 ${!isDesktop ? "touch-auto" : "touch-none"}`}
                      >
                        {data.original_filename
                          ?.toLowerCase()
                          .endsWith(".pdf") ? (
                          <iframe
                            src={fileUrl}
                            className="w-full h-[90%] rounded-xl shadow-2xl bg-white pointer-events-none"
                            title="Document PDF"
                            onError={() => setImageError(true)}
                          />
                        ) : imageError ? (
                          <div className="flex flex-col items-center justify-center p-10 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-center shadow-lg">
                            <FileText size={48} className="mb-4 opacity-50" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-1">
                              File Unavailable
                            </h3>
                            <p className="text-[10px] font-medium max-w-[200px]">
                              The source document could not be loaded from the
                              storage server.
                            </p>
                          </div>
                        ) : (
                          <img
                            src={fileUrl}
                            alt="Archived Receipt"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-xl pointer-events-none"
                            onError={() => setImageError(true)}
                          />
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* RIGHT PANE: Verified Data */}
                  <div className="w-full lg:w-[45%] h-[60vh] lg:h-full overflow-y-auto custom-scrollbar p-5 lg:p-8 space-y-6 bg-white dark:bg-slate-900">
                    {/* Status & Expense Link */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Official Ledger Record
                        </p>
                        <p className="text-sm font-black text-amber-600 dark:text-amber-500">
                          {data.expense_number}
                        </p>
                      </div>
                      <button
                        onClick={handleNavigateToExpense}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 rounded-xl hover:border-amber-500 hover:text-amber-500 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        Open Expense <ExternalLink size={14} />
                      </button>
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-slate-500">
                          <Store size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            Vendor
                          </span>
                        </div>
                        <p
                          className="text-xs font-bold text-slate-900 dark:text-white truncate"
                          title={data.vendor_name}
                        >
                          {data.vendor_name || "N/A"}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-slate-500">
                          <Calendar size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            Transaction Date
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {new Date(data.expense_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <FileText size={14} /> Verified Line Items
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {data.line_items && data.line_items.length > 0 ? (
                          data.line_items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800"
                            >
                              <span className="font-bold text-slate-700 dark:text-slate-300 truncate pr-4">
                                {item.quantity}x {item.description}
                              </span>
                              <span className="font-mono font-bold text-slate-500">
                                ₱
                                {parseFloat(
                                  item.total_price || 0,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            No line items recorded.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                      <Calculator
                        size={100}
                        className="absolute -right-4 -bottom-4 text-slate-800 opacity-50 pointer-events-none"
                      />
                      <div className="space-y-2 mb-4 text-sm font-medium text-slate-400 relative z-10">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-mono">
                            ₱
                            {parseFloat(data.subtotal).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT Amount</span>
                          <span className="font-mono">
                            ₱
                            {parseFloat(data.vat_amount).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-2xl font-black font-mono text-amber-500">
                          ₱
                          {parseFloat(data.grand_total).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Footer Meta */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Human Verifier
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2
                            size={12}
                            className="text-emerald-500"
                          />
                          {data.verified_by_first} {data.verified_by_last}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-lg border flex flex-col items-end ${getConfidenceBadge(data.confidence_score)}`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                          AI Confidence
                        </span>
                        <span className="text-sm font-black">
                          {data.confidence_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReceiptHistoryDrawer;
