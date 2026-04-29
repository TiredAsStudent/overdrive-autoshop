import React from 'react';
import { motion } from 'framer-motion';
import { Search, Home, ArrowRight, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Buttons';

const NotFound = ({ user }) => {
  const navigate = useNavigate();

  const handleReturn = () => {
    if (!user) navigate('/login');
    else if (user.role === 'admin') navigate('/admin/dashboard/overview');
    else if (user.role === 'customer') navigate('/customer/dashboard/status');
    else navigate('/staff/dashboard/stats');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-10">
        
        {/* Automotive Theme Icon */}
        <div className="relative inline-block">
          <motion.div 
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="h-24 w-24 bg-slate-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center text-slate-400"
          >
            <Wrench size={48} />
          </motion.div>
          <div className="absolute -right-2 -top-2 h-10 w-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 shadow-lg border-4 border-white dark:border-slate-950">
            <span className="font-black text-xs">404</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            Lost in the Garage?
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
            This page seems to have been moved <br /> or uninstalled from the system.
          </p>
        </div>

        <Button 
          onClick={handleReturn}
          variant="primary"
          className="w-full h-14 font-black tracking-[0.2em] shadow-xl"
        >
          {user ? `RETURN TO ${user.role.toUpperCase()} HUB` : 'BACK TO LOGIN GATE'}
          <ArrowRight size={18} className="ml-2" />
        </Button>

        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
          Overdrive Enterprise OS // 2026
        </p>
      </div>
    </div>
  );
};

export default NotFound;