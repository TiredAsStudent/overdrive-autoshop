import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ user, children }) => {
  // State to control the mobile sidebar drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 dark:bg-overdrive-dark dark:text-white overflow-hidden transition-colors duration-300">
      {/* Sidebar receives the state and the setter to close itself */}
      <Sidebar
        user={user}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Navbar receives a function to trigger the drawer open */}
        <Navbar user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
