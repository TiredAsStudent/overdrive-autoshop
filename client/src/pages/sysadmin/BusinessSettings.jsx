import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import {
  Settings2,
  Save,
  Upload,
  Image as ImageIcon,
  ImageOff,
  Building2,
  Percent,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { settingsService } from "../../services/sysadmin/settings.service";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";

// Universal UI Components
import PageHeader from "../../components/shared/PageHeader";
import ConfirmModal from "../../components/shared/ConfirmModal";
import ActionButton from "../../components/ui/ActionButton";

const resolveLogoUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith("blob:") || filePath.startsWith("http")) {
    return filePath;
  }

  const rawBaseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace("/api/v1", "")
    : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";

  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const normalized = filePath.replace(/\\/g, "/");
  const uploadsIdx = normalized.indexOf("uploads/");
  const cleanRelative =
    uploadsIdx !== -1
      ? normalized.slice(uploadsIdx)
      : normalized.replace(/^\//, "");

  return `${baseUrl}/${cleanRelative}`;
};

const BusinessSettings = () => {
  const { showToast } = useApp();
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const vatDescriptionId = useId();
  const markupDescriptionId = useId();
  const logoHintId = useId();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({
    company_name: "Overdrive Auto Shop",
    vat_percentage: 12.0,
    markup_percentage: 20.0,
    contact_email: "",
    contact_number: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Revoke temporary blob URLs on change or unmount
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setValidationError("");
      const response = await settingsService.getSettings();
      const settingsData = response?.data?.data || response?.data || response;

      if (settingsData) {
        setFormData({
          company_name: settingsData.company_name || "",
          vat_percentage:
            settingsData.vat_percentage !== undefined &&
            settingsData.vat_percentage !== null
              ? Number(settingsData.vat_percentage)
              : 0,
          markup_percentage:
            settingsData.markup_percentage !== undefined &&
            settingsData.markup_percentage !== null
              ? Number(settingsData.markup_percentage)
              : 0,
          contact_email: settingsData.contact_email || "",
          contact_number: settingsData.contact_number || "",
        });

        if (settingsData.logo_url) {
          const resolvedUrl = resolveLogoUrl(settingsData.logo_url);
          setSavedLogoUrl(resolvedUrl);
          setLogoPreview(resolvedUrl);
          setImageError(false);
        } else {
          setSavedLogoUrl(null);
          setLogoPreview(null);
          setImageError(false);
        }
      }
    } catch (err) {
      console.error("Failed to sync settings:", err);
      showToast(err.message || "Failed to load business settings.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setValidationError("");

    if (name === "contact_number") {
      const sanitizedPhone = value.replace(/[^0-9+\-\s()]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedPhone }));
      return;
    }

    const parsedValue =
      type === "number" ? (value === "" ? "" : Number(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const processLogoFile = (file) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      const msg = "File rejected. Upload must be a valid JPEG, PNG, or WEBP.";
      setValidationError(msg);
      showToast(msg, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      const msg = "Image is too heavy. Maximum allowed size is 2MB.";
      setValidationError(msg);
      showToast(msg, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setValidationError("");
    setImageError(false);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    processLogoFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isSaving) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isSaving) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleResetStagedLogo = (e) => {
    e.stopPropagation();
    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(savedLogoUrl);
    setImageError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDropzoneKeyDown = (e) => {
    if (isSaving) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleTriggerSave = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    const trimmedCompany = formData.company_name.trim();
    const trimmedEmail = formData.contact_email.trim();
    const trimmedPhone = formData.contact_number.trim();
    const vatVal = Number(formData.vat_percentage);
    const markupVal = Number(formData.markup_percentage);

    if (!trimmedCompany) {
      setValidationError("Company Name is required.");
      return;
    }

    if (
      formData.vat_percentage === "" ||
      Number.isNaN(vatVal) ||
      vatVal < 0 ||
      vatVal > 100
    ) {
      setValidationError("Standard VAT Rate must be between 0% and 100%.");
      return;
    }

    if (
      formData.markup_percentage === "" ||
      Number.isNaN(markupVal) ||
      markupVal < 0
    ) {
      setValidationError("Catalog Parts Markup must be 0% or greater.");
      return;
    }

    if (!trimmedEmail) {
      setValidationError("Business Email is required.");
      return;
    }

    if (!trimmedPhone) {
      setValidationError("Business Phone is required.");
      return;
    }

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

      showToast("Business logic configuration saved successfully.", "success");
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadSettings();
    } catch (err) {
      const errMsg = err.message || "Failed to save configuration.";
      setValidationError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setIsSaving(false);
      setIsConfirmModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full h-64 flex flex-col items-center justify-center space-y-4"
      >
        <Loader2
          aria-hidden="true"
          className="w-8 h-8 text-amber-500 animate-spin"
        />
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
          Syncing Enterprise Rules...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Business Logic"
        subtitle="Manage company information, pricing, and tax settings."
        icon={Settings2}
      >
        <ActionButton
          onClick={handleTriggerSave}
          disabled={isSaving}
          loading={isSaving}
          icon={Save}
          label={isSaving ? "Saving..." : "Save Settings"}
        />
      </PageHeader>

      {validationError && (
        <div role="alert" className="form-error-banner">
          <AlertCircle
            size={18}
            aria-hidden="true"
            className="shrink-0 mt-0.5"
          />
          <span>{validationError}</span>
        </div>
      )}

      {/* MAIN CONFIGURATION FORM */}
      <form
        id="settingsForm"
        ref={formRef}
        onSubmit={handleFormSubmit}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 items-start"
      >
        {/* LEFT COLUMN: BRANDING */}
        <section
          aria-labelledby="company-profile-heading"
          className="xl:col-span-1 space-y-6"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs p-5 sm:p-8">
            <h2
              id="company-profile-heading"
              className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-6 tracking-widest flex items-center gap-2"
            >
              <ImageIcon size={14} aria-hidden="true" /> Company Profile
            </h2>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label id="company-logo-label" className="form-label mb-0">
                    Company Logo
                  </label>
                  {logoFile && (
                    <button
                      type="button"
                      onClick={handleResetStagedLogo}
                      disabled={isSaving}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={11} aria-hidden="true" /> Reset
                    </button>
                  )}
                </div>

                <div
                  role="button"
                  tabIndex={isSaving ? -1 : 0}
                  aria-labelledby="company-logo-label"
                  aria-describedby={logoHintId}
                  onKeyDown={handleDropzoneKeyDown}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                  className={`w-full aspect-square max-h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group transition-all cursor-pointer ${
                    isDragging
                      ? "border-amber-500 bg-amber-50/70 dark:bg-amber-500/10"
                      : logoPreview && !imageError
                        ? "border-amber-500/50 bg-slate-50/50 dark:bg-slate-900"
                        : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-black/20 hover:border-amber-500"
                  }`}
                >
                  {logoPreview && !imageError ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Company Logo Preview"
                        onError={() => setImageError(true)}
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-xs p-4 text-center">
                        <Upload
                          size={24}
                          aria-hidden="true"
                          className="mb-2 text-amber-400"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Replace Logo File
                        </span>
                        <span className="text-[9px] text-slate-300 mt-1 font-medium">
                          Click or drag JPEG, PNG, WEBP (Max 2MB)
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow transition-colors p-6 text-center">
                      {imageError ? (
                        <ImageOff
                          size={44}
                          aria-hidden="true"
                          className="mb-3 opacity-50"
                        />
                      ) : (
                        <ImageIcon
                          size={44}
                          aria-hidden="true"
                          className="mb-3 opacity-50"
                        />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {isDragging
                          ? "Drop Logo Here"
                          : imageError
                            ? "Logo File Unavailable — Click to Upload"
                            : "Upload Master Logo"}
                      </span>
                      <span
                        id={logoHintId}
                        className="text-[10px] mt-1.5 text-slate-400 dark:text-slate-500 font-semibold"
                      >
                        JPEG, PNG, WEBP up to 2MB
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

              {/* Company Name */}
              <div>
                <label htmlFor="company_name" className="form-label">
                  Company Name <span className="form-required">*</span>
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
                    className="form-input pl-11 py-3.5 text-xs sm:text-sm font-black uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: MATH & CONTACTS */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          {/* FINANCIAL MATH ENGINE */}
          <section
            aria-labelledby="financial-settings-heading"
            className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xs p-5 sm:p-8"
          >
            <h2
              id="financial-settings-heading"
              className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-6 tracking-widest flex items-center gap-2"
            >
              <Percent size={14} aria-hidden="true" /> Financial Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* VAT Rule */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <label
                    htmlFor="vat_percentage"
                    className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-1"
                  >
                    Standard VAT Rate <span className="form-required">*</span>
                  </label>
                  <p
                    id={vatDescriptionId}
                    className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-4 leading-relaxed"
                  >
                    Automated tax matrix calculated across ledger orders.
                  </p>
                </div>
                <div className="relative mt-auto">
                  <input
                    type="number"
                    id="vat_percentage"
                    name="vat_percentage"
                    aria-describedby={vatDescriptionId}
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.vat_percentage}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    className="form-input py-3.5 pr-12 text-base sm:text-lg font-black font-mono tabular-nums"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base sm:text-lg font-mono pointer-events-none"
                  >
                    %
                  </span>
                </div>
              </div>

              {/* Markup Rule */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <label
                    htmlFor="markup_percentage"
                    className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-1"
                  >
                    Catalog Parts Markup{" "}
                    <span className="form-required">*</span>
                  </label>
                  <p
                    id={markupDescriptionId}
                    className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-4 leading-relaxed"
                  >
                    Standard multiplier baseline applied to supplier unit costs.
                  </p>
                </div>
                <div className="relative mt-auto">
                  <input
                    type="number"
                    id="markup_percentage"
                    name="markup_percentage"
                    aria-describedby={markupDescriptionId}
                    step="0.01"
                    min="0"
                    value={formData.markup_percentage}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    className="form-input py-3.5 pr-12 text-base sm:text-lg font-black font-mono tabular-nums"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base sm:text-lg font-mono pointer-events-none"
                  >
                    %
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* HEADQUARTERS CONTACTS */}
          <section
            aria-labelledby="business-contact-heading"
            className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xs p-5 sm:p-8"
          >
            <h2
              id="business-contact-heading"
              className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow mb-6 tracking-widest flex items-center gap-2"
            >
              <Phone size={14} aria-hidden="true" /> Business Contact
              Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Email */}
              <div>
                <label htmlFor="contact_email" className="form-label">
                  Business Email <span className="form-required">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
                    className="form-input pl-11 py-3.5 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="contact_number" className="form-label">
                  Business Phone <span className="form-required">*</span>
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="tel"
                    id="contact_number"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                    maxLength={50}
                    disabled={isSaving}
                    placeholder="e.g., +63 909 090 9091"
                    className="form-input pl-11 py-3.5 text-xs sm:text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>
          </section>
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
