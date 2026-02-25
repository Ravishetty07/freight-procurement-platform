import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { 
    Package, TrendingUp, TrendingDown, Users, Clock, CheckCircle, 
    Ship, ArrowRight, DollarSign, Activity, FileText, Calendar, BarChart2, PieChart as PieIcon 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend 
} from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [openMarket, setOpenMarket] = useState([]); 
    const [myRfqs, setMyRfqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const statsRes = await api.get('/analytics/stats/');
                setStats(statsRes.data);

                if (user?.role === 'VENDOR') {
                    const rfqRes = await api.get('/rfqs/');
                    setOpenMarket(rfqRes.data);
                } else {
                    const rfqRes = await api.get('/rfqs/');
                    setMyRfqs(rfqRes.data.slice(0, 5)); 
                }
            } catch (error) {
                console.error("Dashboard Load Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    const COLORS = ['#ea580c', '#10b981', '#6366f1', '#f43f5e', '#8b5cf6', '#eab308'];

    // Mock Data for the extensive chart section
    const trendData = [
        { name: 'Mon', spend: 4000, savings: 2400, bids: 24 },
        { name: 'Tue', spend: 3000, savings: 1398, bids: 18 },
        { name: 'Wed', spend: 2000, savings: 9800, bids: 35 },
        { name: 'Thu', spend: 2780, savings: 3908, bids: 28 },
        { name: 'Fri', spend: 1890, savings: 4800, bids: 15 },
        { name: 'Sat', spend: 2390, savings: 3800, bids: 22 },
        { name: 'Sun', spend: 3490, savings: 4300, bids: 30 },
    ];

    const volumeData = [
        { month: 'Jan', volume: 65, capacity: 80 },
        { month: 'Feb', volume: 59, capacity: 80 },
        { month: 'Mar', volume: 80, capacity: 85 },
        { month: 'Apr', volume: 81, capacity: 90 },
        { month: 'May', volume: 56, capacity: 85 },
        { month: 'Jun', volume: 95, capacity: 100 },
    ];

    const vendorPerformanceData = [
        { name: 'FastFreight', won: 45, submitted: 60 },
        { name: 'Oceanic', won: 30, submitted: 55 },
        { name: 'AirLogix', won: 20, submitted: 25 },
        { name: 'RoadRun', won: 15, submitted: 40 },
    ];

    const categoryData = [
        { name: 'Ocean FCL', value: 400 },
        { name: 'Ocean LCL', value: 300 },
        { name: 'Air Freight', value: 300 },
        { name: 'Road/Rail', value: 200 },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-8"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl p-6 h-28 border border-slate-100 shadow-sm"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🚚 VENDOR DASHBOARD
    // ==========================================
    if (user?.role === 'VENDOR') {
        const winRate = stats?.active_bids > 0 ? Math.round((stats?.won_bids / (stats?.active_bids + stats?.won_bids)) * 100) : 0;

        return (
            <div className="min-h-screen bg-slate-50 pb-16">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8 border-b border-slate-200 pb-5">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Carrier Control Center</h1>
                        <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">Find freight, submit quotes, and analyze your win rates.</p>
                    </div>

                    {/* VENDOR KPIs - Grid 2x2 on Mobile */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <StatCard title="Active Bids" value={stats?.active_bids || 0} icon={<Clock />} color="blue" />
                        <StatCard title="Total Won" value={stats?.won_bids || 0} icon={<CheckCircle />} color="green" />
                        <StatCard title="Win Rate" value={`${winRate}%`} icon={<TrendingUp />} color="purple" />
                        <StatCard title="Open Market" value={openMarket.length} icon={<Activity />} color="orange" />
                    </div>

                    {/* OPEN MARKET LIST */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-4 sm:px-6 py-5 border-b border-slate-100 bg-linear-to-r from-orange-50 to-white flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base"><Ship className="h-5 w-5 text-orange-600" /> Live Freight Market</h3>
                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full animate-pulse">{openMarket.length} Active</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {openMarket.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">No open freight requests available right now.</div>
                            ) : (
                                openMarket.map((rfq) => (
                                    <div key={rfq.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                        <div>
                                            <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{rfq.title}</h4>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                                                <span className="text-xs sm:text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Shipper: <span className="font-semibold text-slate-700">{rfq.created_by_username}</span></span>
                                                <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Due: {new Date(rfq.deadline).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate(`/rfq/${rfq.id}`)} className="bg-slate-900 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                                            Review & Bid <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 🏢 ORGANIZATION DASHBOARD (Shipper)
    // ==========================================
    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header Actions */}
                <div className="mb-8 border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Shipper Command Center</h1>
                        <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">Analyze procurement, manage RFQs, and optimize freight spend.</p>
                    </div>
                    <button onClick={() => navigate('/create-rfq')} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Package className="h-5 w-5" /> Issue New Tender
                    </button>
                </div>

                {/* ORG KPIs - Grid 2x2 on Mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <StatCard title="Active RFQs" value={stats?.total_rfqs || 0} trend="+3" isPositive={true} icon={<Package />} color="orange" />
                    <StatCard title="Bids Received" value={stats?.total_bids || 0} trend="+18%" isPositive={true} icon={<Activity />} color="indigo" />
                    <StatCard title="Registered Vendors" value={stats?.total_users || 0} trend="Stable" isPositive={true} icon={<Users />} color="blue" />
                    <StatCard title="Avg Savings" value="12.4%" trend="+2.1%" isPositive={true} icon={<DollarSign />} color="green" />
                </div>

                {/* TOP CHARTS (Old/New Mix) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm sm:text-base">
                            <TrendingUp className="h-5 w-5 text-green-500" /> Spend vs. Savings Trends
                        </h3>
                        <div className="h-64 sm:h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={40} />
                                    <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px'}}/>
                                    <Area type="monotone" dataKey="spend" stroke="#ea580c" fillOpacity={1} fill="url(#colorSpend)" name="Freight Spend" />
                                    <Area type="monotone" dataKey="savings" stroke="#10b981" fillOpacity={1} fill="url(#colorSavings)" name="Savings" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base">Tender Status Breakdown</h3>
                        <div className="flex-1 flex justify-center items-center">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={stats?.pie_data || [{name: 'Open', value: 5}, {name: 'Closed', value: 2}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {(stats?.pie_data || [1,2]).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <ChartTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* RECENT RFQS DATATABLE */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                    <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base"><FileText className="h-5 w-5 text-slate-500" /> Recent Freight Requests</h3>
                        <button onClick={() => navigate('/rfq-list')} className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                            <span className="hidden sm:inline">View Database</span> <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title & ID</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline</th>
                                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {myRfqs.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">No recent RFQs found.</td></tr>
                                ) : (
                                    myRfqs.map((rfq) => (
                                        <tr key={rfq.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 sm:px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{rfq.title}</p>
                                                <p className="text-xs text-slate-400 mt-1 font-mono">ID: #{rfq.id}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-md 
                                                    ${rfq.status === 'OPEN' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                    {rfq.status}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400 hidden sm:block" /> 
                                                    {new Date(rfq.deadline).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <button onClick={() => navigate(`/rfq/${rfq.id}`)} className="text-slate-900 hover:text-orange-600 bg-white border border-slate-200 hover:border-orange-200 shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all whitespace-nowrap">
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ========================================== */}
                {/* DEEP ANALYTICS MIX (4 CHARTS) BELOW TABLES */}
                {/* ========================================== */}
                <div className="mb-6 border-b border-slate-200 pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart2 className="h-6 w-6 text-indigo-600" /> Advanced Analytics Deep-Dive
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Comprehensive historical data, vendor scoring, and logistics volumes.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* 1. Line Chart - Volume vs Capacity */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">Monthly Volume vs Capacity</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={volumeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={30} />
                                    <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                    <Legend wrapperStyle={{fontSize: '12px'}} />
                                    <Line type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Freight Volume" />
                                    <Line type="monotone" dataKey="capacity" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Network Capacity" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Bar Chart - Top Vendors */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">Top Vendor Performance (Bids vs Won)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={vendorPerformanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={30} />
                                    <ChartTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                    <Legend wrapperStyle={{fontSize: '12px'}} />
                                    <Bar dataKey="submitted" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Bids Submitted" />
                                    <Bar dataKey="won" fill="#2563eb" radius={[4, 4, 0, 0]} name="Bids Won" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Pie Chart - Freight Categories */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base flex items-center gap-2"><PieIcon className="h-4 w-4 text-slate-400" /> Spend by Freight Category</h3>
                        <div className="flex-1 flex justify-center items-center h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <ChartTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. Area Chart - Daily Bid Activity (Smaller Variant) */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">Market Bid Velocity (Last 7 Days)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={30} />
                                    <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                    <Area type="monotone" dataKey="bids" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorBids)" name="Total Bids Placed" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Adjusted KPI Component for smaller mobile screens
const StatCard = ({ title, value, icon, color, trend, isPositive }) => {
    const colorStyles = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute -right-6 -top-6 ${style.bg} w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-700 ease-out`}></div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-start relative z-10 gap-2 sm:gap-0">
                <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-1 sm:mb-2 line-clamp-1">{title}</p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
                    
                    {trend && (
                        <div className="flex items-center gap-1 mt-1 sm:mt-2">
                            <span className={`text-[10px] sm:text-xs font-bold flex items-center ${isPositive ? 'text-green-600' : 'text-rose-600'}`}>
                                {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5 sm:mr-1" /> : <TrendingDown className="h-3 w-3 mr-0.5 sm:mr-1" />}
                                {trend}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">vs last period</span>
                        </div>
                    )}
                </div>
                <div className={`p-2 sm:p-3.5 rounded-xl ${style.bg} ${style.text} ${style.border} border shadow-inner w-max`}>
                    {React.cloneElement(icon, { className: 'h-5 w-5 sm:h-6 sm:w-6' })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;