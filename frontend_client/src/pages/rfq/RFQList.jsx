import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Package, Calendar, ArrowRight, Ship, Activity } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

const RFQList = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isVendor = user?.role === "VENDOR";

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      const response = await api.get("/rfqs/");
      setRfqs(response.data);
    } catch (error) {
      console.error("Error fetching RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pt-20 px-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="h-96 bg-white rounded-2xl border border-gray-100"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* PERFECTLY RESTORED NAVBAR */}
      <Navbar />

      {/* WIDE LAYOUT: Changed max-w-7xl to w-full max-w-[1600px] to match the new Navbar */}
      <div className="w-full max-w-[1600px] mx-auto py-10 px-4 md:px-8 lg:px-12">
        
        {/* PREMIUM HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 border-b border-gray-200 pb-6">
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                    <Package className="h-8 w-8 text-[#EF7D00]" />
                    {isVendor ? "Live Freight Market" : "Tender Database"}
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                    {isVendor ? "Browse active shipping requests and submit your competitive quotes." : "Manage your logistics procurement and active freight requests."}
                </p>
            </div>
            
            {!isVendor && (
                <button
                    onClick={() => navigate("/create-rfq")}
                    className="flex items-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-bold transition shadow-md hover:shadow-lg active:scale-95"
                    style={{ background: "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)" }}
                >
                    <Plus className="h-5 w-5" />
                    New Tender Request
                </button>
            )}
        </div>

        {/* ENTERPRISE DATA TABLE */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-400" /> Active Tenders Directory
                </h3>
            </div>
            
            {rfqs.length === 0 ? (
                <div className="text-center py-16">
                    <Ship className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No active requests found</h3>
                    <p className="text-gray-500 mt-1">Check back later or create a new tender.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Reference Title & ID</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Shipper</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Deadline</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {rfqs.map((rfq) => (
                                <tr key={rfq.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-bold text-gray-900 group-hover:text-[#EF7D00] transition-colors">{rfq.title}</div>
                                        <div className="text-xs font-medium text-gray-400 mt-1">ID: #{rfq.id}</div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-bold text-gray-700">
                                        {rfq.created_by_username}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-black rounded-lg border ${
                                            rfq.status === 'OPEN' 
                                                ? "bg-green-50 text-green-700 border-green-200" 
                                                : "bg-gray-100 text-gray-600 border-gray-200"
                                            }`}
                                        >
                                            {rfq.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {new Date(rfq.deadline).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            to={`/rfq/${rfq.id}`}
                                            className="inline-flex items-center gap-1.5 text-[#EF7D00] hover:text-white hover:bg-[#EF7D00] font-bold text-sm border-2 border-orange-100 hover:border-[#EF7D00] px-4 py-2 rounded-xl transition-all shadow-sm"
                                        >
                                            {isVendor ? "Review & Bid" : "Manage"} <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RFQList;