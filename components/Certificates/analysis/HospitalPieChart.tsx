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
    <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-3 shadow-inner">
            <PieChartIcon className="w-8 h-8 opacity-40 text-slate-500" />
        </div>
        <p className="text-sm font-medium">No distribution data</p>
    </div>
);

const HospitalPieChart: React.FC<HospitalPieChartProps> = ({ uniqueHospitals, certificates, totalRecords }) => {

    // 1. Calculate Data
    const { pieData, visibleTotal } = useMemo(() => {
        // Count certificates per hospital (from current view)
        const counts: { [key: string]: number } = {};
        certificates.forEach(cert => {
            counts[cert.hospital] = (counts[cert.hospital] || 0) + 1;
        });

        // Map to chart format
        const data: HospitalData[] = uniqueHospitals
            .map((hospital, index) => ({
                name: hospital,
                value: counts[hospital] || 0,
                color: CHART_COLORS[index % CHART_COLORS.length],
            }))
            .filter(data => data.value > 0)
            .sort((a, b) => b.value - a.value);

        // This is the sum of just the visible slice (e.g., the 10 items on page)
        const total = data.reduce((sum, item) => sum + item.value, 0);

        return { pieData: data, visibleTotal: total };
    }, [uniqueHospitals, certificates]);

    // Use totalRecords for accurate global percentage, fallback to visible total if needed
    const displayTotal = totalRecords || visibleTotal;

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-sm overflow-hidden flex flex-col h-full w-full">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        Distribution Analysis
                    </h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-center">
                {pieData.length > 0 ? (
                    <div className="flex flex-col items-center gap-6">
                        
                        {/* CHART SECTION (Donut) */}
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
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
                                <span className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
                                    {displayTotal}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Total</span>
                            </div>
                        </div>

                        {/* LEGEND / STATS SECTION */}
                        <div className="w-full flex flex-col gap-3 max-h-64 overflow-y-auto custom-scrollbar px-1">
                            {pieData.map((item) => {
                                const percent = ((item.value / displayTotal) * 100).toFixed(1);
                                return (
                                    <div key={item.name} className="flex flex-col gap-1.5 group">
                                        <div className="flex items-center justify-between text-[13px]">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span 
                                                    className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                                                    style={{ backgroundColor: item.color }} 
                                                />
                                                <span className="font-medium text-slate-600 truncate" title={item.name}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="font-semibold text-slate-900">{item.value}</span>
                                                <span className="text-[11px] text-slate-400 w-9 text-right tabular-nums">{percent}%</span>
                                            </div>
                                        </div>
                                        
                                        {/* Visual Progress Bar */}
                                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
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