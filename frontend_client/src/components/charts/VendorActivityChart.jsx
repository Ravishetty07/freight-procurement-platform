import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VendorActivityChart = ({ data }) => {
    return (
        <div className="bg-white p-4 shadow rounded-lg h-80">
            <h4 className="text-md font-bold text-gray-700 mb-4">Top Active Vendors</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vendor__username" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bid_count" fill="#6b4c9a" name="Bids Placed" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VendorActivityChart;