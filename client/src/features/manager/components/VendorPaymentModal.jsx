import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Wallet,
  Search,
  UploadCloud,
  FileCode2,
  Store,
  FileText,
} from "lucide-react";
import { vendorPaymentService } from "../../../services/manager/vendorPayment.service";
import { managerVendorService } from "../../../services/manager/vendor.service";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "CHECK", label: "Company Check" },
  { id: "GCASH", label: "GCash E-Wallet" },
  { id: "MAYA", label: "Maya E-Wallet" },
  { id: "BANK_TRANSFER", label: "Bank Transfer" },
];

const REQUIRES_EVIDENCE = ["CHECK", "GCASH", "MAYA", "BANK_TRANSFER"];

const formatToLocalDateInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const VendorPaymentModal = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [vendors, setVendors] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorRef = useRef(null);

  const [eligibleBills, setEligibleBills] = useState([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const fileInputRef = useRef(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    vendor_id: "",
    bill_id: "",
    amount_paid: "",
    payment_method: "BANK_TRANSFER",
    payment_date: formatToLocalDateInput(),
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      setIsLoadingVendors(true);
      managerVendorService
        .getVendors(1, 1000, "", "active", "all", "all")
        .then((res) => setVendors(res.data?.vendors || []))
        .catch(() => setValidationError("Failed to load vendor directory."))
        .finally(() => setIsLoadingVendors(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        vendor_id: "",
        bill_id: "",
        amount_paid: "",
        payment_method: "BANK_TRANSFER",
        payment_date: formatToLocalDateInput(),
        reference_number: "",
        notes: "",
      });
      setSelectedBill(null);
      setEligibleBills([]);
      setVendorSearch("");
      setValidationError("");
      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofFile(null);
      setProofPreview(null);
      setIsDragging(false);

      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorRef.current && !vendorRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  useEffect(() => {
    if (formData.vendor_id) {
      setIsLoadingBills(true);
      vendorPaymentService
        .getEligibleBills(formData.vendor_id)
        .then((res) => setEligibleBills(res.data || []))
        .catch(() =>
          setValidationError(
            "Failed to load outstanding bills for this vendor.",
          ),
        )
        .finally(() => setIsLoadingBills(false));
    } else {
      setEligibleBills([]);
    }
    setSelectedBill(null);
    setFormData((prev) => ({ ...prev, bill_id: "", amount_paid: "" }));
  }, [formData.vendor_id]);

  const filteredVendors = vendors.filter(
    (v) =>
      v.business_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.vendor_code.toLowerCase().includes(vendorSearch.toLowerCase()),
  );

  const handleSelectVendor = (v) => {
    setFormData((prev) => ({ ...prev, vendor_id: v.id.toString() }));
    setVendorSearch(v.business_name);
    setIsVendorDropdownOpen(false);
  };

  const handleBillSelect = (e) => {
    const bId = e.target.value;
    const bill = eligibleBills.find((b) => b.id.toString() === bId.toString());
    setSelectedBill(bill || null);
    setFormData((prev) => ({
      ...prev,
      bill_id: bId,
      amount_paid: bill ? bill.remaining_balance : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const processFile = (file) => {
    if (!file) return;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setValidationError(
        "Invalid format. Only PDF, JPEG, PNG, and WEBP are allowed.",
      );
      removeFile();
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setValidationError("Document exceeds the maximum 10MB limit.");
      removeFile();
      return;
    }

    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    setValidationError("");
  };

  const removeFile = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const { currentBalance } = useMemo(() => {
    const cb = selectedBill ? parseFloat(selectedBill.remaining_balance) : 0;
    return { currentBalance: cb };
  }, [selectedBill]);

  const amountToApply = parseFloat(formData.amount_paid) || 0;
  const projectedBalance =
    Math.round((currentBalance - amountToApply) * 100) / 100;
  const requiresReference = REQUIRES_EVIDENCE.includes(formData.payment_method);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.vendor_id || !formData.bill_id || !selectedBill) {
      return setValidationError(
        "You must select a Vendor and an outstanding Bill.",
      );
    }
    if (amountToApply <= 0) {
      return setValidationError("Payment amount must be greater than zero.");
    }
    if (amountToApply > currentBalance) {
      return setValidationError(
        `Payment exceeds the remaining liability of ₱${currentBalance.toFixed(2)}`,
      );
    }

    if (requiresReference) {
      if (!formData.reference_number?.trim()) {
        return setValidationError(
          `A Reference/Check Number is required for ${formData.payment_method}.`,
        );
      }
      if (!proofFile) {
        return setValidationError(
          `Documentary proof is mandatory for ${formData.payment_method} payments.`,
        );
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          vendor_id: parseInt(formData.vendor_id, 10),
          bill_id: parseInt(formData.bill_id, 10),
          amount_paid: amountToApply,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          reference_number: requiresReference
            ? formData.reference_number.trim()
            : null,
          notes: formData.notes,
        },
        proofFile,
      );
    } catch (error) {
      setValidationError(error.message);
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
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Vendor Payment
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Record payment to a vendor
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

              <form id="vpayForm" onSubmit={handleSubmit} className="space-y-6">
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Store size={14} /> Payee & Liability Selection
                  </h3>

                  <div className="space-y-4">
                    <div ref={vendorRef} className="relative z-20">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Select Vendor <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          {isLoadingVendors ? (
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
                          value={vendorSearch}
                          onChange={(e) => {
                            setVendorSearch(e.target.value);
                            setIsVendorDropdownOpen(true);
                            if (formData.vendor_id)
                              setFormData((prev) => ({
                                ...prev,
                                vendor_id: "",
                                bill_id: "",
                              }));
                          }}
                          onFocus={() => setIsVendorDropdownOpen(true)}
                          placeholder="Type Vendor Name to search..."
                          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 transition-all shadow-sm"
                        />
                        <AnimatePresence>
                          {isVendorDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar z-30"
                            >
                              {filteredVendors.length > 0 ? (
                                filteredVendors.map((v) => (
                                  <div
                                    key={v.id}
                                    onClick={() => handleSelectVendor(v)}
                                    className="p-4 sm:p-5 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                                  >
                                    <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">
                                      {v.vendor_code}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                      {v.business_name}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center text-xs font-medium text-slate-500 uppercase tracking-widest">
                                  No matching vendors found.
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Target Outstanding Bill{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={formData.bill_id}
                          onChange={handleBillSelect}
                          disabled={!formData.vendor_id || isLoadingBills}
                          className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="" disabled>
                            {isLoadingBills
                              ? "Loading outstanding bills..."
                              : !formData.vendor_id
                                ? "Select a vendor first..."
                                : "-- Select an Outstanding Bill --"}
                          </option>
                          {eligibleBills.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bill_number} (INV: {b.vendor_invoice_number}) —
                              Owe ₱
                              {parseFloat(b.remaining_balance).toLocaleString()}
                            </option>
                          ))}
                        </select>
                        {isLoadingBills && (
                          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                            <Loader2
                              size={16}
                              className="text-amber-500 animate-spin"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedBill && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="mt-5 p-5 bg-slate-900 dark:bg-black rounded-2xl text-white shadow-xl overflow-hidden"
                      >
                        <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-2">
                          <span>Original Bill Total</span>
                          <span>
                            ₱
                            {parseFloat(
                              selectedBill.grand_total,
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4 pb-4 border-b border-white/10">
                          <span>Previously Paid</span>
                          <span>
                            - ₱
                            {parseFloat(
                              selectedBill.amount_paid,
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                            Remaining Payable
                          </span>
                          <span className="text-xl font-black text-rose-500 font-mono">
                            ₱
                            {currentBalance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <AnimatePresence>
                          {amountToApply > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="flex justify-between items-center pt-4 mt-4 border-t border-white/10"
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                Projected Balance
                              </span>
                              <span
                                className={`text-lg font-black font-mono ${projectedBalance < 0 ? "text-red-500" : projectedBalance === 0 ? "text-emerald-500" : "text-amber-500"}`}
                              >
                                ₱
                                {projectedBalance.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                    <Wallet size={14} /> Payment Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Amount to Pay <span className="text-red-500">*</span>
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
                          name="amount_paid"
                          value={formData.amount_paid}
                          onChange={handleChange}
                          disabled={!selectedBill}
                          className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm disabled:opacity-50"
                          placeholder="0.00"
                        />
                      </div>
                      {selectedBill && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              amount_paid: currentBalance.toFixed(2),
                            })
                          }
                          className="mt-2 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          Apply Full Remaining Balance
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
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm cursor-pointer"
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
                        max={formatToLocalDateInput()}
                        value={formData.payment_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm cursor-pointer"
                      />
                    </div>

                    {requiresReference && (
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Check No. / Trans Ref Number{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="reference_number"
                          value={formData.reference_number || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                          placeholder="e.g., CHK-10294 or BDO-0921"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-5">
                      <label className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                        <FileCode2 size={14} /> Documentary Proof
                        {requiresReference ? (
                          <span className="text-red-500">
                            *(Required for {formData.payment_method})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium lowercase">
                            (Optional)
                          </span>
                        )}
                      </label>

                      {!proofPreview ? (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                            isDragging
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg, image/png, image/webp, application/pdf"
                            className="hidden"
                          />
                          <UploadCloud
                            size={32}
                            className={`mb-3 transition-colors ${isDragging ? "text-amber-500" : "text-slate-400"}`}
                          />
                          <p
                            className={`text-xs font-bold ${isDragging ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"}`}
                          >
                            {isDragging
                              ? "Drop document here"
                              : "Click or drag proof (check copy/slip)"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 text-center">
                            PDF, JPEG, PNG, WEBP up to 10MB
                          </p>
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-white dark:bg-slate-800 p-2">
                          {proofFile?.type === "application/pdf" ? (
                            <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                              <FileText
                                size={40}
                                className="text-red-500 mb-2"
                              />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                                {proofFile.name}
                              </p>
                            </div>
                          ) : (
                            <img
                              src={proofPreview}
                              alt="Proof"
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

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Payment Notes{" "}
                        <span className="text-slate-400 font-medium lowercase">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none focus:outline-none focus:border-amber-500 shadow-sm"
                        placeholder="e.g., Final tranche payment for August deliveries."
                      />
                    </div>
                  </div>
                </section>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <button
                type="submit"
                form="vpayForm"
                disabled={isSubmitting || !selectedBill}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm & Save Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorPaymentModal;
