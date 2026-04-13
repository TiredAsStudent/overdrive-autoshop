import React, { useState } from 'react';
import { 
  Car, Wrench, CircleDollarSign, 
  ClipboardSignature, Camera, Inbox 
} from 'lucide-react';

// Import our new UI building blocks!
import StatCard from '../../components/ui/StatCard';
import ActionTile from '../../components/ui/ActionTile';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

// 1. IMPORT the form that actually contains the "Golden Thread" logic
import VehicleCheckInForm from '../../features/staff/components/VehicleCheckInForm';

const StaffDashboard = () => {
  const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);

  const tableColumns = [
    { key: 'plate', label: 'Plate No.' },
    { key: 'vehicle', label: 'Vehicle Make/Model' },
    { key: 'status', label: 'Current Status' },
    { key: 'time', label: 'Checked In' }
  ];

  const recentVehicles = [
    { plate: 'ABC 1234', vehicle: 'Toyota Hilux 2021', status: <StatusBadge status="In Progress" type="warning" />, time: '08:30 AM' },
    { plate: 'XYZ 9876', vehicle: 'Honda Civic RS', status: <StatusBadge status="Ready" type="success" />, time: '09:15 AM' },
    { plate: 'DEF 4567', vehicle: 'Ford Ranger', status: <StatusBadge status="Awaiting Parts" type="danger" />, time: '10:05 AM' },
    { plate: 'GHI 1122', vehicle: 'Mitsubishi Montero', status: <StatusBadge status="Evaluating" type="neutral" />, time: '11:45 AM' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Local Branch Stats</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 transition-colors">Overview of today's operations and quick actions.</p>
      </div>

      {/* 1. STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard 
          title="Today's Intake" 
          value="12" 
          icon={Car} 
          trend="2 more than yesterday" 
          trendUp={true} 
        />
        <StatCard 
          title="Vehicles in Shop" 
          value="8" 
          icon={Wrench} 
        />
        <StatCard 
          title="Daily Revenue (Est.)" 
          value="₱45,200" 
          icon={CircleDollarSign} 
          trend="Down 5% from target" 
          trendUp={false} 
        />
      </div>

      {/* 2. QUICK ACTIONS */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-4 transition-colors">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionTile 
            title="New Check-In" 
            description="Register a new vehicle arriving at the shop." 
            icon={ClipboardSignature} 
            onClick={() => setCheckInModalOpen(true)}
          />
          <ActionTile 
            title="Upload Receipt (OCR)" 
            description="Scan a vendor receipt to update local inventory." 
            icon={Camera} 
            onClick={() => alert("Redirecting to OCR Scanner...")} 
          />
          <ActionTile 
            title="Request Parts" 
            description="Ask the main branch for stock transfer." 
            icon={Inbox} 
            onClick={() => alert("Opening Transfer Request...")} 
          />
        </div>
      </div>

      {/* 3. DATA TABLE */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-4 transition-colors">Active Bay Status</h2>
        <DataTable 
          columns={tableColumns} 
          data={recentVehicles} 
          onRowClick={(row) => console.log("Clicked vehicle:", row.plate)}
        />
      </div>

      {/* 4. MODAL WITH THE REAL FORM */}
      <Modal 
        isOpen={isCheckInModalOpen} 
        onClose={() => setCheckInModalOpen(false)}
        title="Vehicle Check-In"
      >
        {/* 2. REPLACE the old static div with the REAL form component */}
        <VehicleCheckInForm onFinished={() => setCheckInModalOpen(false)} />
      </Modal>

    </div>
  );
};

export default StaffDashboard;