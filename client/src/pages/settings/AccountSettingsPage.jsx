import React, { useState } from 'react';
import { Shield, Bell, Sliders, Key, Smartphone, Save, CheckCircle2 } from 'lucide-react';

const AccountSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [savedMessage, setSavedMessage] = useState(false);

  // Mock function to simulate saving settings
  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const tabs = [
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'System Preferences', icon: Sliders },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your security preferences and system behaviors.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT COLUMN: Tab Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left
                    ${isActive 
                      ? 'bg-white text-overdrive-dark shadow-sm border border-gray-100' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <tab.icon size={18} className={isActive ? 'text-overdrive-yellow' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT COLUMN: Active Tab Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* === SECURITY TAB === */}
            {activeTab === 'security' && (
              <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Key size={20} className="text-overdrive-yellow" />
                    Change Password
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 mb-6">Update your password to keep your account secure.</p>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      {/* FIXED: Added text-gray-900 and placeholder:text-gray-400 */}
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-overdrive-yellow focus:ring-2 focus:ring-overdrive-yellow/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      {/* FIXED: Added text-gray-900 and placeholder:text-gray-400 */}
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-overdrive-yellow focus:ring-2 focus:ring-overdrive-yellow/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      {/* FIXED: Added text-gray-900 and placeholder:text-gray-400 */}
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-overdrive-yellow focus:ring-2 focus:ring-overdrive-yellow/20 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone size={20} className="text-overdrive-yellow" />
                    Two-Factor Authentication (2FA)
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 mb-6">Add an extra layer of security to your account.</p>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg max-w-2xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Authenticator App</p>
                      <p className="text-xs text-gray-500 mt-0.5">Use an app like Google Authenticator to generate codes.</p>
                    </div>
                    <button type="button" className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-overdrive-yellow focus:ring-offset-2 hover:bg-gray-300">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-overdrive-dark text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm">
                    <Save size={16} />
                    Save Changes
                  </button>
                  {savedMessage && (
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 size={16} /> Saved successfully!
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* === NOTIFICATIONS TAB === */}
            {activeTab === 'notifications' && (
              <div className="p-6 sm:p-8 space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-500 mt-1 mb-6">Choose what alerts you want to receive and how.</p>
                  
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Approval Queue Alerts</p>
                        <p className="text-xs text-gray-500 mt-0.5">Get notified when a stock transfer needs review.</p>
                      </div>
                      <button type="button" className="relative inline-flex h-6 w-11 items-center rounded-full bg-overdrive-yellow transition-colors focus:outline-none">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6 shadow-sm" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">OCR Intake Failures</p>
                        <p className="text-xs text-gray-500 mt-0.5">Alert me if the AI cannot read a vendor receipt.</p>
                      </div>
                      <button type="button" className="relative inline-flex h-6 w-11 items-center rounded-full bg-overdrive-yellow transition-colors focus:outline-none">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6 shadow-sm" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Low Inventory Warnings</p>
                        <p className="text-xs text-gray-500 mt-0.5">Alerts when critical items fall below minimum stock.</p>
                      </div>
                      <button type="button" className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1 shadow-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === PREFERENCES TAB === */}
            {activeTab === 'preferences' && (
              <div className="p-6 sm:p-8 space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">System Preferences</h2>
                  <p className="text-sm text-gray-500 mt-1 mb-6">Customize how Overdrive Auto Shop works for you.</p>
                  
                  <div className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Landing Page</label>
                      {/* FIXED: Added text-gray-900 */}
                      <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-overdrive-yellow focus:ring-2 focus:ring-overdrive-yellow/20 rounded-lg text-sm text-gray-900 outline-none cursor-pointer">
                        <option>Workshop Floor (Kanban)</option>
                        <option>Financial Analytics</option>
                        <option>Approval Queue</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1.5">This is the first page you see after logging in.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UI Theme</label>
                      {/* FIXED: Added text-gray-900 */}
                      <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-overdrive-yellow focus:ring-2 focus:ring-overdrive-yellow/20 rounded-lg text-sm text-gray-900 outline-none cursor-pointer">
                        <option>Light Mode (Default)</option>
                        <option>Dark Mode</option>
                        <option>System Default</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountSettingsPage;