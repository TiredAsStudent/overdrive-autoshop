import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  className = '', 
  disabled = false,
  loading = false, // Added loading prop
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-bold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    // Brand Primary: Black text on Yellow bg
    primary: "bg-overdrive-yellow text-black hover:bg-yellow-400 focus-visible:ring-overdrive-yellow shadow-sm",
    secondary: "bg-overdrive-dark text-white hover:bg-slate-800 focus-visible:ring-overdrive-dark",
    outline: "border-2 border-gray-200 bg-transparent hover:bg-gray-50 text-gray-700",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 underline-offset-4 hover:underline",
    danger: "bg-overdrive-red text-white hover:opacity-90 focus-visible:ring-overdrive-red"
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} h-11 px-6 ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Simple inline spinner if loading */}
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;