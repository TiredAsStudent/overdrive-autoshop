import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  CheckCircle2,
  PackageCheck,
  Search,
  UploadCloud,
  FileCode2,
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

  // Custom Searchable Dropdown & File Refs
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const [formData, setFormData] = useState({
    purchase_order_id: "",
    vendor_invoice_number: "",
    bill_date: formatToLocalDateInput(),
    notes: "",
    status: "PENDING_RECEIPT",
  });

  useEffect(() => {
    return () => {
      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    };
  }, [attachmentPreview]);

  useEffect(() => {
    if (isOpen) {
      setValidationError("");
      setPoDetails(null);
      setSearchTerm("");
      setIsDropdownOpen(false);
      setFormData({
        purchase_order_id: "",
        vendor_invoice_number: "",
        bill_date: formatToLocalDateInput(),
        notes: "",
        status: "PENDING_RECEIPT",
      });

      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
      setAttachmentFile(null);
      setAttachmentPreview(null);

      // Fetch eligible POs
      setIsLoadingPOs(true);
      billService
        .getEligiblePOs()
        .then((res) => setEligiblePOs(res.data || []))
        .catch((err) => setValidationError("Could not fetch eligible POs."))
        .finally(() => setIsLoadingPOs(false));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const filteredPOs = eligiblePOs.filter(
    (po) =>
      po.purchase_order_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    if (formData.purchase_order_id) {
      setFormData((prev) => ({ ...prev, purchase_order_id: "" }));
      setPoDetails(null);
    }
  };

  const handleSelectPO = (po) => {
    setFormData((prev) => ({ ...prev, purchase_order_id: po.id.toString() }));
    setSearchTerm(`${po.purchase_order_number} — ${po.vendor_name}`);
    setIsDropdownOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.type)) {
        setValidationError(
          "Invalid file format. Only PDF, JPEG, PNG, and WEBP are allowed.",
        );
        removeFile();
        return;
      }

      // Max Size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        setValidationError("Document exceeds the maximum 10MB size limit.");
        removeFile();
        return;
      }

      if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
      setAttachmentFile(file);
      setAttachmentPreview(URL.createObjectURL(file));
      setValidationError("");
    }
  };

  const removeFile = () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.purchase_order_id)
      return setValidationError(
        "You must search and select a source Purchase Order.",
      );
    if (!formData.vendor_invoice_number.trim())
      return setValidationError("Vendor Invoice / Receipt Number is required.");
    if (!poDetails || !poDetails.items)
      return setValidationError("PO line items failed to load.");

    const items = poDetails.items.map((item) => ({
      item_id: item.item_id,
      quantity_received: item.quantity,
      recorded_unit_cost: parseFloat(item.recorded_unit_cost),
      discount_amount: parseFloat(item.discount_amount),
    }));

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          purchase_order_id: parseInt(formData.purchase_order_id, 10),
          vendor_invoice_number: formData.vendor_invoice_number
            .toUpperCase()
            .trim(),
          bill_date: formData.bill_date,
          status: formData.status,
          notes: formData.notes,
          items,
        },
        attachmentFile,
      );
    } catch (error) {
      setValidationError(error.message || "Failed to process bill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Receipt size={24} />
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
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
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
                {/* SECTION 1: SOURCE DOCUMENT */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <FileText size={14} /> Source Document
                  </h3>
                  <div className="space-y-4">
                    {/* CUSTOM SEARCHABLE DROPDOWN */}
                    <div ref={dropdownRef} className="relative z-20">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Source Purchase Order{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          {isLoadingPOs ? (
                            <Loader2
                              size={18}
                              className="text-amber-500 animate-spin"
                            />
                          ) : (
                            <Search size={18} className="text-slate-400" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          onFocus={() => setIsDropdownOpen(true)}
                          placeholder="Type PO Number or Vendor Name to search..."
                          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm"
                        />

                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                            >
                              {filteredPOs.length > 0 ? (
                                filteredPOs.map((po) => (
                                  <div
                                    key={po.id}
                                    onClick={() => handleSelectPO(po)}
                                    className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                                  >
                                    <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                      {po.purchase_order_number}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                      {po.vendor_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium tracking-widest uppercase">
                                      Total Amount:{" "}
                                      <span className="font-black text-slate-700 dark:text-slate-300">
                                        ₱
                                        {parseFloat(
                                          po.grand_total,
                                        ).toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                        })}
                                      </span>
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center">
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                                    {isLoadingPOs
                                      ? "Loading POs..."
                                      : "No matching approved POs found."}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all"
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 2: BILLING DETAILS & FILE UPLOAD */}
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Calendar size={14} /> Billing Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Billing Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        name="bill_date"
                        value={formData.bill_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all cursor-pointer"
                      />
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm transition-all cursor-pointer"
                      >
                        <option value="PENDING_RECEIPT">
                          Draft / Pending Delivery
                        </option>
                        <option value="RECEIVED">
                          Goods Received (Post to Inventory)
                        </option>
                      </select>
                    </div>
                  </div>

                  {formData.status === "RECEIVED" && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl mb-5">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-wider flex items-center gap-1.5 uppercase">
                        <CheckCircle2 size={14} /> Immediate Inventory Posting
                        Active
                      </p>
                    </div>
                  )}

                  {/* BILL ATTACHMENT DROPZONE */}
                  <div className="mb-5 border-t border-slate-200 dark:border-slate-700 pt-5">
                    <label className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      <FileCode2 size={14} /> Documentary Proof
                      <span className="text-slate-400 font-medium lowercase">
                        (Optional)
                      </span>
                    </label>

                    {!attachmentPreview ? (
                      <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative cursor-pointer">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg, image/png, image/webp, application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <UploadCloud
                          size={32}
                          className="text-slate-400 mb-3"
                        />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Click or drag Receipt to attach
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 text-center">
                          PDF, JPEG, PNG, WEBP up to 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-white dark:bg-slate-800 p-2">
                        {attachmentFile?.type === "application/pdf" ? (
                          <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <FileText size={40} className="text-red-500 mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                              {attachmentFile.name}
                            </p>
                          </div>
                        ) : (
                          <img
                            src={attachmentPreview}
                            alt="Document Preview"
                            className="w-full h-48 sm:h-56 object-contain bg-slate-50 dark:bg-slate-900 rounded-lg"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <button
                            type="button"
                            onClick={removeFile}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            <X size={14} /> Remove Document
                          </button>
                        </div>
                      </div>
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
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none shadow-sm transition-all"
                    />
                  </div>
                </section>

                {/* SECTION 3: VERIFIED PREVIEW */}
                {isLoadingPODetails && (
                  <div className="flex justify-center p-4">
                    <Loader2
                      className="animate-spin text-amber-500"
                      size={24}
                    />
                  </div>
                )}

                {poDetails && (
                  <div className="mt-4 p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                      <PackageCheck size={14} className="text-amber-500" />{" "}
                      Verified PO Line Items ({poDetails.items.length})
                    </h4>

                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {poDetails.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-xs p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate pr-4 uppercase">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="font-mono font-black text-slate-600 dark:text-slate-400">
                            ₱
                            {parseFloat(item.recorded_unit_cost).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Subtotal</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          ₱
                          {parseFloat(poDetails.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>VAT Amount</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          ₱
                          {parseFloat(poDetails.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>Grand Total</span>
                        <span className="font-mono text-amber-500 tracking-tight">
                          ₱
                          {parseFloat(poDetails.grand_total).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 shrink-0">
              <button
                type="submit"
                form="billForm"
                disabled={isSubmitting || isLoadingPOs || isLoadingPODetails}
                className={`w-full py-4 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer ${
                  formData.status === "RECEIVED"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : formData.status === "RECEIVED" ? (
                  <CheckCircle2 size={16} />
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
