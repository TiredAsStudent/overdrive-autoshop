import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Save,
  Key,
  Bot,
  Activity,
  SlidersHorizontal,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  BarChart,
} from "lucide-react";
import { aiService } from "../../services/sysadmin/ai.service";

const AiAssistant = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // UI States
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Core Form State
  const [formData, setFormData] = useState({
    gemini_api_key: "",
    ai_confidence_threshold: 0.85,
    ai_model: "gemini-1.5-flash",
    ai_htr_enabled: true,
    ai_omr_enabled: true,
    ai_system_instruction: "",
  });

  // Analytics State (Read-only)
  const [analytics, setAnalytics] = useState({
    total: 0,
    success: 0,
    flagged: 0,
  });

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await aiService.getSettings();
      const data = response?.data || response;

      if (data) {
        setFormData({
          gemini_api_key: data.gemini_api_key || "",
          ai_confidence_threshold: Number(data.ai_confidence_threshold) || 0.85,
          ai_model: data.ai_model || "gemini-1.5-flash",
          ai_htr_enabled: Boolean(data.ai_htr_enabled),
          ai_omr_enabled: Boolean(data.ai_omr_enabled),
          ai_system_instruction: data.ai_system_instruction || "",
        });

        setAnalytics({
          total: data.ai_total_scans || 0,
          success: data.ai_successful_scans || 0,
          flagged: data.ai_flagged_scans || 0,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "ai_confidence_threshold") {
      // Convert slider value (10-100) to decimal (0.1 - 1.0)
      setFormData((prev) => ({ ...prev, [name]: Number(value) / 100 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await aiService.testConnection({
        gemini_api_key: formData.gemini_api_key,
        ai_model: formData.ai_model,
      });
      setTestResult({
        success: true,
        message: response.message || "Connection Successful!",
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Connection Failed.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    setTestResult(null);

    try {
      await aiService.updateSettings(formData);
      setSuccessMsg("AI Configuration and Rules successfully updated.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadSettings(); // Re-fetch to get masked keys
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getStrictnessLabel = (threshold) => {
    if (threshold < 0.6)
      return { text: "Relaxed (High Automation)", color: "text-blue-500" };
    if (threshold < 0.85)
      return { text: "Balanced (Recommended)", color: "text-amber-500" };
    return { text: "Strict (High Accuracy)", color: "text-emerald-500" };
  };

  const strictness = getStrictnessLabel(formData.ai_confidence_threshold);
  const successRate =
    analytics.total > 0
      ? Math.round((analytics.success / analytics.total) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Initializing AI Core...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 1. HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <BrainCircuit
              className="text-indigo-600 dark:text-indigo-400"
              size={24}
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-2">
              AI Assistant Center
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Manage OCR Thresholds & Automation Rules
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full xl:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "SYNCING..." : "SAVE AI CONFIGURATION"}
        </button>
      </div>

      {/* 2. NOTIFICATIONS */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold shadow-sm">
          <AlertCircle size={18} className="shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-bold shadow-sm">
          <CheckCircle2 size={18} className="shrink-0" /> {successMsg}
        </div>
      )}

      {/* 3. MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CONTROLS */}
        <div className="xl:col-span-2 space-y-8">
          {/* CONNECTION & VAULT */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm p-8">
            <h3 className="text-[10px] font-black uppercase text-indigo-500 mb-6 tracking-widest flex items-center gap-2">
              <Key size={14} /> Security Vault & Engine Selection
            </h3>

            <div className="space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-2">
                  Google Gemini API Key
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Key
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showApiKey ? "text" : "password"}
                      name="gemini_api_key"
                      value={formData.gemini_api_key}
                      onChange={handleChange}
                      placeholder="Paste your API key here..."
                      className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !formData.gemini_api_key}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    {isTesting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Activity size={16} />
                    )}
                    Test Link
                  </button>
                </div>

                {/* Connection Result Feedback */}
                {testResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${testResult.success ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-2">
                  Active Intelligence Model
                </label>
                <div className="relative">
                  <Bot
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    name="ai_model"
                    value={formData.ai_model}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    {/* UPDATE: The new active models */}
                    <option value="gemini-2.5-flash">
                      Gemini 2.5 Flash (Optimized for Speed & Basic Receipts)
                    </option>
                    <option value="gemini-2.5-pro">
                      Gemini 2.5 Pro (Optimized for Complex & Messy Handwriting)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SENSITIVITY & INSTRUCTIONS */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm p-8">
            <h3 className="text-[10px] font-black uppercase text-indigo-500 mb-6 tracking-widest flex items-center gap-2">
              <SlidersHorizontal size={14} /> The "OCR Bouncer" Logic
            </h3>

            <div className="space-y-8">
              {/* The Slider */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-1">
                      Automated Confidence Threshold
                    </label>
                    <p className="text-[10px] font-bold text-slate-500 max-w-md">
                      If the AI is less confident than this percentage, the
                      receipt is blocked from auto-saving and flagged for manual
                      review.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {Math.round(formData.ai_confidence_threshold * 100)}%
                    </span>
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${strictness.color}`}
                    >
                      {strictness.text}
                    </p>
                  </div>
                </div>

                <input
                  type="range"
                  name="ai_confidence_threshold"
                  min="10"
                  max="100"
                  step="5"
                  value={Math.round(formData.ai_confidence_threshold * 100)}
                  onChange={handleChange}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-black text-slate-400 mt-2 uppercase">
                  <span>Accept Anything (10%)</span>
                  <span>Require Perfection (100%)</span>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-white/5" />

              {/* Master Prompt */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-900 dark:text-white mb-2">
                  Master System Directives
                </label>
                <p className="text-[10px] font-bold text-slate-500 mb-3">
                  These hidden instructions are appended to every scan. Use this
                  to teach the AI about specific Philippine receipt quirks.
                </p>
                <div className="relative">
                  <FileText
                    size={16}
                    className="absolute left-4 top-4 text-slate-400"
                  />
                  <textarea
                    name="ai_system_instruction"
                    value={formData.ai_system_instruction}
                    onChange={handleChange}
                    rows="4"
                    placeholder="e.g., Always prioritize the TIN near the top of the receipt..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm p-8">
            <h3 className="text-[10px] font-black uppercase text-indigo-500 mb-6 tracking-widest flex items-center gap-2">
              <BarChart size={14} /> Performance Analytics
            </h3>

            <div className="space-y-6">
              {/* Success Ring */}
              <div className="flex flex-col items-center justify-center py-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">
                  {successRate}%
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Automation Rate
                </span>
              </div>

              {/* Stat Blocks */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                  <span className="text-xs font-black text-slate-500 uppercase">
                    Total Documents
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {analytics.total}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    Auto-Saved
                  </span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    {analytics.success}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase">
                    Flagged for Review
                  </span>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                    {analytics.flagged}
                  </span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Vision Capabilities
                </h4>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                    Handwriting (HTR)
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="ai_htr_enabled"
                      checked={formData.ai_htr_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                    Checklists (OMR)
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="ai_omr_enabled"
                      checked={formData.ai_omr_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
