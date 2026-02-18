import React, { useEffect, useState } from 'react';
import api from '../../api/axios'; // <--- FIXED: Points to our existing bridge
import { useAuth } from '../../context/AuthContext'; // <--- FIXED: Uses the hook
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth(); // <--- FIXED: cleaner syntax
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Note: Ensure your backend has an endpoint at /analytics/stats/
                // If not, this will return 404, but the page will still load.
                const response = await api.get('/analytics/stats/');
                setStats(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load stats", error);
                // We stop loading even on error so the user isn't stuck on a white screen
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard Data...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-600">Shipsy SaaS</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700">
                                Welcome, {user?.username || 'User'} 
                                {user?.role && <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">{user.role}</span>}
                            </span>
                            <button 
                                onClick={logout} 
                                className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                
                {/* 1. STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Default cards for everyone until roles are fully set up */}
                    <StatCard title="Total RFQs" value={stats?.total_rfqs || 0} icon="📦" />
                    <StatCard title="Total Bids" value={stats?.total_bids || 0} icon="💰" />
                    
                    {(user?.role === 'ADMIN' || user?.is_staff) && (
                        <>
                            <StatCard title="Total Users" value={stats?.total_users || 0} icon="👥" />
                            <StatCard title="Volume (TEU)" value={stats?.volume_moved || 0} icon="🚢" />
                        </>
                    )}
                    
                    {user?.role === 'VENDOR' && (
                        <>
                            <StatCard title="Active Bids" value={stats?.active_bids || 0} icon="⚡" />
                            <StatCard title="Won Bids" value={stats?.won_bids || 0} icon="🏆" />
                        </>
                    )}
                </div>

                {/* 2. MAIN ACTION AREA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left: Quick Actions */}
                    <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            {user?.role !== 'VENDOR' && (
                                <button 
                                    onClick={() => navigate('/create-rfq')}
                                    className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition flex justify-center items-center gap-2"
                                >
                                    <span>+</span> Create New RFQ
                                </button>
                            )}
                             <button 
                                onClick={() => navigate('/rfq-list')}
                                className="w-full border border-gray-300 text-gray-700 p-2 rounded hover:bg-gray-50 transition"
                            >
                                View All RFQs
                            </button>
                        </div>
                    </div>

                    {/* Right: Recent Activity Feed */}
                    <div className="col-span-2 bg-white overflow-hidden shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {user?.role === 'ADMIN' ? 'System Activity' : 'Your Recent Activity'}
                        </h3>
                        <div className="flow-root">
                            <ul className="-my-5 divide-y divide-gray-200">
                                {stats?.recent_activity?.length > 0 ? (
                                    stats.recent_activity.map((activity, i) => (
                                        <li key={i} className="py-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {activity.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        Status: {activity.status}
                                                    </p>
                                                </div>
                                                <div className="inline-flex items-center text-sm text-gray-500">
                                                    {new Date(activity.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-gray-500 py-4 text-center">No recent activity found.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Helper Component for Cards
const StatCard = ({ title, value, icon }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
        <div className="shrink-0 bg-indigo-100 rounded-md p-3 text-2xl">
            {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
            <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd className="text-lg font-bold text-gray-900">{value}</dd>
            </dl>
        </div>
    </div>
);

export default Dashboard;