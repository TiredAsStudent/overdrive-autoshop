import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Clock, 
  CheckCircle, 
  Activity,
  Camera,
  Edit
} from 'lucide-react';

const UserProfilePage = () => {
  // Mock data - eventually this comes from your AuthContext/Database
  const profileData = {
    name: "Jay Agustin",
    role: "System Administrator",
    branch: "Batino Branch",
    email: "jay.agustin@overdrive.com",
    phone: "+63 912 345 6789",
    location: "Calamba, Laguna",
    joinDate: "November 2025"
  };

  const recentActivity = [
    { id: 1, action: "Approved OCR Receipt", target: "Vendor Invoice #1042", time: "2 hours ago", icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
    { id: 2, action: "System Update", target: "Deployed v1.2 patches", time: "Yesterday", icon: Activity, color: "text-blue-500", bg: "bg-blue-100" },
    { id: 3, action: "Stock Transfer Approved", target: "15x Mobil 1 Synthetic Oil", time: "Mar 22, 2026", icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
    { id: 4, action: "New User Added", target: "Mechanic Profile (Third Branch)", time: "Mar 20, 2026", icon: User, color: "text-purple-500", bg: "bg-purple-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal information and system preferences.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-overdrive-dark text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm">
          <Edit size={16} />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: The "Digital Badge" */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main ID Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover Photo / Top Banner */}
            <div className="h-32 bg-gradient-to-r from-overdrive-dark to-gray-800 relative">
              {/* Optional: Add a subtle pattern overlay here */}
            </div>
            
            {/* Avatar Profile Pic */}
            <div className="relative px-6 flex justify-center -mt-16 mb-4">
              <div className="relative group cursor-pointer">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden shadow-md">
                  {/* Replace with an actual <img src="..." /> later */}
                  <User size={64} className="text-gray-400" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
            </div>

            {/* Name & Title */}
            <div className="text-center px-6 pb-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Shield size={14} className="text-overdrive-yellow" />
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{profileData.role}</p>
              </div>
              <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                {profileData.branch}
              </span>
            </div>

            {/* Contact Info List */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <span className="truncate">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-gray-400" />
                </div>
                <span>{profileData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-gray-400" />
                </div>
                <span>{profileData.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-gray-400" />
                </div>
                <span>Joined {profileData.joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Performance/System Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <span className="text-sm text-gray-500 font-medium mb-1">System Uptime</span>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-gray-900">99.9%</h3>
                <span className="text-xs text-green-500 font-medium mb-1">+0.1%</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <span className="text-sm text-gray-500 font-medium mb-1">OCR Scans (Today)</span>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-gray-900">24</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <span className="text-sm text-gray-500 font-medium mb-1">Pending Approvals</span>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-overdrive-red">3</h3>
                <span className="text-xs text-gray-400 font-medium mb-1">Requires Action</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {/* Vertical line connecting timeline items */}
                    {index !== recentActivity.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-[-24px] w-px bg-gray-200"></div>
                    )}
                    
                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10 ${activity.bg} ${activity.color} ring-4 ring-white`}>
                      <activity.icon size={18} />
                    </div>
                    
                    {/* Content */}
                    <div className="pt-2">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{activity.target}</p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserProfilePage;