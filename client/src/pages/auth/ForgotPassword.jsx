import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import BannerLogo from "../../assets/Banner_Logo.png";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Buttons";
import authService from "../../services/auth.service";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-[440px] bg-white rounded-[40px] shadow-2xl p-10 sm:p-14 space-y-8 border border-gray-100">
        <div className="w-full flex justify-center">
          <img
            src={BannerLogo}
            alt="Overdrive Banner"
            className="h-20 w-full object-contain"
          />
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="request"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                  Recover Access
                </h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                  Enter your registered email. If authorized, we will send a
                  recovery link.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 border-l-4 border-red-600 rounded-r-xl">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  id="email"
                  label="Registered Email"
                  type="email"
                  placeholder="name@overdrive.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="text-slate-900 font-bold h-14"
                />

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-14 font-black tracking-[0.2em]"
                >
                  {loading ? "PROCESSING..." : "SEND RECOVERY LINK"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-4"
            >
              <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={40} />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-black text-slate-900 uppercase italic">
                  Request Processed
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  If an account exists for{" "}
                  <span className="text-slate-900 font-bold">{email}</span>, a
                  secure recovery link has been dispatched to that inbox.
                </p>
              </div>

              <div className="flex items-center gap-2 justify-center p-3 bg-amber-50 rounded-xl">
                <AlertCircle size={14} className="text-amber-600" />
                <p className="text-[10px] font-black text-amber-700 uppercase">
                  Check your spam folder
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-6 border-t border-gray-100 flex justify-center">
          <Link
            to="/login"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
