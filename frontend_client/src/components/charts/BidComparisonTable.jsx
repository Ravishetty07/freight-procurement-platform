import React from 'react';

const BidComparisonTable = ({ bids }) => {
    // 1. Sort bids by price (Lowest first)
    const sortedBids = [...bids].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

    return (
        <div className="mt-4 overflow-x-auto">
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Bid Ranking (L1 / L2)</h4>
            <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Transit Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Savings</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedBids.length === 0 ? (
                        <tr><td colSpan="5" className="p-4 text-center text-sm text-gray-500">No bids received yet.</td></tr>
                    ) : (
                        sortedBids.map((bid, index) => {
                            // Calculate savings vs the most expensive bid (just for show)
                            const maxPrice = Math.max(...sortedBids.map(b => parseFloat(b.amount)));
                            const savings = maxPrice - parseFloat(bid.amount);
                            
                            return (
                                <tr key={bid.id} className={index === 0 ? "bg-green-50" : ""}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                        {index === 0 && <span className="text-green-600 font-bold">🏆 L1</span>}
                                        {index === 1 && <span className="text-blue-600 font-bold">🥈 L2</span>}
                                        {index === 2 && <span className="text-orange-600 font-bold">🥉 L3</span>}
                                        {index > 2 && <span className="text-gray-400">#{index + 1}</span>}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {bid.vendor?.company_name || bid.vendor?.username || "Unknown Vendor"}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-bold">
                                        ${parseFloat(bid.amount).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {bid.transit_time_days} days
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600">
                                        {index === 0 && savings > 0 ? `-$${savings.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BidComparisonTable;