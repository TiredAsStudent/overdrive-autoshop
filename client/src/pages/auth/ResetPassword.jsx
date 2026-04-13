import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BannerLogo from '../../assets/OverdriveLogo2.png';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Buttons';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({ password: '', confirmPassword: '' });

  const isMatch = form.password === form.confirmPassword && form.password.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMatch) return;

    setLoading(true);
    // Simulate Backend Update
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-6">
      
      <div className="w-full max-w-[440px] bg-white rounded-[40px] shadow-2xl p-10 sm:p-14 space-y-8 border border-gray-100">
        
        {/* Banner Logo */}
        <div className="w-full flex justify-center">
          <img 
            src={BannerLogo} 
            alt="Overdrive" 
            className="h-20 w-full object-contain"
          />
        </div>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                  Set New Credentials
                </h2>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  Establish a high-strength password for your enterprise account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    id="password"
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="text-slate-900 font-bold h-14 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[38px] p-1 text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    id="confirmPassword"
                    label="Confirm New Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className={`text-slate-900 font-bold h-14 pr-12 ${
                      form.confirmPassword && !isMatch ? 'border-red-500' : ''
                    }`}
                  />
                  {form.confirmPassword && (
                    <div className="absolute right-4 top-[38px] p-1">
                      {isMatch ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <ShieldAlert size={20} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  loading={loading}
                  disabled={!isMatch || loading}
                  className="w-full h-14 font-black tracking-[0.2em] shadow-lg"
                >
                  {loading ? 'UPDATING KEY...' : 'RESET PASSWORD'}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-4"
            >
              <div className="h-20 w-20 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <ShieldCheckIcon size={40} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">Key Updated</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Your security credentials have been successfully reset. You can now access the enterprise portal.
                </p>
              </div>

              <Button 
                onClick={() => navigate('/login')}
                variant="primary"
                className="w-full h-14 font-black tracking-[0.2em]"
              >
                RETURN TO GATEWAY <ArrowRight size={16} className="ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Simple Icon fallback
const ShieldCheckIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);

export default ResetPassword;