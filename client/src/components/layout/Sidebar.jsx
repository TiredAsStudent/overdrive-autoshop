import React, { useState } from 'react';
import { ChevronRight, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BannerLogo from '../../assets/OverdriveLogo2.png';
import { adminMenu, staffMenu } from '../../config/navigation';
// 1. IMPORT the App Context
import { useApp } from '../../context/AppContext'; 

const Sidebar = ({ user }) => {
  const location = useLocation();
  const [openSubMenu, setOpenSubMenu] = useState(null);
  
  // 2. EXTRACT activeVehicle from the global state
  const { activeVehicle } = useApp();

  const isAdmin = user?.role === 'admin';
  const menuGroups = isAdmin ? adminMenu : staffMenu;

  const toggleSubMenu = (label) => {
    setOpenSubMenu(openSubMenu === label ? null : label);
  };

  return (
    <div className="h-screen w-64 shrink-0 bg-white dark:bg-overdrive-dark text-slate-900 dark:text-white flex flex-col border-r border-slate-200 dark:border-white/5 z-30 relative transition-colors duration-300">
      
      {/* Brand Logo Section */}
      <div 
        className="relative h-20 flex items-center justify-center shrink-0 border-b-2 border-yellow-600 shadow-lg overflow-hidden"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #facc15 0px, #facc15 16px, #ca8a04 16px, #ca8a04 20px)'
        }}
      >
        <img src={BannerLogo} alt="Logo" className="w-full h-full object-contain scale-110 relative z-10" />
      </div>

      {/* Access Badge */}
      <div className="p-6 flex flex-col gap-1 pb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-gray-500 font-bold transition-colors">
          {isAdmin ? 'Access Level' : 'Current Context'}
        </span>
        <div className="bg-amber-50 dark:bg-overdrive-yellow/10 border border-amber-200 dark:border-overdrive-yellow/20 rounded-lg px-3 py-2 flex items-center gap-2 transition-colors">
          {isAdmin ? <Shield className="h-4 w-4 text-amber-600 dark:text-overdrive-yellow transition-colors" /> : <div className="h-2 w-2 rounded-full bg-overdrive-yellow animate-pulse" />}
          <span className="text-amber-700 dark:text-overdrive-yellow font-bold text-sm transition-colors">
            {isAdmin ? 'Global Admin' : (user?.assigned_branch || 'Main Branch')}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <h3 className="px-2 mb-2 text-[10px] font-bold uppercase text-slate-500 dark:text-gray-500 transition-colors">
          {isAdmin ? 'Governance (Checker)' : 'Workshop (Maker)'}
        </h3>

        {menuGroups.map((group) => {
          const isGroupActive = group.items.some(item => location.pathname.includes(item.path));
          const isOpen = openSubMenu === group.label || isGroupActive;

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleSubMenu(group.label)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                  ${isGroupActive 
                    ? 'text-slate-900 dark:text-overdrive-yellow bg-slate-100 dark:bg-white/5' 
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <group.icon size={18} className={isGroupActive ? 'text-amber-500 dark:text-overdrive-yellow' : 'text-slate-400 dark:text-gray-500 group-hover:text-amber-500 dark:group-hover:text-overdrive-yellow transition-colors'} />
                  {group.label}
                </div>
                
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={14} className="text-slate-400 dark:text-gray-500 transition-colors" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 dark:border-white/10 transition-colors">
                      {group.items.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.path}
                            className={`block px-4 py-2 text-xs transition-all relative
                              ${isSubActive 
                                ? 'text-slate-900 dark:text-overdrive-yellow font-bold' 
                                : 'font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:translate-x-1' 
                              }
                            `}
                          >
                            {isSubActive && (
                              <motion.div 
                                layoutId="activeDot"
                                className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-500 dark:bg-overdrive-yellow rounded-r-full shadow-[0_0_8px_rgba(245,158,11,0.4)] dark:shadow-[0_0_8px_rgba(250,204,21,0.6)]" 
                              />
                            )}
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* 3. THE PAYOFF: Active Session Display */}
      <AnimatePresence>
        {activeVehicle && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-auto p-4 bg-amber-500/10 dark:bg-overdrive-yellow/5 border-t border-slate-200 dark:border-white/10 transition-colors"
          >
            <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-overdrive-yellow mb-1 tracking-wider">
              Active Session
            </p>
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white tracking-widest uppercase">
                {activeVehicle}
              </span>
              <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-overdrive-yellow animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;