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
  Mail,
  UserCircle,
  Globe,
  MapPin,
  Clock,
} from "lucide-react";
import BannerLogo from "../../assets/Banner_Logo.png";
import authService from "../../services/auth/auth.service";
import { useApp } from "../../context/AppContext";

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const { showToast } = useApp();

  // --- PAGE STATES ---
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);

  // --- DATA STATES ---
  const [userData, setUserData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- FORM STATES ---
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  // --- VALIDATION ENGINE ---
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
    validations.match &&
    policyAgreed;

  // --- TOKEN VERIFICATION HANDSHAKE ---
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        showToast("Security token is missing from the URL.", "error");
        setTokenValid(false);
        setVerifying(false);
        return;
      }
      try {
        const data = await authService.verifyInvite(token);
        setUserData(data);
        setTimeLeft(data.timeRemainingMs);
        setTokenValid(true);
      } catch (err) {
        setExpired(true);
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token, showToast]);

  // --- COUNTDOWN TIMER ENGINE ---
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          setExpired(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  // --- SUBMISSION HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    try {
      await authService.activateAccount(token, password, policyAgreed);
      setSuccess(true);
      showToast("Account activated successfully! Redirecting...", "success");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      showToast(err.message || "Activation failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4 sm:p-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden border border-gray-200"
      >
        {/* Card Header with Logo */}
        <div className="pt-8 sm:pt-10 pb-4 px-6 sm:px-10 flex justify-center border-b border-gray-50">
          <img
            src={BannerLogo}
            alt="Overdrive Banner"
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          {/* STATE 1: INITIAL LOADING */}
          {verifying ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-pulse text-slate-400 font-black uppercase text-xs tracking-widest flex items-center gap-3">
                <ShieldCheck size={24} className="text-amber-500" />
                Verifying Secure Invitation...
              </div>
            </div>
          ) : /* STATE 2: ERROR / EXPIRED LINK */
          !tokenValid || expired ? (
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
                  Link Expired or Invalid
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  This 2-hour security link has expired or is invalid. Please
                  contact your system administrator to issue a new invite.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 mt-4 text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors bg-amber-50 px-6 py-3 rounded-xl"
              >
                Return to Login
              </Link>
            </motion.div>
          ) : (
            /* STATE 3: ACTIVE FORM OR SUCCESS */
            <AnimatePresence mode="wait">
              {success ? (
                /* SUCCESS VIEW */
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-center space-y-6 py-4"
                >
                  <div className="h-20 w-20 sm:h-24 sm:w-24 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-black italic text-slate-900 uppercase">
                      Account Activated!
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      Your immutable audit profile is fully set up. You are now
                      being redirected to the secure login gate.
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
                /* FORM VIEW */
                <motion.div key="form" className="space-y-6 sm:space-y-8">
                  {/* Identity Header */}
                  <div className="text-center space-y-2 sm:space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-slate-900">
                      Welcome to the team, {userData?.firstName}!
                    </h2>
                    <p className="text-slate-500 font-medium text-[11px] sm:text-sm max-w-md mx-auto">
                      Please finalize your account setup by creating a secure
                      password.
                    </p>
                  </div>

                  {/* Profile Blueprint Badges */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                      <UserCircle size={18} className="text-amber-500" />
                      <div className="text-left">
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">
                          Assigned Role
                        </p>
                        <p className="text-xs font-black text-slate-900 leading-none">
                          {userData?.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                      {userData?.role === "MANAGER" ||
                      userData?.role === "ADMIN" ? (
                        <Globe size={18} className="text-blue-500" />
                      ) : (
                        <MapPin size={18} className="text-blue-500" />
                      )}
                      <div className="text-left">
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">
                          Branch Access
                        </p>
                        <p className="text-xs font-black text-slate-900 leading-none">
                          {userData?.branchName || "Global Enterprise"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-amber-600" />
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                        Security Window Closes In:
                      </p>
                    </div>
                    <p className="text-sm font-black text-amber-600 font-mono tracking-tight">
                      {formatTime(timeLeft)}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Read-Only Email Input */}
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                        Registered Email
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          type="email"
                          value={userData?.email || ""}
                          readOnly
                          disabled
                          className="w-full bg-slate-100 border border-transparent rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-sm font-bold text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                      {/* Password Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                          Create Password
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

                    {/* Live Strength Meter */}
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3 sm:space-y-4">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Password Requirements
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
                          Uppercase
                        </div>
                        <div
                          className={`flex items-center gap-2 text-[11px] sm:text-xs font-bold transition-colors ${validations.specialOrNumber ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          <CheckCircle2 size={16} className="shrink-0" /> 1
                          Number / Special
                        </div>
                      </div>
                    </div>

                    {/* Immutable Audit Policy Agreement */}
                    <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={policyAgreed}
                          onChange={(e) => setPolicyAgreed(e.target.checked)}
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-amber-500 checked:bg-amber-500 checked:border-amber-500 transition-all cursor-pointer"
                        />
                        <CheckCircle2
                          size={14}
                          className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                          strokeWidth={3}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          I agree to the Overdrive Data Integrity Policy.
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">
                          By checking this, I acknowledge that my account is
                          tied to a strict, immutable audit log. Actions taken
                          are permanently recorded under my identity.
                        </p>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className="w-full py-4 sm:py-5 bg-overdrive-yellow text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[11px] sm:text-xs tracking-[0.2em] shadow-xl shadow-amber-500/10"
                    >
                      {loading ? "ACTIVATING..." : "ACTIVATE PERMANENT ACCOUNT"}{" "}
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

export default ActivateAccount;
