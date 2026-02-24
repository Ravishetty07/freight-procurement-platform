import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { 
    FileCheck, MapPin, CheckCircle, Clock, Search, 
    TrendingUp, Activity, ArrowUpRight, Filter, AlertCircle 
} from 'lucide-react';

const MyBids = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(""); // NEW: Frontend Filtering
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyBids = async () => {
            try {
                const response = await api.get('/bids/');
                setBids(response.data);
            } catch (error) {
                console.error("Error fetching bids:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyBids();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 pt-20 px-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100"></div>)}
            </div>
            <div className="h-96 bg-white rounded-2xl border border-gray-100"></div>
        </div>
    );

    // KPI Calculations
    const wonBids = bids.filter(b => b.is_winner).length;
    const pendingBids = bids.filter(b => !b.is_winner).length;
    const winRate = bids.length > 0 ? Math.round((wonBids / bids.length) * 100) : 0;

    // Search Filtering Logic
    const filteredBids = bids.filter(bid => 
        bid.rfq_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.origin_port?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.destination_port?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                
                {/* PREMIUM HEADER */}
                <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <Activity className="h-7 w-7 text-indigo-600" />
                            Quote Performance Matrix
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium">Monitor your active pipeline, track won contracts, and analyze your success rate.</p>
                    </div>
                </div>

                {/* ADVANCED VENDOR KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 bg-blue-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Active Pipeline</p>
                                <p className="text-4xl font-black text-gray-900">{pendingBids}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Clock className="h-6 w-6"/></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 bg-green-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Secured Contracts</p>
                                <p className="text-4xl font-black text-gray-900">{wonBids}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle className="h-6 w-6"/></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 bg-indigo-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Success Rate</p>
                                <p className="text-4xl font-black text-gray-900">{winRate}%</p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><TrendingUp className="h-6 w-6"/></div>
                        </div>
                    </div>
                </div>

                {/* MATRIX DATA TABLE */}
                <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
                    
                    {/* Toolbar / Search */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-gray-400" /> Submitted Quotes Ledger
                        </h3>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search by port or tender name..." 
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Tender Reference</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Routing</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">My Quote</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredBids.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No quotes found matching your criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBids.map((bid) => (
                                        <tr key={bid.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{bid.rfq_title}</span>
                                                <div className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Submitted: {new Date(bid.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-700">{bid.origin_port}</span>
                                                    <span className="text-gray-300 text-xs">➔</span>
                                                    <span className="text-sm font-bold text-gray-700">{bid.destination_port}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-lg font-black text-gray-900">${bid.amount}</div>
                                                <div className="text-xs text-gray-500 font-medium mt-0.5">Transit: {bid.transit_time_days}d</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {bid.is_winner ? (
                                                    <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-xs font-black border border-green-200 flex items-center w-max gap-1.5 shadow-sm">
                                                        <CheckCircle className="h-3.5 w-3.5"/> CONTRACT WON
                                                    </span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 flex items-center w-max gap-1.5">
                                                        <Activity className="h-3.5 w-3.5"/> PENDING DECISION
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => navigate(`/rfq/${bid.rfq_id}`)}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-white hover:bg-indigo-600 font-bold text-sm border-2 border-indigo-100 hover:border-indigo-600 px-4 py-2 rounded-xl transition-all shadow-sm"
                                                >
                                                    View Market <ArrowUpRight className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MyBids;