import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Save } from "lucide-react";

const EditBranchModal = ({ isOpen, onClose, branch, onSave }) => {
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill the form when the modal opens with a specific branch
  useEffect(() => {
    if (branch) {
      setAddress(branch.address || "");
      setContactNumber(branch.contact_number || "");
    }
  }, [branch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(branch.id, address, contactNumber);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                Edit {branch?.branch_name}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Update PDF Header Details
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <MapPin size={14} className="text-blue-500" /> Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 123 National Highway..."
                className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Phone size={14} className="text-blue-500" /> Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 049-555-1234"
                className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl uppercase text-xs tracking-[0.1em] shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                "Saving Details..."
              ) : (
                <>
                  <Save size={16} /> Save Branch Identity
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditBranchModal;
