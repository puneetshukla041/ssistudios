import React, { useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Activity, Building2, UserCheck, Phone, Mail, Stethoscope, Clock } from 'lucide-react';

const COLORS = ['#0071e3', '#34c759', '#ff9500', '#ff3b30', '#5856d6', '#ff2d55', '#af52de'];

export default function MasterAnalytics({ records }: { records: any[] }) {
    
    const analytics = useMemo(() => {
        if (!records || records.length === 0) return null;

        const uniqueHospitals = new Set(records.map(r => r.hospitalName).filter(Boolean));
        const uniqueSales = new Set(records.map(r => r.salesPersonName).filter(Boolean));
        
        // Data Health & Exact Numbers
        const withPhone = records.filter(r => r.contactNumber).length;
        const withEmail = records.filter(r => r.emailId).length;
        const phonePercent = Math.round((withPhone / records.length) * 100);
        const emailPercent = Math.round((withEmail / records.length) * 100);

        // Calculate "Added Today" (Last 24 Hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const addedToday = records.filter(r => new Date(r.createdAt) >= yesterday).length;

        const countFrequencies = (key: string, limit: number = 5) => {
            const counts: Record<string, number> = {};
            records.forEach(r => {
                const val = r[key];
                if (val && val !== '-' && val !== 'Unknown') {
                    counts[val] = (counts[val] || 0) + 1;
                }
            });
            return Object.entries(counts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        };

        const topSpecialities = countFrequencies('speciality', 5);
        const topHospitals = countFrequencies('hospitalName', 5);
        const salesCoverage = countFrequencies('salesPersonName', 6);

        // Timeline
        const timelineCounts: Record<string, number> = {};
        const sortedRecords = [...records].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        let cumulative = 0;
        sortedRecords.forEach(r => {
            const date = r.createdAt ? new Date(r.createdAt) : new Date();
            const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            cumulative += 1;
            timelineCounts[monthYear] = cumulative; 
        });

        const timelineData = Object.entries(timelineCounts).map(([date, total]) => ({ date, total }));

        return {
            total: records.length,
            addedToday,
            hospitals: uniqueHospitals.size,
            salesReps: uniqueSales.size,
            withPhone,
            withEmail,
            phonePercent,
            emailPercent,
            topSpecialities,
            topHospitals,
            salesCoverage,
            timelineData
        };
    }, [records]);

    if (!analytics) return null;

    const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }: any) => (
        <div className="bg-white/80 backdrop-blur-xl rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/[0.03] flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[12px] font-bold text-[#86868b] uppercase tracking-wider mb-0.5">{title}</p>
                <p className="text-[28px] font-bold text-[#1d1d1f] tracking-tight leading-none">{value}</p>
                {subtitle && <p className="text-[11px] font-medium text-[#86868b] mt-1">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-4 mb-6 animate-in slide-in-from-top-4 fade-in duration-500">
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Doctors" value={analytics.total} icon={Stethoscope} colorClass="bg-[#0071e3]/10 text-[#0071e3]" />
                <StatCard title="Added Last 24h" value={`+${analytics.addedToday}`} icon={Clock} colorClass="bg-[#34c759]/10 text-[#34c759]" />
                <StatCard title="Hospitals" value={analytics.hospitals} icon={Building2} colorClass="bg-[#ff9500]/10 text-[#ff9500]" />
                <StatCard title="Sales Reps" value={analytics.salesReps} icon={UserCheck} colorClass="bg-[#5856d6]/10 text-[#5856d6]" />
            </div>

            {/* Second Row: Health & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Data Health */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/[0.03] flex flex-col justify-center">
                    <p className="text-[13px] font-bold text-[#1d1d1f] mb-4">Database Health Metrics</p>
                    
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="flex items-center gap-2 text-[13px] font-medium text-[#1d1d1f]">
                            <Phone className="w-4 h-4 text-[#34c759]" /> Phone Numbers
                        </span>
                        <span className="text-[12px] font-bold text-[#86868b]">{analytics.withPhone} / {analytics.total} ({analytics.phonePercent}%)</span>
                    </div>
                    <div className="w-full bg-[#f5f5f7] rounded-full h-2 mb-4 overflow-hidden border border-black/[0.03]">
                        <div className="bg-[#34c759] h-full rounded-full transition-all duration-1000" style={{ width: `${analytics.phonePercent}%` }}></div>
                    </div>

                    <div className="flex justify-between items-end mb-1.5">
                        <span className="flex items-center gap-2 text-[13px] font-medium text-[#1d1d1f]">
                            <Mail className="w-4 h-4 text-[#0071e3]" /> Email Addresses
                        </span>
                        <span className="text-[12px] font-bold text-[#86868b]">{analytics.withEmail} / {analytics.total} ({analytics.emailPercent}%)</span>
                    </div>
                    <div className="w-full bg-[#f5f5f7] rounded-full h-2 overflow-hidden border border-black/[0.03]">
                        <div className="bg-[#0071e3] h-full rounded-full transition-all duration-1000" style={{ width: `${analytics.emailPercent}%` }}></div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/[0.03] lg:col-span-2">
                    <h3 className="text-[13px] font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#ff2d55]" /> Total Records Growth
                    </h3>
                    <div className="h-[140px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.timelineData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0071e3" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5ea" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#86868b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#86868b' }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="total" stroke="#0071e3" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Third Row: Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                    <h3 className="text-[13px] font-bold text-[#1d1d1f] mb-4">Top Specialities</h3>
                    <div className="space-y-3">
                        {analytics.topSpecialities.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[13px]">
                                <span className="text-[#515154] truncate pr-2">{item.name}</span>
                                <span className="font-semibold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded-md">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                    <h3 className="text-[13px] font-bold text-[#1d1d1f] mb-4">Top Hospitals</h3>
                    <div className="space-y-3">
                        {analytics.topHospitals.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[13px]">
                                <span className="text-[#515154] truncate pr-2">{item.name}</span>
                                <span className="font-semibold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded-md">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[20px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-black/[0.03]">
                    <h3 className="text-[13px] font-bold text-[#1d1d1f] mb-4">Sales Team Coverage</h3>
                    <div className="space-y-3">
                        {analytics.salesCoverage.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[13px]">
                                <span className="text-[#515154] truncate pr-2">{item.name}</span>
                                <span className="font-semibold text-[#1d1d1f] bg-[#f5f5f7] px-2 py-0.5 rounded-md">{item.value} docs</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}