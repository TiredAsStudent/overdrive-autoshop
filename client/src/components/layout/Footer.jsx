import React from "react";

const Footer = () => {
  return (
    <div className="flex flex-col items-center gap-4 pt-4 mt-2">
      <div className="h-px w-full bg-slate-200 dark:bg-slate-700"></div>

      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-semibold text-center leading-relaxed">
        Overdrive Auto Shop <br className="sm:hidden" />©{" "}
        {new Date().getFullYear()} All Rights Reserved
      </p>
    </div>
  );
};

export default Footer;
