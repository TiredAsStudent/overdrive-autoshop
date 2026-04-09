import React from 'react';
import { Send, Clock } from 'lucide-react';

const UserInviteForm = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
      <h3 className="font-bold text-slate-900 dark:text-white mb-1">Invite New Employee</h3>
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Send an encrypted activation link to their email.</p>

      <form className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
          <input type="email" placeholder="employee@overdrive.com" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white outline-none focus:border-amber-400" />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Role</label>
          <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white outline-none appearance-none">
            <option value="staff">Staff (Workshop & Local Auth)</option>
            <option value="admin">Admin (Governance & Global Auth)</option>
          </select>
        </div>

        {/* Security Warning */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-overdrive-yellow/10 border border-amber-200 dark:border-overdrive-yellow/20 rounded-lg mt-2">
          <Clock size={16} className="text-amber-600 dark:text-overdrive-yellow mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            For security, the activation link will expire in exactly <strong>2 hours</strong>. The user must set their password within this window.
          </p>
        </div>
        
        <button type="button" className="w-full mt-2 py-3 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-slate-900 font-bold rounded-lg transition-colors shadow-sm">
          <Send size={18} /> Send Invite
        </button>
      </form>
    </div>
  );
};

export default UserInviteForm;