import React from 'react';
import LoginForm from '../../features/auth/LoginForm';
import BannerLogo from '../../assets/Banner_Logo.png';

const LoginPage = () => {
  return (
    // Changed main wrapper to center everything horizontally and vertically
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-6">
        
        {/* Banner Logo */}
        <div className="w-full flex justify-center">
          <img 
            src={BannerLogo} 
            alt="Overdrive Banner" 
            className="h-24 sm:h-28 w-full object-contain"
          />
        </div>

        {/* Subtitle */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Secure Staff Login
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full">
          <LoginForm />
        </div>

        {/* Divider & Footer */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="h-px w-full bg-gray-200"></div>

          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold text-center leading-relaxed">
            Authorized Personnel Only <br className="sm:hidden" />
            Overdrive Autoworks © 2026
          </p>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;