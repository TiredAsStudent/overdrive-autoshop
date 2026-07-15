import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ClipboardList,
  AlertCircle,
  Loader2,
  CalendarClock,
  ArrowRightLeft,
} from "lucide-react";
import { estimateService } from "../../../services/staff/estimate.service";

const SalesOrderModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(true);

  // Master List of Approved Estimates
  const [approvedEstimates, setApprovedEstimates] = useState([]);
  const [selectedEstimatePreview, setSelectedEstimatePreview] = useState(null);

  const [formData, setFormData] = useState({
    estimate_id: "",
    estimated_completion_date: "",
    notes: "",
  });

  // Pre-fetch ONLY Approved Estimates when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchApprovedEstimates = async () => {
        setIsLoadingEstimates(true);
        try {
          const res = await estimateService.getEstimates(
            1,
            100,
            "",
            "APPROVED",
            "all",
          );
          setApprovedEstimates(res.data?.estimates || []);
        } catch (error) {
          setValidationError(
            "Failed to load approved estimates. Please refresh.",
          );
        } finally {
          setIsLoadingEstimates(false);
        }
      };
      fetchApprovedEstimates();

      setFormData({
        estimate_id: "",
        estimated_completion_date: "",
        notes: "",
      });
      setSelectedEstimatePreview(null);
      setValidationError("");
    }
  }, [isOpen]);

  // When an estimate is selected, find it in the array to show a quick preview
  const handleEstimateSelect = (e) => {
    const estId = e.target.value;
    setFormData({ ...formData, estimate_id: estId });
    if (estId) {
      const preview = approvedEstimates.find(
        (est) => est.id.toString() === estId.toString(),
      );
      setSelectedEstimatePreview(preview || null);
    } else {
      setSelectedEstimatePreview(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.estimate_id)
      return setValidationError(
        "You must select an approved estimate to convert.",
      );

    const payload = {
      estimate_id: parseInt(formData.estimate_id, 10),
      estimated_completion_date: formData.estimated_completion_date || null,
      notes: formData.notes,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setValidationError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Convert to Sales Order
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Official Work Authorization
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {isLoadingEstimates ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Scanning Authorized Quotes...
                  </p>
                </div>
              ) : (
                <form
                  id="salesOrderForm"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Select Estimate */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Approved Estimate Reference{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="estimate_id"
                      value={formData.estimate_id}
                      onChange={handleEstimateSelect}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                    >
                      <option value="">
                        -- Select an Approved Estimate --
                      </option>
                      {approvedEstimates.map((est) => (
                        <option key={est.id} value={est.id}>
                          [{est.estimate_number}] {est.customer_name} - ₱
                          {parseFloat(est.grand_total).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {approvedEstimates.length === 0 && (
                      <p className="text-[10px] text-red-500 mt-2 font-bold">
                        No approved estimates available for conversion.
                      </p>
                    )}
                  </div>

                  {/* Dynamic Preview Card */}
                  {selectedEstimatePreview && (
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Financial Lock
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                          {selectedEstimatePreview.customer_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Grand Total
                        </p>
                        <span className="text-lg font-black text-amber-600 dark:text-amber-500">
                          ₱
                          {parseFloat(
                            selectedEstimatePreview.grand_total,
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Operational Data */}
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Estimated Completion Date{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="date"
                        name="estimated_completion_date"
                        value={formData.estimated_completion_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Operational / Logistics Notes{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none"
                        placeholder="e.g., Prioritize engine bay work; customer needs car by weekend."
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="submit"
                form="salesOrderForm"
                disabled={
                  isSubmitting ||
                  isLoadingEstimates ||
                  approvedEstimates.length === 0
                }
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ClipboardList size={16} />
                )}
                Confirm & Initialize Work Order
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SalesOrderModal;
