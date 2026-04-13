import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, UserCircle, ChevronDown, LogOut, Settings, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext'; // Make sure this path is correct!

const Navbar = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const navigate = useNavigate();
  // Pull the theme state and toggle function from our Context
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('userData');
    navigate('/auth/login');
  };

  return (
    <header className="h-16 shrink-0 w-full border-b border-gray-200 dark:border-white/10 bg-white dark:bg-overdrive-dark flex items-center justify-between px-6 lg:px-8 z-20 transition-colors duration-300">
      
      {/* Universal Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group flex items-center">
          <Search className="absolute left-3 text-gray-400 dark:text-gray-500 group-focus-within:text-overdrive-yellow transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search License Plate (e.g., ABC 1234)..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-white/5 border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-black/20 focus:border-overdrive-yellow focus:ring-2 focus:ring-overdrive-yellow/20 rounded-lg text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 lg:gap-6 ml-4">
        
        {/* THEME TOGGLE BUTTON */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'dark' ? (
            <Sun size={20} className="hover:text-overdrive-yellow transition-colors" />
          ) : (
            <Moon size={20} className="hover:text-blue-600 transition-colors" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-1 text-gray-500 hover:text-overdrive-dark dark:text-gray-400 dark:hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-4 w-4 bg-overdrive-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-overdrive-dark transition-colors">
            3
          </span>
        </button>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-gray-200 dark:bg-white/10 hidden sm:block transition-colors" />

        {/* USER PROFILE DROPDOWN WRAPPER */}
        <div className="relative" ref={dropdownRef}>
          
          {/* Clickable Profile Button */}
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer group p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-none transition-colors">{user?.name || 'Jay Agustin'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-tighter mt-1 font-medium transition-colors">
                {user?.role === 'admin' ? 'Administrator' : 'Staff'}
              </p>
            </div>
            
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 group-hover:border-overdrive-yellow group-hover:text-overdrive-yellow dark:group-hover:text-overdrive-yellow transition-colors">
              <UserCircle size={24} />
            </div>
            
            <ChevronDown 
              size={14} 
              className={`text-gray-500 dark:text-gray-400 hidden sm:block transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </div>

          {/* THE FLOATING DROPDOWN MENU */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-2 z-50 transform opacity-100 scale-100 transition-all origin-top-right">
              
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 sm:hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name || 'Jay Agustin'}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mt-0.5">{user?.role === 'admin' ? 'Administrator' : 'Staff'}</p>
              </div>

              <div className="flex flex-col">
                <Link 
                  to="/profile" 
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-overdrive-dark dark:hover:text-white transition-colors"
                >
                  <User size={16} className="text-gray-400 dark:text-gray-500" />
                  My Profile
                </Link>
                
                <Link 
                  to="/settings" 
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-overdrive-dark dark:hover:text-white transition-colors"
                >
                  <Settings size={16} className="text-gray-400 dark:text-gray-500" />
                  Account Settings
                </Link>
                
                <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-4" />
                
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

    </header>
  );
};

export default Navbar;