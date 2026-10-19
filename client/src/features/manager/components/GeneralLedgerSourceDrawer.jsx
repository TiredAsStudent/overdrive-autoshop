import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Loader2,
  Calendar,
  Building2,
  Calculator,
  Tag,
  User,
  AlertCircle,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";

import ExpenseApprovalDrawer from "./ExpenseApprovalDrawer";
import JournalEntryDrawer from "./JournalEntryDrawer";
import VendorPaymentDrawer from "./VendorPaymentDrawer";

import InvoiceDrawer from "../../staff/components/InvoiceDrawer";
import PaymentDrawer from "../../staff/components/PaymentDrawer";
import BillDrawer from "../../staff/components/BillDrawer";

// ----------------------------------------------------------------------
// INTERNAL COMPONENT: Dedicated Voucher for Inventory Movements/Adjustments
// ----------------------------------------------------------------------
const InventoryMovementDrawer = ({ isOpen, onClose, movementId }) => {
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && movementId) {
      setLoading(true);
      setError("");
      inventoryService
        .getSingleMovement(movementId)
        .then((res) => {
          if (isMounted) setMovement(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve inventory movement voucher.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setMovement(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, movementId]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDeduction = (parseFloat(movement?.quantity_deducted) || 0) > 0;
  const varianceQty = isDeduction
    ? parseFloat(movement?.quantity_deducted) || 0
    : parseFloat(movement?.quantity_added) || 0;
  const unitCost = parseFloat(movement?.recorded_unit_cost) || 0;
  const financialImpact = varianceQty * unitCost;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerTitleId}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        className="relative h-full h-dvh w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
      >
        <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div
              aria-hidden="true"
              className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0"
            >
              <Package size={24} />
            </div>
            <div className="min-w-0">
              <h2
                id={drawerTitleId}
                className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
              >
                {loading
                  ? "Loading..."
                  : movement?.transaction_reference || "Inventory Voucher"}
              </h2>
              {movement && (
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                  {(movement.transaction_type || "").replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inventory movement voucher drawer"
            className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center py-20 opacity-80"
            >
              <Loader2
                aria-hidden="true"
                className="w-8 h-8 animate-spin mb-3 text-amber-500"
              />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Retrieving Voucher...
              </p>
            </div>
          )}

          {error && !loading && (
            <div role="alert" className="form-error-banner">
              <AlertCircle
                size={18}
                aria-hidden="true"
                className="shrink-0 mt-0.5"
              />
              <span>{error}</span>
            </div>
          )}

          {movement && !loading && (
            <div className="space-y-6">
              {/* Asset Details */}
              <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Master Asset
                  </span>
                  <Tag
                    size={16}
                    aria-hidden="true"
                    className="text-slate-400"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-mono tabular-nums font-black uppercase text-amber-600 dark:text-overdrive-yellow tracking-widest mb-1">
                    {movement.sku}
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase">
                    {movement.item_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                    Category: {movement.category}
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-[20px] border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Calendar
                    size={16}
                    aria-hidden="true"
                    className="text-slate-400 mb-3"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    Execution Date
                  </p>
                  <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {formatDate(movement.created_at)}
                  </p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-[20px] border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Building2
                    size={16}
                    aria-hidden="true"
                    className="text-slate-400 mb-3"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    Branch Location
                  </p>
                  <p
                    className="text-sm font-bold text-slate-900 dark:text-white truncate"
                    title={movement.branch_name}
                  >
                    {movement.branch_name}
                  </p>
                </div>
              </div>

              {/* Financial Impact */}
              <section
                className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs ${
                  isDeduction
                    ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    aria-hidden="true"
                    className={`p-3.5 rounded-2xl shadow-inner shrink-0 ${
                      isDeduction
                        ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 truncate">
                      {isDeduction
                        ? "Asset Deduction Value"
                        : "Asset Gain Value"}
                    </span>
                    <span className="block text-[10px] font-mono tabular-nums font-bold uppercase tracking-widest opacity-70 truncate">
                      {varianceQty} {movement.uom} × ₱{formatCurrency(unitCost)}
                    </span>
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono tabular-nums text-left sm:text-right shrink-0">
                  {isDeduction ? "-" : "+"} ₱{formatCurrency(financialImpact)}
                </span>
              </section>

              {/* Remarks */}
              <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <User size={14} aria-hidden="true" />
                  <span>Audit Trail & Remarks</span>
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 leading-relaxed mb-4 shadow-2xs">
                  "{movement.remarks || "Automated system posting."}"
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-t border-slate-200 dark:border-slate-700 pt-4">
                  <span>Authorized By</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {movement.first_name
                      ? `${movement.first_name} ${movement.last_name}`
                      : "System Workflow"}
                  </span>
                </div>
              </section>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN EXPORT: The Universal Ledger Routing Engine
// ----------------------------------------------------------------------
const GeneralLedgerSourceDrawer = ({ isOpen, onClose, source }) => {
  if (!isOpen || !source) return null;

  const { type, id } = source;

  return (
    <AnimatePresence>
      {type === "EXPENSE" && (
        <ExpenseApprovalDrawer
          isOpen={isOpen}
          onClose={onClose}
          expenseId={id}
          readOnly={true}
        />
      )}
      {type === "JOURNAL_ENTRY" && (
        <JournalEntryDrawer
          isOpen={isOpen}
          onClose={onClose}
          journalId={id}
          readOnly={true}
        />
      )}
      {type === "VENDOR_PAYMENT" && (
        <VendorPaymentDrawer
          isOpen={isOpen}
          onClose={onClose}
          paymentId={id}
          readOnly={true}
        />
      )}
      {type === "INVOICE" && (
        <InvoiceDrawer
          isOpen={isOpen}
          onClose={onClose}
          invoiceId={id}
          readOnly={true}
        />
      )}
      {type === "PAYMENT" && (
        <PaymentDrawer
          isOpen={isOpen}
          onClose={onClose}
          paymentId={id}
          readOnly={true}
        />
      )}
      {type === "BILL" && (
        <BillDrawer
          isOpen={isOpen}
          onClose={onClose}
          billId={id}
          readOnly={true}
        />
      )}
      {(type === "INVENTORY_MOVEMENT" || type === "INVENTORY_ADJUSTMENT") && (
        <InventoryMovementDrawer
          isOpen={isOpen}
          onClose={onClose}
          movementId={id}
        />
      )}
    </AnimatePresence>
  );
};

export default GeneralLedgerSourceDrawer;
