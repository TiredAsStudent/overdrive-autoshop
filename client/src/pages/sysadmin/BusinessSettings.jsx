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
  AlertCircle,
} from "lucide-react";
import { settingsService } from "../../services/sysadmin/settings.service";

const BusinessSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    company_name: "",
    vat_percentage: 12,
    markup_percentage: 25,
    contact_email: "",
    contact_number: "",
  });

  // Image State
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Fetch initial data
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await settingsService.getSettings();
      const data = response.data; // Note: if your service returns response.data directly, this might just be `const data = await settingsService.getSettings();`

      // Ensure we extract correctly depending on how the thick service is set up
      const settingsData = data?.data || data;

      if (settingsData) {
        setFormData({
          company_name: settingsData.company_name || "",
          vat_percentage: settingsData.vat_percentage || 0,
          markup_percentage: settingsData.markup_percentage || 0,
          contact_email: settingsData.contact_email || "",
          contact_number: settingsData.contact_number || "",
        });

        if (settingsData.logo_url) {
          const baseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
          setLogoPreview(`${baseUrl}${settingsData.logo_url}`);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      // UPDATED: Now uses the clean error message from the service
      setError(
        err.message || "Failed to load business settings from the server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB
      alert("File is too large. Maximum size is 2MB.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file)); // Create local preview immediately
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      // Create FormData to handle the file upload + text fields
      const submitData = new FormData();
      submitData.append("company_name", formData.company_name);
      submitData.append("vat_percentage", formData.vat_percentage);
      submitData.append("markup_percentage", formData.markup_percentage);
      submitData.append("contact_email", formData.contact_email);
      submitData.append("contact_number", formData.contact_number);

      if (logoFile) {
        submitData.append("logo", logoFile);
      }

      await settingsService.updateSettings(submitData);
      setSuccessMsg("Business settings updated successfully.");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);

      // Reload to get the fresh data (and the correct server-side logo URL)
      await loadSettings();
    } catch (err) {
      // UPDATED: Now gracefully catches the thick service error string
      setError(err.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading Enterprise Configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Settings2
              className="text-amber-600 dark:text-overdrive-yellow"
              size={24}
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Business Settings
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Global Rules & Corporate Identity
            </p>
          </div>
        </div>

        {/* Global Save Button */}
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full md:w-auto px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <Settings2 size={18} /> {successMsg}
        </div>
      )}

      {/* MAIN FORM GRID */}
      <form
        id="settingsForm"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-8"
      >
        {/* LEFT COLUMN: BRANDING & LOGO */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm p-8">
            <h3 className="text-[10px] font-black uppercase text-amber-500 mb-6 tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> Brand Identity
            </h3>

            {/* Image Upload Area */}
            <div className="space-y-4">
              <div
                className="w-full aspect-square max-h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-amber-500 transition-colors cursor-pointer bg-slate-50 dark:bg-black/20"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <>
                    <img
                      src={logoPreview}
                      alt="Company Logo Preview"
                      className="w-full h-full object-contain p-4"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <Upload size={24} className="mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Change Logo
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                    <ImageIcon size={48} className="mb-4 opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Upload Logo
                    </span>
                    <span className="text-[9px] mt-2 opacity-70">
                      PNG, JPG up to 2MB
                    </span>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleFileChange}
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                  Enterprise Name
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FINANCIALS & CONTACT */}
        <div className="xl:col-span-2 space-y-8">
          {/* FINANCIAL LOGIC */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm p-8">
            <h3 className="text-[10px] font-black uppercase text-amber-500 mb-6 tracking-widest flex items-center gap-2">
              <Percent size={14} /> Global Financial Logic
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                  Value Added Tax (VAT) %
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Master variable applied to all generated invoices.
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    name="vat_percentage"
                    value={formData.vat_percentage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                  Default Parts Markup %
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Global profit margin applied to supplier unit costs.
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="500"
                    name="markup_percentage"
                    value={formData.markup_percentage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* HEAD OFFICE CONTACTS */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm p-8">
            <h3 className="text-[10px] font-black uppercase text-amber-500 mb-6 tracking-widest flex items-center gap-2">
              <Phone size={14} /> Head Office Contact Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                  Official Corporate Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="hq@overdrive.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                  Corporate Phone
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
