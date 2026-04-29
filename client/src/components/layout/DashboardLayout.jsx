import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ user, children }) => {
  return (
    // THE FIX: Added light mode defaults (slate-50/slate-900) and pushed the dark theme to dark:
    // Also added transition-colors duration-300 for a smooth fade
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 dark:bg-overdrive-dark dark:text-white overflow-hidden transition-colors duration-300">
      
      {/* 1. Sidebar on the far left */}
      <Sidebar user={user} />

      {/* 2. Right-side wrapper (This stacks the Navbar on top of the Page Content) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        
        {/* Navbar sits perfectly at the top of the right side */}
        <Navbar user={user} />
        
        {/* The actual page content scrolls below the Navbar */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          {/* 3. Render the animated pages passed from AppRoutes */}
          {children} 
        </main>

      </div>
      
    </div>
  );
};

export default DashboardLayout;