import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ user }) => {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      
      {/* 1. Sidebar on the far left */}
      <Sidebar user={user} />

      {/* 2. Right-side wrapper (This stacks the Navbar on top of the Page Content) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Navbar sits perfectly at the top of the right side */}
        <Navbar user={user} />
        
        {/* The actual page content scrolls below the Navbar */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <Outlet /> 
        </main>

      </div>
      
    </div>
  );
};

export default DashboardLayout;