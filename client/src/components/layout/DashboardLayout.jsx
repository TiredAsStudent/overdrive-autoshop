import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ user, children }) => {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 dark:bg-overdrive-dark dark:text-white overflow-hidden transition-colors duration-300">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Navbar user={user} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
