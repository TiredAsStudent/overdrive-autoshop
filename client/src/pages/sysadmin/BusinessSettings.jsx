import React, { useState, useEffect, useRef } from "react";
import {
  Settings2,
  Save,
  Upload,
  Image as ImageIcon,
  Building2,
  Percent,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import { settingsService } from "../../services/sysadmin/settings.service";
import { useApp } from "../../context/AppContext";
import ConfirmModal from "../../components/shared/ConfirmModal";

const BusinessSettings = () => {
  const { showToast } = useApp();
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "Overdrive Auto Shop",
    vat_percentage: 12.0,
    markup_percentage: 20.0,
    contact_email: "",
    contact_number: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getSettings();
      const settingsData = response?.data?.data || response?.data || response;

      if (settingsData) {
        setFormData({
          company_name: settingsData.company_name || "",
          vat_percentage: Number(settingsData.vat_percentage) || 0,
          markup_percentage: Number(settingsData.markup_percentage) || 0,
          contact_email: settingsData.contact_email || "",
          contact_number: settingsData.contact_number || "",
        });

        if (settingsData.logo_url) {
          const baseUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace("/api/v1", "")
            : "http://localhost:5000";
          setLogoPreview(`${baseUrl}${settingsData.logo_url}`);
        }
      }
    } catch (err) {
      console.error("Failed to sync settings:", err);
      showToast(err.message || "Failed to load business settings.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "number" ? (value === "" ? "" : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast(
        "File rejected. Upload must be a valid JPEG, PNG, or WEBP.",
        "error",
      );
      setLogoFile(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image is too heavy. Maximum allowed size is 2MB.", "error");
      setLogoFile(null);
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    setIsConfirmModalOpen(true);
  };

  const executeSaveSettings = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const submitData = new FormData();

      submitData.append("company_name", formData.company_name.trim());
      submitData.append("vat_percentage", formData.vat_percentage);
      submitData.append("markup_percentage", formData.markup_percentage);
      submitData.append(
        "contact_email",
        formData.contact_email.trim().toLowerCase(),
      );
      submitData.append("contact_number", formData.contact_number.trim());

      if (logoFile) {
        submitData.append("logo", logoFile);
      }

      await settingsService.updateSettings(submitData);

      showToast("Global business logic updated successfully.", "success");
      setLogoFile(null);
      await loadSettings();
    } catch (err) {
      showToast(err.message || "Failed to save configuration.", "error");
    } finally {
      setIsSaving(false);
      setIsConfirmModalOpen(false); // Close modal automatically
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Syncing Enterprise Rules...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-10">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Settings2 className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Business Logic
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Manage company information, pricing, and tax settings.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <button
            type="submit"
            form="settingsForm"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "SAVING..." : "SAVE SETTINGS"}
          </button>
        </div>
      </div>

      {/* MAIN CONFIGURATION FORM */}
      <form
        id="settingsForm"
        onSubmit={handleFormSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
      >
        {/* LEFT COLUMN: BRANDING */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm p-8">
            <h3 className="text-[10px] font-black uppercase text-amber-500 mb-6 tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> Company Profile
            </h3>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                  Company Logo
                </label>
                <div
                  className={`w-full aspect-square max-h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group transition-all cursor-pointer ${logoPreview ? "border-amber-500/50 bg-white dark:bg-slate-900" : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-black/20 hover:border-amber-500"}`}
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Company Logo"
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                        <Upload size={24} className="mb-2 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Replace Logo File
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors p-6 text-center">
                      <ImageIcon size={48} className="mb-4 opacity-50" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Upload Master Logo
                      </span>
                      <span className="text-[9px] mt-2 opacity-70 font-bold">
                        Strictly PNG, JPG (Max 2MB)
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileChange}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label
                  htmlFor="company_name"
                  className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest"
                >
                  Business Name
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    maxLength={255}
                    disabled={isSaving}
                    placeholder="Enter business entity title"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-black text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors uppercase disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MATH & CONTACTS */}
        <div className="xl:col-span-2 space-y-8">
          {/* FINANCIAL MATH ENGINE */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8">
            <h3 className="text-[10px] font-black uppercase text-amber-500 mb-6 tracking-widest flex items-center gap-2">
              <Percent size={14} /> Financial Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* VAT Rule */}
              <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <label
                    htmlFor="vat_percentage"
                    className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-1"
                  >
                    Value Added Tax
                  </label>
                  <p className="text-[10px] font-bold text-slate-500 mb-4 leading-relaxed">
                    Automated tax matrix calculated across ledger orders.
                  </p>
                </div>
                <div className="relative mt-auto">
                  <input
                    type="number"
                    id="vat_percentage"
                    name="vat_percentage"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.vat_percentage}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-lg font-black text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors pr-12 font-mono disabled:opacity-60"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg font-mono">
                    %
                  </span>
                </div>
              </div>

              {/* Markup Rule */}
              <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                <div>
                  <label
                    htmlFor="markup_percentage"
                    className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-1"
                  >
                    Profit Markup
                  </label>
                  <p className="text-[10px] font-bold text-slate-500 mb-4 leading-relaxed">
                    Standard multiplier baseline applied to supplier unit costs.
                  </p>
                </div>
                <div className="relative mt-auto">
                  <input
                    type="number"
                    id="markup_percentage"
                    name="markup_percentage"
                    step="0.01"
                    min="0"
                    value={formData.markup_percentage}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-lg font-black text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors pr-12 font-mono disabled:opacity-60"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg font-mono">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* HEADQUARTERS CONTACTS */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-8">
            <h3 className="text-[10px] font-black uppercase text-amber-500 mb-6 tracking-widest flex items-center gap-2">
              <Phone size={14} /> Business Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="contact_email"
                  className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest"
                >
                  Business Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    placeholder="corporate@overdrive.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="contact_number"
                  className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest"
                >
                  Business Phone
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    id="contact_number"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                    maxLength={50}
                    disabled={isSaving}
                    placeholder="e.g., +63 909 090 9091"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors font-mono disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeSaveSettings}
        title="Confirm Settings Changes"
        message="The changes made to your company information, pricing, and tax settings will be applied across the system. Do you want to continue?"
        confirmText="Save Changes"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
};

export default BusinessSettings;
