import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { billService } from "../../../services/staff/bill.service";
import { purchaseOrderService } from "../../../services/staff/purchaseOrder.service";

// Timezone safe date formatter
const formatToLocalDateInput = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BillModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [eligiblePOs, setEligiblePOs] = useState([]);
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [poDetails, setPoDetails] = useState(null);
  const [isLoadingPODetails, setIsLoadingPODetails] = useState(false);

  const [formData, setFormData] = useState({
    purchase_order_id: "",
    vendor_invoice_number: "",
    bill_date: formatToLocalDateInput(),
    notes: "",
    status: "PENDING_RECEIPT",
  });

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      setPoDetails(null);
      setFormData({
        purchase_order_id: "",
        vendor_invoice_number: "",
        bill_date: formatToLocalDateInput(),
        notes: "",
        status: "PENDING_RECEIPT",
      });

      // Fetch eligible POs
      setIsLoadingPOs(true);
      billService
        .getEligiblePOs()
        .then((res) => setEligiblePOs(res.data || []))
        .catch((err) => setValidationError("Could not fetch eligible POs."))
        .finally(() => setIsLoadingPOs(false));
    }
  }, [isOpen]);

  // Fetch full PO details when a PO is selected to get the line items
  useEffect(() => {
    if (formData.purchase_order_id) {
      setIsLoadingPODetails(true);
      purchaseOrderService
        .getPurchaseOrderDetails(formData.purchase_order_id)
        .then((res) => setPoDetails(res.data))
        .catch((err) => setValidationError("Failed to load PO line items."))
        .finally(() => setIsLoadingPODetails(false));
    } else {
      setPoDetails(null);
    }
  }, [formData.purchase_order_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.purchase_order_id)
      return setValidationError("You must select a source Purchase Order.");
    if (!formData.vendor_invoice_number.trim())
      return setValidationError("Vendor Invoice / Receipt Number is required.");
    if (!poDetails || !poDetails.items)
      return setValidationError("PO line items failed to load.");

    // Map the PO items into the Bill Items format
    const items = poDetails.items.map((item) => ({
      item_id: item.item_id,
      quantity_received: item.quantity,
      recorded_unit_cost: parseFloat(item.recorded_unit_cost),
      discount_amount: parseFloat(item.discount_amount),
    }));

    setIsSubmitting(true);
    try {
      await onSubmit({
        purchase_order_id: parseInt(formData.purchase_order_id, 10),
        vendor_invoice_number: formData.vendor_invoice_number
          .toUpperCase()
          .trim(),
        bill_date: formData.bill_date,
        status: formData.status,
        notes: formData.notes,
        items,
      });
    } catch (error) {
      setValidationError(error.message || "Failed to process bill.");
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
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Record Supplier Bill
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Accounts Payable Entry
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <form id="billForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Source Purchase Order{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="purchase_order_id"
                    value={formData.purchase_order_id}
                    onChange={handleChange}
                    disabled={isLoadingPOs}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    <option value="">
                      {isLoadingPOs
                        ? "Loading POs..."
                        : "-- Select an Approved PO --"}
                    </option>
                    {eligiblePOs.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.purchase_order_number} — {po.vendor_name} (₱
                        {po.grand_total})
                      </option>
                    ))}
                  </select>
                  {eligiblePOs.length === 0 && !isLoadingPOs && (
                    <p className="text-[10px] text-red-500 mt-2 font-medium">
                      No pending approved Purchase Orders found for this branch.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Vendor Invoice / OR Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="vendor_invoice_number"
                      value={formData.vendor_invoice_number}
                      onChange={handleChange}
                      placeholder="e.g. INV-9942"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Billing Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        type="date"
                        name="bill_date"
                        value={formData.bill_date}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Receiving Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PENDING_RECEIPT">
                      Draft / Pending Physical Delivery
                    </option>
                    <option value="RECEIVED">
                      Goods Received (Post to Inventory & Ledger)
                    </option>
                  </select>
                  {formData.status === "RECEIVED" && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-black tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> Warning: This will immediately
                      impact live inventory.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Remarks / Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Any discrepancies or notes from the courier..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {isLoadingPODetails && (
                  <div className="flex justify-center p-4">
                    <Loader2
                      className="animate-spin text-amber-500"
                      size={24}
                    />
                  </div>
                )}

                {poDetails && (
                  <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <FileText size={14} /> Verified PO Line Items (
                      {poDetails.items.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                      {poDetails.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
                        >
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate pr-4">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="font-mono text-slate-500">
                            ₱
                            {parseFloat(
                              item.recorded_unit_cost,
                            ).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="submit"
                form="billForm"
                disabled={isSubmitting || isLoadingPOs || isLoadingPODetails}
                className={`w-full py-4 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer ${
                  formData.status === "RECEIVED"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Receipt size={16} />
                )}
                {formData.status === "RECEIVED"
                  ? "Post Bill & Receive Stock"
                  : "Save Draft Bill"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BillModal;
