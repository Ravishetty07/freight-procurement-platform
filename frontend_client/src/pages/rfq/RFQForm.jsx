import { useState } from 'react';
import api from '../../api/axios'; // <--- FIXED Import
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const RFQForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        deadline: '',
        visible_target_price: false,
        visible_bids: false
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Create the RFQ
            await api.post('/rfqs/', {
                ...formData,
                status: 'OPEN',
                current_round: 1
            });
            // Redirect to the list on success
            navigate('/rfq-list');
        } catch (error) {
            alert('Error creating RFQ. Please check the console.');
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button 
                    onClick={() => navigate('/rfq-list')}
                    className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
                </button>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">
                        Create New Freight Request
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title / Reference
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. Q4 Logistics from Shanghai to LA"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bid Deadline
                            </label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.visible_target_price}
                                    onChange={(e) => setFormData({ ...formData, visible_target_price: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">
                                    Show <strong>Target Budget</strong> to Vendors
                                </span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.visible_bids}
                                    onChange={(e) => setFormData({ ...formData, visible_bids: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">
                                    Show <strong>Competitor Bids</strong> (Open Auction)
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    <Save className="h-4 w-4 mr-2" /> Publish Auction
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RFQForm;