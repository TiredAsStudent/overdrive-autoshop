import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import authService from "../../services/auth/auth.service";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [verifying, setVerifying] = useState(true); // New state for initial load
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState(null); // Error for bad tokens
  const [error, setError] = useState(null); // Error for form submission
  const [success, setSuccess] = useState(false);

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
        setSessionError("Security token is missing from the URL.");
        setVerifying(false);
        return;
      }
      try {
        await authService.verifyResetToken(token);
        // Token is good, clear any session errors
        setSessionError(null);
      } catch (err) {
        setSessionError(err.message || "Invalid or expired session.");
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  // --- THE SUBMISSION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOADING STATE ---
  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-black uppercase text-xs tracking-widest flex items-center gap-3">
          <ShieldCheck size={20} className="text-amber-500" />
          Verifying Security Token...
        </div>
      </div>
    );
  }

  // --- HARD ERROR STATE (Dead Link or No Token) ---
  if ((!token || sessionError) && !success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl text-center space-y-4 border border-slate-200">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
            Invalid Session
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {sessionError ||
              "No secure token found. Please request a new password reset link."}
          </p>
          <Link
            to="/forgot-password"
            className="inline-block mt-4 text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  // --- THE MAIN RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="bg-slate-900 p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
            <Lock size={120} />
          </div>

          <div className="relative z-10 space-y-2">
            <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">
              Security Protocol
            </p>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter">
              Create New Password
            </h2>
            <p className="text-slate-400 font-medium text-sm max-w-md mt-2">
              Finalize your identity verification by setting a cryptographically
              secure credential.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-10 flex flex-col items-center text-center space-y-6"
            >
              <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center">
                <ShieldCheck size={48} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic text-slate-900">
                  Account Secured!
                </h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm">
                  Your password has been successfully updated and your old
                  session tokens have been invalidated.
                </p>
              </div>
              <Link
                to="/login"
                className="mt-4 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-xl"
              >
                Return to Login Gate
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" className="p-8 md:p-10 space-y-8">
              {error && (
                <div className="flex items-center gap-3 p-4 text-xs font-black uppercase tracking-tighter text-red-600 bg-red-50 border-l-4 border-red-600 rounded-r-xl">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white transition-colors ${
                          confirmPassword.length > 0 && !validations.match
                            ? "border-red-500 focus:border-red-500"
                            : "border-slate-200 focus:border-amber-500"
                        }`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* LIVE STRENGTH METER */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Security Requirements
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      className={`flex items-center gap-2 text-xs font-bold ${
                        validations.length
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={16} /> 8+ Characters
                    </div>
                    <div
                      className={`flex items-center gap-2 text-xs font-bold ${
                        validations.uppercase
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={16} /> 1 Uppercase Letter
                    </div>
                    <div
                      className={`flex items-center gap-2 text-xs font-bold ${
                        validations.specialOrNumber
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={16} /> 1 Number or Special
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-[0.2em] shadow-xl"
                >
                  {loading ? "SECURING ACCOUNT..." : "UPDATE & SECURE ACCOUNT"}{" "}
                  <ChevronRight size={16} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
