import React from "react";

const Footer = () => {
  return (
    <footer className="flex flex-col items-center gap-4 pt-4 mt-2">
      <div className="h-px w-full bg-slate-200 dark:border-white/10 dark:bg-slate-800" />

      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-bold text-center leading-relaxed">
        Overdrive Auto Shop <br className="sm:hidden" />©{" "}
        {new Date().getFullYear()} All Rights Reserved
      </p>
    </footer>
  );
};

export default Footer;
