import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, BarChart3, LineChart, Calendar, Award, IndianRupee } from 'lucide-react';

export interface DayTrendData {
  date: string;
  label: string;
  count: number;
  confirmed?: number;
  pending?: number;
  completed?: number;
  revenue?: number;
}

interface BookingTrendsProps {
  data: DayTrendData[];
  platformFee?: number;
}

export const BookingTrends: React.FC<BookingTrendsProps> = ({ data, platformFee = 50 }) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Enrich data with platform fee calculation and status breakdown
  const enrichedData = data.map(item => {
    const total = item.count;
    const confirmed = item.confirmed ?? Math.round(total * 0.6);
    const completed = item.completed ?? Math.round(total * 0.25);
    const pending = item.pending ?? Math.max(total - confirmed - completed, 0);
    const revenue = total * platformFee;

    return {
      ...item,
      total,
      confirmed,
      completed,
      pending,
      revenue
    };
  });

  // Key metrics for the week
  const totalWeekBookings = enrichedData.reduce((acc, d) => acc + d.total, 0);
  const totalPlatformFees = totalWeekBookings * platformFee;
  const avgBookingsPerDay = (totalWeekBookings / Math.max(enrichedData.length, 1)).toFixed(1);
  const peakDay = enrichedData.reduce((max, d) => (d.total > max.total ? d : max), enrichedData[0] || { label: 'N/A', total: 0 });

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs min-w-[190px]">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold">
              {dayData.date}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                Total Appointments:
              </span>
              <span className="tabular-nums text-sm font-bold text-teal-700">{dayData.total}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
              <span>Platform Fee (₹{platformFee}/visit):</span>
              <span className="tabular-nums font-semibold text-slate-900">₹{dayData.revenue}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">7-Day Appointment Booking Trends</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily appointment volume and platform activity across all clinical departments.
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              chartType === 'area'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Gradient Flow</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              chartType === 'bar'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar View</span>
          </button>
        </div>
      </div>

      {/* 4 Mini Trend Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            7-Day Appointments
          </span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">
            {totalWeekBookings}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Daily Average
          </span>
          <span className="text-lg font-bold text-teal-700 tabular-nums">
            {avgBookingsPerDay} / day
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Busiest Day
          </span>
          <span className="text-lg font-bold text-sky-700 tabular-nums truncate block">
            {peakDay ? `${peakDay.label} (${peakDay.total})` : 'None'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Platform Fees (₹{platformFee})
          </span>
          <span className="text-lg font-bold text-emerald-700 tabular-nums">
            ₹{totalPlatformFees}
          </span>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={enrichedData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Appointments"
                stroke="#0d9488"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#bookingGradient)"
                activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={enrichedData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                name="Appointments"
                fill="#0d9488"
                radius={[8, 8, 0, 0]}
                barSize={36}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
