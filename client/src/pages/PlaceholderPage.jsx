import React from 'react';

const PlaceholderPage = ({ title, subtitle, icon: Icon }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>

      {/* Empty State Box */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
        <div className="h-20 w-20 bg-overdrive-yellow/10 rounded-full flex items-center justify-center mb-6 border border-overdrive-yellow/20">
          {Icon && <Icon size={40} className="text-overdrive-yellow" />}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Module Under Construction</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          The <span className="font-semibold text-gray-700">{title}</span> module is currently being developed. Once finished, this area will be fully interactive.
        </p>
      </div>

    </div>
  );
};

export default PlaceholderPage;