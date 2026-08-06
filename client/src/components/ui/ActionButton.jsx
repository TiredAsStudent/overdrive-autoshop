import React from "react";
import { Plus } from "lucide-react";

const ActionButton = ({
  onClick,
  label,
  icon: Icon = Plus,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer ${className}`}
    >
      {Icon && <Icon size={16} />} {label}
    </button>
  );
};

export default ActionButton;
