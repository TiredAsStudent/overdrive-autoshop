import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Percent,
  Landmark,
  MapPin,
  Phone,
  Save,
  RefreshCw,
  Info,
  ShieldCheck,
  Building2,
  Calculator,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import systemSettingsService from "../../services/systemSettings.service";
import EditBranchModal from "../../features/admin/components/EditBranchModal";

// Frontend Validation Schema (Matches Backend)
const financialsSchema = z.object({
  markup: z
    .number()
    .min(0, "Markup cannot be negative")
    .max(1000, "Markup exceeds 1000%"),
  vat: z
    .number()
    .min(0, "VAT cannot be negative")
    .max(100, "VAT cannot exceed 100%"),
});

const AdminSettings = () => {
  // State: Data
  const [markup, setMarkup] = useState("");
  const [vat, setVat] = useState("");
  const [branches, setBranches] = useState([]);

  // State: UI Status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // State: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // 1. Fetch Live Data on Mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [financialData, branchData] = await Promise.all([
          systemSettingsService.getFinancials(),
          systemSettingsService.getBranches(),
        ]);
        setMarkup(financialData.markupPercentage);
        setVat(financialData.vatPercentage);
        setBranches(branchData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. Handle Financial Updates
  const handleSaveFinancials = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);

    // 1. Validate locally FIRST using safeParse
    const validation = financialsSchema.safeParse({
      markup: Number(markup),
      vat: Number(vat),
    });

    // BULLETPROOF ERROR EXTRACTION
    if (!validation.success) {
      // Safely checks both .issues and .errors without crashing
      const errorMessage =
        validation.error?.issues?.[0]?.message ||
        validation.error?.errors?.[0]?.message ||
        "Please enter valid numbers.";

      setError(errorMessage);
      setIsSaving(false);
      return;
    }

    // 2. If valid, send to Backend API
    try {
      const updatedData = await systemSettingsService.updateFinancials(
        markup,
        vat,
      );
      setMarkup(updatedData.markupPercentage);
      setVat(updatedData.vatPercentage);
      setSuccessMsg("Global financial rules updated and logged.");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message); // Catch backend API errors cleanly
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Handle Branch Updates (Passed to Modal)
  const handleSaveBranch = async (branchId, address, contactNumber) => {
    try {
      const updatedBranch = await systemSettingsService.updateBranch(
        branchId,
        address,
        contactNumber,
      );

      // Optimistically update the UI without reloading the page
      setBranches((prevBranches) =>
        prevBranches.map((b) =>
          b.id === branchId
            ? {
                ...b,
                address: updatedBranch.address,
                contact_number: updatedBranch.contact_number,
              }
            : b,
        ),
      );
      setSuccessMsg(`Branch ${branchId} details updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold animate-pulse">
        Loading Business Engine Rules...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ALERTS */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* THE BUSINESS LOGIC ENGINE (MARKUP & TAX) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-amber-500 rounded-2xl text-slate-900">
                <Calculator size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                  Pricing & Tax Engine
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Global Logic Variables
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                  <Percent size={14} className="text-amber-500" /> Global Markup
                  (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={markup}
                    onChange={(e) => setMarkup(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-2xl font-black dark:text-white outline-none focus:border-amber-500 transition-all"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">
                  Applied to all unit costs extracted via OCR.
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                  <Landmark size={14} className="text-blue-500" /> Value Added
                  Tax (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-2xl font-black dark:text-white outline-none focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">
                  Philippine Standard VAT (Default 12%).
                </p>
              </div>
            </div>

            {/* FORMULA DISPLAY */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                <RefreshCw size={100} />
              </div>
              <h4 className="text-[10px] font-black uppercase text-amber-500 mb-4 tracking-widest">
                Active Calculation Logic
              </h4>

              {/* BEAUTIFUL TAILWIND HTML FORMULA */}
              <div className="flex items-center gap-2 text-sm md:text-base font-mono overflow-x-auto whitespace-nowrap bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner">
                <span className="text-white font-bold">Suggested Retail</span>
                <span className="text-slate-500">=</span>
                <span className="text-slate-300">Unit Cost</span>
                <span className="text-slate-500">×</span>

                {/* Markup Multiplier */}
                <div className="flex items-center">
                  <span className="text-slate-500">(</span>
                  <span className="text-white">1</span>
                  <span className="text-slate-500 mx-2">+</span>
                  <div className="flex flex-col items-center justify-center text-xs">
                    {/* The dynamic markup number */}
                    <span className="border-b border-slate-600 px-1 text-amber-400 font-bold">
                      {markup || 0}
                    </span>
                    <span className="text-slate-500">100</span>
                  </div>
                  <span className="text-slate-500">)</span>
                </div>

                <span className="text-slate-500">×</span>

                {/* VAT Multiplier */}
                <div className="flex items-center">
                  <span className="text-slate-500">(</span>
                  <span className="text-white">1</span>
                  <span className="text-slate-500 mx-2">+</span>
                  <div className="flex flex-col items-center justify-center text-xs">
                    {/* The dynamic vat number */}
                    <span className="border-b border-slate-600 px-1 text-blue-400 font-bold">
                      {vat || 0}
                    </span>
                    <span className="text-slate-500">100</span>
                  </div>
                  <span className="text-slate-500">)</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase">
                <ShieldCheck size={14} className="text-emerald-500" /> Changes
                apply to all branches instantly
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveFinancials}
            disabled={isSaving}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSaving ? (
              "COMMITTING TO DATABASE..."
            ) : (
              <>
                <Save size={18} /> Commit Global Changes
              </>
            )}
          </button>
        </div>

        {/* BRANCH INFORMATION MANAGEMENT */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-500 rounded-2xl text-white">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                  Branch Identity
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  PDF Header Registry
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500">
                      {branch.branch_name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedBranch(branch);
                        setIsModalOpen(true);
                      }}
                      className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-900 dark:hover:text-white transition-all"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 text-xs text-slate-500 font-medium">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      {branch.address || "Address not set"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <Phone size={14} className="shrink-0" />
                      {branch.contact_number || "Contact not set"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-3xl flex items-start gap-3">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
              <strong>Dynamic Injection:</strong> These contact details are
              automatically pulled to the header of all Estimates, Invoices, and
              Service Passports based on the logged-in staff's branch.
            </p>
          </div>
        </div>
      </div>

      {/* Render the Modal */}
      <EditBranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        branch={selectedBranch}
        onSave={handleSaveBranch}
      />
    </div>
  );
};

export default AdminSettings;
