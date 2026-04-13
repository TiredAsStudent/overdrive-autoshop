import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import authService from "../../services/auth.service";

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Page States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);

  // User Data from Backend
  const [userData, setUserData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  // Password Strength Validation (Matching your Zod backend rules)
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

  // 1. Verify Token on Load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No activation token found in the URL.");
        setLoading(false);
        return;
      }
      try {
        const data = await authService.verifyInvite(token);
        setUserData(data);
        setTimeLeft(data.timeRemainingMs);
      } catch (err) {
        setError(err.message);
        setExpired(true);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  // 2. Live Countdown Timer Logic
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

  // 3. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitLoading(true);
    setError(null);
    try {
      await authService.activateAccount(token, password, policyAgreed);
      setSuccess(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShieldCheck className="text-amber-500 h-12 w-12" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">
            Verifying Security Token...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
      >
        {/* HEADER SECTION */}
        <div className="bg-slate-900 p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck size={120} />
          </div>

          {success ? (
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black italic">Account Activated!</h2>
              <p className="text-slate-400 font-bold">
                Your immutable audit profile is set up. Redirecting to login...
              </p>
            </div>
          ) : expired || error ? (
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h2 className="text-3xl font-black italic">
                Link Expired or Invalid
              </h2>
              <p className="text-slate-400 font-bold max-w-md">
                {error ||
                  "This 2-hour security link has expired. Please contact your system administrator to issue a new invite."}
              </p>
              <Link
                to="/login"
                className="mt-4 px-6 py-3 bg-white text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">
                  Secure Onboarding
                </p>
                <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter">
                  Welcome to the team, <br className="hidden md:block" />
                  <span className="text-white">{userData?.firstName}!</span>
                </h2>
              </div>

              {/* READ ONLY IDENTITY BADGES */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                  <UserCircle size={16} className="text-slate-400" />
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">
                      Assigned Role
                    </p>
                    <p className="text-sm font-black text-white">
                      {userData?.role === "ADMIN" ? "Admin (Global)" : "Staff"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                  <ShieldCheck
                    size={16}
                    className={
                      userData?.role === "ADMIN"
                        ? "text-amber-500"
                        : "text-blue-400"
                    }
                  />
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">
                      Branch Access
                    </p>
                    <p className="text-sm font-black text-white">
                      {userData?.branchName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FORM SECTION */}
        {!success && !expired && !error && (
          <div className="p-8 md:p-10 space-y-8">
            {/* TIMER */}
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <Clock
                  className="text-amber-600 dark:text-amber-500"
                  size={20}
                />
                <p className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-widest">
                  Security Window Closes In:
                </p>
              </div>
              <p className="text-lg font-black text-amber-600 dark:text-amber-500 font-mono tracking-tighter">
                {formatTime(timeLeft)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* READ ONLY EMAIL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
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
                    className="w-full bg-slate-100 dark:bg-slate-900/50 border border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* PASSWORD SUITE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                      className={`w-full bg-white dark:bg-slate-900 border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold dark:text-white outline-none transition-colors ${confirmPassword.length > 0 && !validations.match ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-white/10 focus:border-amber-500"}`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* STRENGTH VALIDATOR */}
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Password Requirements
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    className={`flex items-center gap-2 text-xs font-bold ${validations.length ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
                  >
                    <CheckCircle2 size={14} /> 8+ Characters
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs font-bold ${validations.uppercase ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
                  >
                    <CheckCircle2 size={14} /> 1 Uppercase Letter
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs font-bold ${validations.specialOrNumber ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
                  >
                    <CheckCircle2 size={14} /> 1 Number / Special
                  </div>
                </div>
              </div>

              {/* POLICY CHECKBOX */}
              <label className="flex items-start gap-4 p-4 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={policyAgreed}
                    onChange={(e) => setPolicyAgreed(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-amber-500 checked:bg-amber-500 checked:border-amber-500 transition-all cursor-pointer"
                  />
                  <CheckCircle2
                    size={14}
                    className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                    strokeWidth={3}
                  />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    I agree to the Overdrive Data Integrity Policy.
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">
                    By checking this, I acknowledge that my account is tied to a
                    strict, immutable audit log. Actions taken (including OCR
                    scans, invoices, and stock adjustments) are permanently
                    recorded under my identity and cannot be deleted.
                  </p>
                </div>
              </label>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={!isFormValid || submitLoading}
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest shadow-xl"
              >
                {submitLoading
                  ? "ACTIVATING ACCOUNT..."
                  : "ACTIVATE PERMANENT ACCOUNT"}{" "}
                <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivateAccount;
