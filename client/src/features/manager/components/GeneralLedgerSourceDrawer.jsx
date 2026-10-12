import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (isOpen && movementId) {
      setLoading(true);
      setError("");
      inventoryService
        .getSingleMovement(movementId)
        .then((res) => setMovement(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setMovement(null);
    }
  }, [isOpen, movementId]);

  if (!isOpen) return null;

  const isDeduction = movement?.quantity_deducted > 0;
  const varianceQty = isDeduction
    ? movement.quantity_deducted
    : movement?.quantity_added;
  const financialImpact =
    varianceQty * parseFloat(movement?.recorded_unit_cost || 0);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        className="relative w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
      >
        <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-500 shrink-0">
              <Package size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                {movement?.transaction_reference || "Loading..."}
              </h2>
              {movement && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                  {movement.transaction_type.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Retrieving Voucher...
              </p>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 text-center flex items-center justify-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {movement && !loading && (
            <div className="space-y-6">
              {/* Asset Details */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Master Asset
                  </span>
                  <Tag size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">
                    {movement.sku}
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase">
                    {movement.item_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Category: {movement.category}
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-[20px] border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Calendar size={16} className="text-slate-400 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Execution Date
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {new Date(movement.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-[20px] border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Building2 size={16} className="text-slate-400 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Branch Location
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {movement.branch_name}
                  </p>
                </div>
              </div>

              {/* Financial Impact */}
              <section
                className={`p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm ${isDeduction ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`p-3.5 rounded-2xl shadow-inner shrink-0 ${isDeduction ? "bg-red-100 dark:bg-red-500/20 text-red-600" : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"}`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 truncate">
                      {isDeduction
                        ? "Asset Deduction Value"
                        : "Asset Gain Value"}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-50 truncate">
                      {varianceQty} {movement.uom} × ₱
                      {parseFloat(movement.recorded_unit_cost).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black tracking-tight font-mono text-left sm:text-right shrink-0">
                  {isDeduction ? "-" : "+"} ₱
                  {financialImpact.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </section>

              {/* Remarks */}
              <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <User size={14} /> Audit Trail & Remarks
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 leading-relaxed mb-4 shadow-sm">
                  "{movement.remarks || "Automated system posting."}"
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 dark:border-slate-700 pt-4">
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
          readOnly={true}
        />
      )}
    </AnimatePresence>
  );
};

export default GeneralLedgerSourceDrawer;
