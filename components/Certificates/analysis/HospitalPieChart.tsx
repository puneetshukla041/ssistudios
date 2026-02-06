import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon, Activity } from 'lucide-react';
import { ICertificateClient } from '../utils/constants';

// --- Types ---
interface HospitalData {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface HospitalPieChartProps {
    uniqueHospitals: string[];
    totalRecords: number; 
    certificates: ICertificateClient[];
}

// --- Constants ---
const CHART_COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#f43f5e', 
    '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16',
];

// --- Custom Components ---

const CustomTooltip = ({ active, payload, totalRecords }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        // Calculate percentage based on the TRUE total records
        const percentage = totalRecords > 0 
            ? ((data.value / totalRecords) * 100).toFixed(1) 
            : 0;

        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-2xl text-xs z-50">
                <div className="flex items-center gap-2 mb-1.5">
                    <div 
                        className="w-2 h-2 rounded-full ring-2 ring-white/10" 
                        style={{ backgroundColor: data.color }}
                    />
                    <span className="font-semibold text-slate-100 max-w-[150px] truncate">{data.name}</span>
                </div>
                <div className="flex items-center justify-between gap-6 text-slate-400">
                    <span className="font-medium">Certificates</span>
                    <span className="font-bold text-white">{data.value}</span>
                </div>
                <div className="flex items-center justify-between gap-6 text-slate-400 mt-0.5">
                    <span className="font-medium">Share</span>
                    <span className="font-bold text-white">{percentage}%</span>
                </div>
            </div>
        );
    }
    return null;
};

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3 shadow-inner">
            <PieChartIcon className="w-6 h-6 opacity-40 text-slate-500" />
        </div>
        <p className="text-[11px] font-medium">No data available</p>
    </div>
);

const HospitalPieChart: React.FC<HospitalPieChartProps> = ({ uniqueHospitals, certificates, totalRecords }) => {

    // 1. Calculate Data
    const { pieData, visibleTotal } = useMemo(() => {
        const counts: { [key: string]: number } = {};
        certificates.forEach(cert => {
            counts[cert.hospital] = (counts[cert.hospital] || 0) + 1;
        });

        const data: HospitalData[] = uniqueHospitals
            .map((hospital, index) => ({
                name: hospital,
                value: counts[hospital] || 0,
                color: CHART_COLORS[index % CHART_COLORS.length],
            }))
            .filter(data => data.value > 0)
            .sort((a, b) => b.value - a.value);

        const total = data.reduce((sum, item) => sum + item.value, 0);

        return { pieData: data, visibleTotal: total };
    }, [uniqueHospitals, certificates]);

    const displayTotal = totalRecords || visibleTotal;

    return (
        <div className="w-full flex flex-col h-full">
            
            {/* Content Container */}
            <div className="flex-1 flex flex-col justify-center">
                {pieData.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                        
                        {/* CHART SECTION (Donut) */}
                        {/* FIX: Changed w-48 to w-full and restricted height for better fit */}
                        <div className="relative h-[160px] w-full flex-shrink-0 flex justify-center items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50} // Adjusted for compact view
                                        outerRadius={70} // Adjusted for compact view
                                        paddingAngle={4}
                                        cornerRadius={5}
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.color} 
                                                className="outline-none focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        content={<CustomTooltip totalRecords={displayTotal} />} 
                                        cursor={{ fill: 'transparent' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            {/* Central Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold text-slate-800 tracking-tight leading-none">
                                    {displayTotal}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Total</span>
                            </div>
                        </div>

                        {/* LEGEND / STATS SECTION */}
                        {/* FIX: Removed max-h to allow it to fit natural space, hidden scrollbar */}
                        <div className="w-full flex flex-col gap-2 overflow-y-auto no-scrollbar px-2 max-h-[140px]">
                            {pieData.map((item) => {
                                const percent = ((item.value / displayTotal) * 100).toFixed(1);
                                return (
                                    <div key={item.name} className="flex flex-col gap-1 group">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                                                <span 
                                                    className="w-1.5 h-1.5 rounded-full shadow-sm flex-shrink-0"
                                                    style={{ backgroundColor: item.color }} 
                                                />
                                                <span className="font-medium text-slate-600 truncate" title={item.name}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="font-semibold text-slate-900">{item.value}</span>
                                                <span className="text-[10px] text-slate-400 w-8 text-right tabular-nums">{percent}%</span>
                                            </div>
                                        </div>
                                        
                                        {/* Visual Progress Bar */}
                                        <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full"
                                                style={{ 
                                                    width: `${percent}%`, 
                                                    backgroundColor: item.color,
                                                    opacity: 0.8
                                                }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
};

export default HospitalPieChart;