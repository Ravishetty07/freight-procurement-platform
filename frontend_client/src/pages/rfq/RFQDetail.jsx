import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Upload, MapPin, Ship, Calendar, Plus } from 'lucide-react';

const RFQDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [rfq, setRfq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);

    // --- FORCE ADMIN VIEW FOR TESTING ---
    // This ensures you always see the "Add Lane" buttons
    const isVendor = false; 

    // Form State for new Shipment
    const [newShipment, setNewShipment] = useState({
        origin_port: '',
        destination_port: '',
        container_type: '40HC',
        volume: 1,
        target_price: ''
    });

    const fetchRFQDetails = async () => {
        try {
            const response = await api.get(`/rfqs/${id}/`);
            setRfq(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading RFQ", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRFQDetails();
    }, [id]);

    const handleAddShipment = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newShipment, rfq: id };
            // Remove empty strings to avoid validation errors
            if (!payload.target_price) delete payload.target_price;

            await api.post('/shipments/', payload);
            fetchRFQDetails(); 
            // Reset form
            setNewShipment({ origin_port: '', destination_port: '', container_type: '40HC', volume: 1, target_price: '' });
        } catch (error) {
            alert("Failed to add shipment. Please check the console.");
            console.error(error);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            await api.post(`/rfqs/${id}/upload_shipments/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Bulk upload successful!");
            setUploadFile(null);
            fetchRFQDetails(); 
        } catch (error) {
            alert("Upload failed. Check file format.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Details...</div>;
    if (!rfq) return <div className="p-8 text-center text-red-500">RFQ Not Found</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => navigate('/rfq-list')} className="mb-6 flex items-center text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
                </button>
                
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{rfq.title}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                                </span>
                                {rfq.visible_target_price && <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">Budget Visible</span>}
                                {rfq.visible_bids && <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">Open Auction</span>}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${rfq.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {rfq.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Shipments Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Ship className="h-5 w-5 mr-2 text-indigo-500" /> Shipment Lanes
                        </h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rfq.shipments?.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No shipments added yet.</td></tr>
                            ) : (
                                rfq.shipments.map((ship) => (
                                    <tr key={ship.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{ship.origin_port}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{ship.destination_port}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{ship.container_type}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{ship.volume}</td>
                                        
                                        <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                                            {/* SHOW AI PRICE */}
                                            {ship.ai_predicted_price ? (
                                                <span title="AI Prediction">✨ ${ship.ai_predicted_price}</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Pending</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right text-sm">
                                            <span className="text-gray-400">Manage</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- ADD LANE FORM (ADMIN ONLY) --- */}
                {!isVendor && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-md font-bold mb-4 flex items-center text-gray-800">
                            <MapPin className="h-4 w-4 mr-2" /> Add Single Lane (AI Pricing)
                        </h4>
                        <form onSubmit={handleAddShipment} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Origin</label>
                                <input placeholder="e.g. Shanghai" className="w-full p-2 border rounded text-sm" value={newShipment.origin_port} onChange={e => setNewShipment({...newShipment, origin_port: e.target.value})} required />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
                                <input placeholder="e.g. Los Angeles" className="w-full p-2 border rounded text-sm" value={newShipment.destination_port} onChange={e => setNewShipment({...newShipment, destination_port: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                <select className="w-full p-2 border rounded text-sm" value={newShipment.container_type} onChange={e => setNewShipment({...newShipment, container_type: e.target.value})}>
                                    <option value="40HC">40HC</option>
                                    <option value="40FT">40FT</option>
                                    <option value="20FT">20FT</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Volume</label>
                                <input type="number" placeholder="Qty" className="w-full p-2 border rounded text-sm" value={newShipment.volume} onChange={e => setNewShipment({...newShipment, volume: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Target $ (Opt)</label>
                                <input type="number" placeholder="$" className="w-full p-2 border rounded text-sm" value={newShipment.target_price} onChange={e => setNewShipment({...newShipment, target_price: e.target.value})} />
                            </div>
                            <div>
                                <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded text-sm hover:bg-indigo-700 flex justify-center items-center">
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RFQDetail;