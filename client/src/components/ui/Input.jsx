import React from 'react';

const Input = ({ 
  label, 
  id, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error, 
  className = '',
  containerClassName = '', // Added for better layout control
  required = false,
  ...props 
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-bold uppercase tracking-wider text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all
          placeholder:text-gray-400 
          focus:outline-none focus:ring-2 focus:ring-overdrive-yellow focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:border-overdrive-yellow'
          }
          ${className}
        `}
        {...props}
      />
      {/* If error is a string, show it; if it's just a boolean, we just show the red border */}
      {typeof error === 'string' && (
        <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;