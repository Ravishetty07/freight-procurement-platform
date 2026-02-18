const StatsCard = ({ title, value, icon, color }) => {
    return (
        <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${color}`}>
            <div className="p-5">
                <div className="flex items-center">
                    <div className="shrink-0">
                        {/* Simple Icon Placeholder */}
                        <span className="text-2xl">{icon}</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;