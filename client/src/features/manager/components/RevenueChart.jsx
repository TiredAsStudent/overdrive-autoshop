import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', revenue: 40000 }, { name: 'Feb', revenue: 30000 },
  { name: 'Mar', revenue: 55000 }, { name: 'Apr', revenue: 45000 },
  { name: 'May', revenue: 70000 }, { name: 'Jun', revenue: 65000 },
];

const RevenueChart = () => {
  return (
    <div className="w-full h-[350px] p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-6">6-Month Revenue Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              {/* Overdrive Yellow to transparent */}
              <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₱${val/1000}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#facc15' }}
            formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;