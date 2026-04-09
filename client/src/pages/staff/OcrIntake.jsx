import React, { useState } from 'react';
import ReceiptUploader from '../../features/staff/components/ReceiptUploader';
import OcrReviewer from '../../features/staff/components/OcrReviewer';
import OcrHistory from './OcrHistory'; // Import our new sub-tab

const OcrIntake = ({ user }) => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [step, setStep] = useState('upload'); // 'upload' | 'review'
  const [activeImage, setActiveImage] = useState(null);

  const handleUploadComplete = (imgData) => {
    setActiveImage(imgData);
    setStep('review');
  };

  return (
    <div className="max-w-[1600px] mx-auto h-full space-y-8">
      {/* Tab Switcher Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Expense Intake & OCR</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            Managing costs for <span className="text-amber-600 dark:text-overdrive-yellow font-bold uppercase">{user?.assigned_branch}</span>.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
          <button 
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'new' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-500'}`}
          >
            New Intake
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-500'}`}
          >
            Submission History
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'new' ? (
          step === 'upload' ? (
            <ReceiptUploader onUpload={handleUploadComplete} />
          ) : (
            <OcrReviewer 
              image={activeImage} 
              user={user}
              onCancel={() => setStep('upload')} 
              onSubmit={() => { setActiveTab('history'); setStep('upload'); }}
            />
          )
        ) : (
          <OcrHistory />
        )}
      </div>
    </div>
  );
};

export default OcrIntake;