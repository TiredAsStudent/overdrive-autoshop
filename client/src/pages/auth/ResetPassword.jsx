import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import BannerLogo from "../../assets/Banner_Logo.png";
import authService from "../../services/auth/auth.service";
import { useApp } from "../../context/AppContext";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status State
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { showToast } = useApp();

  // Zod-Aligned Password Strength Validation
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    specialOrNumber: /[\d@$!%*?&#]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const isFormValid =
    validations.length &&
    validations.uppercase &&
    validations.specialOrNumber &&
    validations.match;

  // --- THE TOKEN HANDSHAKE ---
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        showToast("Security token is missing from the URL.", "error");
        setTokenValid(false);
        setVerifying(false);
        return;
      }
      try {
        await authService.verifyResetToken(token);
        setTokenValid(true);
      } catch (err) {
        showToast(err.message || "Invalid or expired session.", "error");
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token, showToast]);

  // --- THE SUBMISSION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      showToast("Password updated successfully! Redirecting...", "success");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      showToast(
        err.message || "Failed to reset password. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- THE MAIN RENDER ---
  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4 sm:p-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden border border-gray-200"
      >
        {/* Universal Card Header with Logo */}
        <div className="pt-8 sm:pt-10 pb-4 px-6 sm:px-10 flex justify-center border-b border-gray-50">
          <img
            src={BannerLogo}
            alt="Overdrive Banner"
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          {/* 1. LOADING STATE */}
          {verifying ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-pulse text-slate-400 font-black uppercase text-xs tracking-widest flex items-center gap-3">
                <ShieldCheck size={24} className="text-amber-500" />
                Verifying Security Token...
              </div>
            </div>
          ) : /* 2. HARD ERROR STATE (Dead Link) */
          !tokenValid && !success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-5"
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-rose-50 text-rose-500 shadow-inner">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                  Invalid Session
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  No valid secure token found. The link may have expired or
                  already been used.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 mt-4 text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors bg-amber-50 px-6 py-3 rounded-xl"
              >
                Request New Link
              </Link>
            </motion.div>
          ) : (
            /* 3. ACTIVE FORM OR SUCCESS STATE */
            <AnimatePresence mode="wait">
              {success ? (
                /* SUCCESS STATE */
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-center space-y-6 py-4"
                >
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-black italic text-slate-900 uppercase">
                      Account Secured!
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      Your password has been successfully updated. You are now
                      being redirected to the login gate.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <ArrowLeft size={14} /> Go to Login Now
                  </Link>
                </motion.div>
              ) : (
                /* FORM STATE */
                <motion.div key="form" className="space-y-6 sm:space-y-8">
                  <div className="text-center space-y-2 sm:space-y-3">
                    <h2 className="text-xl sm:text-3xl font-black italic tracking-tighter text-slate-900 uppercase">
                      Create New Password
                    </h2>
                    <p className="text-slate-500 font-medium text-[11px] sm:text-sm max-w-md mx-auto">
                      Please enter a strong, new password to regain access to
                      your account.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6 sm:space-y-8 mt-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                      {/* New Password Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-3.5 sm:py-4 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-colors"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-12 py-3.5 sm:py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white transition-colors ${
                              confirmPassword.length > 0 && !validations.match
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-slate-200 focus:border-amber-500"
                            }`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preserved Live Strength Meter */}
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3 sm:space-y-4">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Security Requirements
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div
                          className={`flex items-center gap-2 text-[11px] sm:text-xs font-bold transition-colors ${validations.length ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          <CheckCircle2 size={16} className="shrink-0" /> 8+
                          Characters
                        </div>
                        <div
                          className={`flex items-center gap-2 text-[11px] sm:text-xs font-bold transition-colors ${validations.uppercase ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          <CheckCircle2 size={16} className="shrink-0" /> 1
                          Uppercase Letter
                        </div>
                        <div
                          className={`flex items-center gap-2 text-[11px] sm:text-xs font-bold transition-colors ${validations.specialOrNumber ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          <CheckCircle2 size={16} className="shrink-0" /> 1
                          Number or Special
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className="w-full py-4 sm:py-5 bg-overdrive-yellow text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[11px] sm:text-xs tracking-[0.2em] shadow-xl"
                    >
                      {loading ? "PROCESSING..." : "RESET PASSWORD"}{" "}
                      <ChevronRight size={16} />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
