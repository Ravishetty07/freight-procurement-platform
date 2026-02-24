import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Package, TrendingUp, Users, Clock, CheckCircle, Ship, ArrowRight, DollarSign, Activity, FileText, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [openMarket, setOpenMarket] = useState([]); 
    const [myRfqs, setMyRfqs] = useState([]); // NEW: To show recent RFQs on Shipper Dashboard
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats which now includes real REAL database chart_data!
                const statsRes = await api.get('/analytics/stats/');
                setStats(statsRes.data);

                // Fetch data for tables based on role
                if (user?.role === 'VENDOR') {
                    const rfqRes = await api.get('/rfqs/');
                    setOpenMarket(rfqRes.data);
                } else {
                    const rfqRes = await api.get('/rfqs/');
                    // Grab only the 5 most recent RFQs for the dashboard preview
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

    const COLORS = ['#ea580c', '#10b981', '#6366f1', '#f43f5e'];

    // Professional Skeleton Loader
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-xl p-6 h-28 border border-gray-100 shadow-sm"></div>)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl h-80 border border-gray-100 lg:col-span-2"></div>
                        <div className="bg-white rounded-xl h-80 border border-gray-100"></div>
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
            <div className="min-h-screen bg-gray-50 pb-16">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    <div className="mb-8 border-b border-gray-200 pb-5">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Carrier Control Center</h1>
                        <p className="text-gray-500 mt-2 font-medium">Find freight, submit quotes, and analyze your win rates.</p>
                    </div>

                    {/* VENDOR KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <StatCard title="Active Submitted Bids" value={stats?.active_bids || 0} icon={<Clock className="text-blue-600 h-6 w-6"/>} color="blue" />
                        <StatCard title="Total Won Awards" value={stats?.won_bids || 0} icon={<CheckCircle className="text-green-600 h-6 w-6"/>} color="green" />
                        <StatCard title="Historical Win Rate" value={`${winRate}%`} icon={<TrendingUp className="text-purple-600 h-6 w-6"/>} color="purple" />
                        <StatCard title="Available Market" value={openMarket.length} icon={<Activity className="text-orange-600 h-6 w-6"/>} color="orange" />
                    </div>

                    {/* CHARTS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-indigo-500" /> Bidding Activity (Last 7 Days)</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.chart_data || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', allowDecimals: false}} />
                                        <ChartTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px'}} />
                                        <Bar dataKey="bids" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Bids Submitted" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-2">Performance Breakdown</h3>
                            <div className="flex-1 flex justify-center items-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={stats?.pie_data || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {(stats?.pie_data || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <ChartTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* OPEN MARKET TABLE */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Ship className="h-5 w-5 text-orange-600" /> Live Freight Market</h3>
                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full animate-pulse">{openMarket.length} Active Loads</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {openMarket.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">No open freight requests available right now.</div>
                            ) : (
                                openMarket.map((rfq) => (
                                    <div key={rfq.id} className="p-6 hover:bg-gray-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{rfq.title}</h4>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-sm text-gray-500">Shipper: <span className="font-semibold text-gray-700">{rfq.created_by_username}</span></span>
                                                <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                                                <span className="text-sm text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Due {new Date(rfq.deadline).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate(`/rfq/${rfq.id}`)} className="bg-gray-900 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2">
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
    // 🏢 ORGANIZATION DASHBOARD (The Shipper)
    // ==========================================
    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header Actions */}
                <div className="mb-8 border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shipper Command Center</h1>
                        <p className="text-gray-500 mt-2 font-medium">Analyze procurement, manage RFQs, and optimize freight spend.</p>
                    </div>
                    <button onClick={() => navigate('/create-rfq')} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2">
                        <Package className="h-5 w-5" /> Create New RFQ
                    </button>
                </div>

                {/* ORG KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Active RFQs" value={stats?.total_rfqs || 0} icon={<Package className="text-orange-600 h-6 w-6"/>} color="orange" />
                    <StatCard title="Bids Received" value={stats?.total_bids || 0} icon={<DollarSign className="text-green-600 h-6 w-6"/>} color="green" />
                    <StatCard title="Registered Vendors" value={stats?.total_users || 0} icon={<Users className="text-indigo-600 h-6 w-6"/>} color="indigo" />
                    <StatCard title="Avg Savings" value="12%" icon={<TrendingUp className="text-blue-600 h-6 w-6"/>} color="blue" />
                </div>

                {/* ADVANCED CHARTS SECTION (REAL DATA) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-orange-500" /> Logistics Volume (Last 7 Days)</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.chart_data || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', allowDecimals: false}} />
                                    <ChartTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px'}} />
                                    <Bar dataKey="rfqs" fill="#ea580c" radius={[4, 4, 0, 0]} name="RFQs Created" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-2">Tender Status Breakdown</h3>
                        <div className="flex-1 flex justify-center items-center">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={stats?.pie_data || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {(stats?.pie_data || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <ChartTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* THE "VIEW ALL RFQS" DATA SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-10">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText className="h-5 w-5 text-gray-500" /> Recent Freight Requests</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Title & ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Deadline</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {myRfqs.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No recent RFQs found. Create one above!</td></tr>
                                ) : (
                                    myRfqs.map((rfq) => (
                                        <tr key={rfq.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{rfq.title}</p>
                                                <p className="text-xs text-gray-400 mt-1">ID: #{rfq.id}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${rfq.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {rfq.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-2 mt-2">
                                                <Calendar className="h-4 w-4 text-gray-400" /> {new Date(rfq.deadline).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => navigate(`/rfq/${rfq.id}`)} className="text-orange-600 hover:text-orange-900 font-bold text-sm">Manage &rarr;</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* MASSIVE VIEW ALL BUTTON */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <button 
                            onClick={() => navigate('/rfq-list')} 
                            className="w-full py-3 bg-white border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600 rounded-lg text-gray-700 font-bold text-sm transition-all shadow-sm flex justify-center items-center gap-2"
                        >
                            View All RFQs Database <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Advanced Helper Component for Stats
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className={`absolute -right-4 -top-4 bg-${color}-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
                {icon}
            </div>
        </div>
    </div>
);

export default Dashboard;