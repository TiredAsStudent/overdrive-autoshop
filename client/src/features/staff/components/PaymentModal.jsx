import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Wallet,
  Banknote,
  Landmark,
} from "lucide-react";
import { invoiceService } from "../../../services/staff/invoice.service";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "GCASH", label: "GCash E-Wallet", icon: Wallet },
  { id: "MAYA", label: "Maya E-Wallet", icon: Wallet },
  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark },
];

const PaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialInvoiceId = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  const [unresolvedInvoices, setUnresolvedInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState({
    invoice_id: "",
    amount_received: "",
    payment_method: "CASH",
    payment_date: "",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      const fetchInvoices = async () => {
        setIsLoadingInvoices(true);
        try {
          const res = await invoiceService.getInvoices(
            1,
            200,
            "",
            "all",
            "all",
          );
          const pending = (res.data?.invoices || []).filter(
            (inv) =>
              inv.status !== "PAID" &&
              inv.status !== "CANCELLED" &&
              inv.status !== "VOID",
          );
          setUnresolvedInvoices(pending);

          if (initialInvoiceId) {
            const preSelected = pending.find(
              (i) => i.id.toString() === initialInvoiceId.toString(),
            );
            if (preSelected) {
              setFormData((prev) => ({ ...prev, invoice_id: preSelected.id }));
              setSelectedInvoice(preSelected);
            }
          }
        } catch (error) {
          setValidationError(
            "Failed to load invoice registry. Please refresh.",
          );
        } finally {
          setIsLoadingInvoices(false);
        }
      };

      setFormData({
        invoice_id: initialInvoiceId || "",
        amount_received: "",
        payment_method: "CASH",
        payment_date: getLocalDateString(),
        reference_number: "",
        notes: "",
      });
      setSelectedInvoice(null);
      setValidationError("");
      fetchInvoices();
    }
  }, [isOpen, initialInvoiceId]);

  const handleInvoiceSelect = (e) => {
    const invId = e.target.value;
    setFormData({ ...formData, invoice_id: invId });
    if (invId) {
      const preview = unresolvedInvoices.find(
        (inv) => inv.id.toString() === invId.toString(),
      );
      setSelectedInvoice(preview || null);
    } else {
      setSelectedInvoice(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const grandTotal = selectedInvoice
    ? parseFloat(selectedInvoice.grand_total)
    : 0;
  const previouslyPaid = selectedInvoice
    ? parseFloat(selectedInvoice.amount_paid)
    : 0;

  const currentBalance = Math.round((grandTotal - previouslyPaid) * 100) / 100;
  const amountToApply = parseFloat(formData.amount_received) || 0;
  const projectedBalance =
    Math.round((currentBalance - amountToApply) * 100) / 100;

  const requiresReference = ["GCASH", "MAYA", "BANK_TRANSFER"].includes(
    formData.payment_method,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.invoice_id)
      return setValidationError("You must select an invoice.");
    if (amountToApply <= 0)
      return setValidationError("Payment amount must be greater than zero.");

    if (amountToApply > currentBalance) {
      return setValidationError(
        `Payment exceeds the remaining balance of ₱${currentBalance.toFixed(2)}`,
      );
    }

    if (
      requiresReference &&
      (!formData.reference_number || !formData.reference_number.trim())
    ) {
      return setValidationError(
        `A Transaction Reference is required for ${formData.payment_method} payments.`,
      );
    }

    const payload = {
      invoice_id: parseInt(formData.invoice_id, 10),
      amount_received: amountToApply,
      payment_method: formData.payment_method,
      payment_date: formData.payment_date,
      reference_number: requiresReference
        ? formData.reference_number.trim()
        : null,
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
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Record Payment
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Accounts Receivable Liquidation
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

              {isLoadingInvoices ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Scanning Outstanding Ledgers...
                  </p>
                </div>
              ) : (
                <form
                  id="paymentForm"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Target Invoice */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Target Invoice <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="invoice_id"
                      value={formData.invoice_id}
                      onChange={handleInvoiceSelect}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                    >
                      <option value="">-- Select an Unpaid Invoice --</option>
                      {unresolvedInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          [{inv.invoice_number}] {inv.customer_name} - Bal: ₱
                          {(
                            parseFloat(inv.grand_total) -
                            parseFloat(inv.amount_paid)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Financial Matrix Preview */}
                  {selectedInvoice && (
                    <div className="p-5 bg-slate-900 dark:bg-black rounded-2xl text-white shadow-xl">
                      <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-2">
                        <span>Original Invoice Total</span>
                        <span>
                          ₱
                          {grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4 pb-4 border-b border-white/10">
                        <span>Previously Paid</span>
                        <span>
                          - ₱
                          {previouslyPaid.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                          Remaining Balance
                        </span>
                        <span className="text-xl font-black text-rose-500">
                          ₱
                          {currentBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {amountToApply > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-between items-center pt-4 mt-4 border-t border-white/10"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            Projected Balance
                          </span>
                          <span
                            className={`text-lg font-black ${projectedBalance < 0 ? "text-red-500" : projectedBalance === 0 ? "text-emerald-500" : "text-amber-500"}`}
                          >
                            ₱
                            {projectedBalance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Operational Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Amount Received <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                          ₱
                        </span>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          name="amount_received"
                          value={formData.amount_received}
                          onChange={handleChange}
                          className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:border-amber-500"
                          placeholder="0.00"
                        />
                      </div>
                      {selectedInvoice && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              amount_received: currentBalance.toFixed(2),
                            })
                          }
                          className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          Apply Full Balance
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payment Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        name="payment_date"
                        max={getLocalDateString()}
                        value={formData.payment_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                      />
                    </div>

                    {requiresReference && (
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Transaction Reference Number{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="reference_number"
                          value={formData.reference_number || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500"
                          placeholder="e.g., Bank Ref or GCash Ref No."
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Collection Notes{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none"
                        placeholder="e.g., Downpayment or Cash handed to cashier."
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
                form="paymentForm"
                disabled={
                  isSubmitting || isLoadingInvoices || !formData.invoice_id
                }
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm & Record Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
