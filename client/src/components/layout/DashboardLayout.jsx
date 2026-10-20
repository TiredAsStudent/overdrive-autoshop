import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ user, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mainContentRef = useRef(null);
  const location = useLocation();

  // Automatically close mobile drawer and scroll main content to top on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname]);

  // Handle Escape key and viewport resize to desktop
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex h-screen h-dvh w-full bg-slate-50 text-slate-900 dark:bg-overdrive-dark dark:text-white overflow-hidden transition-colors duration-300">
      {/* Accessibility: Skip to Main Content Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-amber-500 focus:text-slate-900 focus:font-black focus:text-xs focus:uppercase focus:tracking-widest focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar receives the state and the setter to close itself */}
      <Sidebar
        user={user}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Navbar receives a function to trigger the drawer open */}
        <Navbar user={user} onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main
          id="main-content"
          ref={mainContentRef}
          tabIndex={-1}
          className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-6 lg:p-8 xl:p-10 relative focus:outline-none"
        >
          <div className="w-full max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
