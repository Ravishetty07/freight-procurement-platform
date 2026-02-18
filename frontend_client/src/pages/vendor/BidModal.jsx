import { useState } from 'react';
import api from '../../services/api';

const BidModal = ({ shipmentId, onClose }) => {
    const [amount, setAmount] = useState('');
    const [transitTime, setTransitTime] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/bids/', {
                shipment: shipmentId,
                amount: amount,
                transit_time_days: transitTime,
                valid_until: new Date(Date.now() + 86400000).toISOString().split('T')[0] // Valid for 1 day
            });
            alert("Bid Submitted Successfully!");
            onClose(); // Close modal
        } catch (error) {
            alert("Error placing bid. Ensure you are logged in as a Vendor.");
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Submit Quote</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Price (USD)</label>
                        <input 
                            type="number" 
                            required 
                            className="w-full border p-2 rounded"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Transit Time (Days)</label>
                        <input 
                            type="number" 
                            required 
                            className="w-full border p-2 rounded"
                            value={transitTime}
                            onChange={e => setTransitTime(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit Bid</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BidModal;