import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Lock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Buttons';

const AccessDenied = ({ user }) => {
  const navigate = useNavigate();

  // Dynamic redirect based on role and branch
  const handleSafeReturn = () => {
    if (user?.role === 'admin') navigate('/admin/dashboard/overview');
    else if (user?.role === 'customer') navigate('/customer/dashboard/status');
    else navigate('/staff/dashboard/stats');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950 p-6 transition-colors duration-300">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Visual Warning */}
        <div className="relative inline-block">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-24 w-24 bg-red-50 dark:bg-red-500/10 rounded-[32px] flex items-center justify-center text-red-600 shadow-inner"
          >
            <ShieldAlert size={48} />
          </motion.div>
          <div className="absolute -right-2 -top-2 h-8 w-8 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-slate-900 shadow-lg">
            <Lock size={16} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            Access Restricted
          </h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tight">
            Error 403: Forbidden Resource
          </p>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl space-y-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            Your account does not have permission to view this resource. 
            <span className="block mt-2 font-black text-red-600 uppercase italic">
              This attempt has been logged for security purposes.
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleSafeReturn}
            variant="primary"
            className="w-full h-14 font-black tracking-[0.2em]"
          >
            RETURN TO SAFE ZONE
          </Button>
          <button 
            onClick={() => navigate(-1)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} /> Go Back One Step
          </button>
        </div>

        {/* Audit Trail Note */}
        <div className="pt-8 flex items-center justify-center gap-2 opacity-50">
          <Info size={14} className="text-slate-400" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Protocol: {user?.assigned_branch || 'Global'} // IP Trace Active
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;