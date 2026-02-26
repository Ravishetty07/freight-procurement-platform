import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  Ship,
  ArrowRight,
  DollarSign,
  Activity,
  FileText,
  Calendar,
  BarChart2,
  PieChart as PieIcon,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Legend,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  LineChart,
} from "recharts";

// Custom Palette for "Orange, White, Black" theme
const ORANGE_THEME = [
  "#ea580c", // Vibrant Orange
  "#1e293b", // Slate Black
  "#94a3b8", // Cool Grey
  "#cbd5e1", // Light Grey
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [openMarket, setOpenMarket] = useState([]);
  const [myRfqs, setMyRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚀 NEW: Dynamic Data States
  const [vendorActiveBids, setVendorActiveBids] = useState(0);
  const [calculatedSavings, setCalculatedSavings] = useState(0);
  const [chartData, setChartData] = useState({
    trend: [],
    volume: [],
    vendors: [],
    category: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats and RFQs simultaneously
        const [statsRes, rfqRes] = await Promise.all([
          api.get("/analytics/stats/").catch(() => ({ data: {} })),
          api.get("/rfqs/"),
        ]);

        setStats(statsRes.data);
        const rfqData = rfqRes.data || [];

        if (user?.role === "VENDOR") {
          setOpenMarket(rfqData);

          let activeCount = 0;
          rfqData.forEach((rfq) => {
            rfq.shipments?.forEach((shipment) => {
              if (shipment.my_bid) activeCount++;
            });
          });
          setVendorActiveBids(activeCount);
        } else {
          setMyRfqs(rfqData.slice(0, 5));

          let targetTotal = 0;
          let lowestTotal = 0;
          let vendorMap = {};
          let categoryMap = {};

          // 1. Pre-fill a 7-day week so the chart ALWAYS has 7 points to draw curves
          const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          let timeMap = {};
          daysOfWeek.forEach((day) => {
            timeMap[day] = { spend: 0, savings: 0, bids: 0, volume: 0 };
          });

          rfqData.forEach((rfq) => {
            // 2. Group by Day of the Week instead of Month
            const date = new Date(rfq.created_at || Date.now());
            const dayName = date.toLocaleString("en-US", { weekday: "short" });

            rfq.shipments?.forEach((ship) => {
              const target = parseFloat(ship.target_price) || 0;
              let lowestBid = target;
              const hasBids = ship.all_bids && ship.all_bids.length > 0;

              const vol = ship.volume || 1;

              // Make sure the day exists in our map before adding
              if (timeMap[dayName]) {
                timeMap[dayName].volume += vol;
              }

              const cType = ship.container_type || "Standard";
              categoryMap[cType] = (categoryMap[cType] || 0) + vol;

              if (hasBids) {
                if (timeMap[dayName])
                  timeMap[dayName].bids += ship.all_bids.length;
                let currentLowest = Infinity;

                ship.all_bids.forEach((bid) => {
                  const amt = parseFloat(bid.amount);
                  if (amt < currentLowest) currentLowest = amt;

                  const vName =
                    bid.vendor_company || bid.vendor_name || "Unknown";
                  if (!vendorMap[vName])
                    vendorMap[vName] = { name: vName, submitted: 0, won: 0 };
                  vendorMap[vName].submitted += 1;
                  if (bid.is_winner) vendorMap[vName].won += 1;
                });

                if (currentLowest !== Infinity) lowestBid = currentLowest;
              }

              if (target > 0 && hasBids) {
                targetTotal += target;
                lowestTotal += lowestBid;
                if (timeMap[dayName]) {
                  timeMap[dayName].spend += lowestBid;
                  timeMap[dayName].savings +=
                    target > lowestBid ? target - lowestBid : 0;
                }
              }
            });
          });

          const savingsPct =
            targetTotal > 0
              ? (((targetTotal - lowestTotal) / targetTotal) * 100).toFixed(1)
              : 0;
          setCalculatedSavings(savingsPct);

          // 3. Map the days chronologically based on our pre-filled array
          const dynamicTrend = daysOfWeek.map((day) => ({
            name: day,
            spend: timeMap[day].spend,
            savings: timeMap[day].savings,
            bids: timeMap[day].bids,
          }));

          const dynamicVol = daysOfWeek.map((day) => ({
            month: day, // Keeping the key as 'month' to prevent breaking your other chart
            volume: timeMap[day].volume,
            capacity: Math.floor(timeMap[day].volume * 1.3),
          }));

          const dynamicVendors = Object.values(vendorMap)
            .sort((a, b) => b.submitted - a.submitted)
            .slice(0, 5);
          const dynamicCategories = Object.keys(categoryMap).map((k) => ({
            name: k,
            value: categoryMap[k],
          }));

          setChartData({
            trend: dynamicTrend,
            volume: dynamicVol,
            vendors:
              dynamicVendors.length > 0
                ? dynamicVendors
                : [{ name: "No Bids", submitted: 0, won: 0 }],
            category:
              dynamicCategories.length > 0
                ? dynamicCategories
                : [{ name: "No Lanes", value: 1 }],
          });
        }
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const COLORS = [
    "#ea580c",
    "#10b981",
    "#6366f1",
    "#f43f5e",
    "#8b5cf6",
    "#eab308",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 h-28 border border-slate-100 shadow-sm"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🚚 VENDOR DASHBOARD
  // ==========================================
  if (user?.role === "VENDOR") {
    const wonBids = stats?.won_bids || 0;
    const totalParticipated = vendorActiveBids + wonBids;
    const winRate =
      totalParticipated > 0
        ? Math.round((wonBids / totalParticipated) * 100)
        : 0;

    return (
      <div className="min-h-screen bg-slate-50 pb-16">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 border-b border-slate-200 pb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Carrier Control Center
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
              Find freight, submit quotes, and analyze your win rates.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatCard
              title="Active Bids"
              value={vendorActiveBids}
              icon={<Clock />}
              color="blue"
            />
            <StatCard
              title="Total Won"
              value={wonBids}
              icon={<CheckCircle />}
              color="green"
            />
            <StatCard
              title="Win Rate"
              value={`${winRate}%`}
              icon={<TrendingUp />}
              color="purple"
            />
            <StatCard
              title="Open Market"
              value={openMarket.length}
              icon={<Activity />}
              color="orange"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 bg-linear-to-r from-orange-50 to-white flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <Ship className="h-5 w-5 text-orange-600" /> Live Freight Market
              </h3>
              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full animate-pulse">
                {openMarket.length} Active
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {openMarket.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  No open freight requests available right now.
                </div>
              ) : (
                openMarket.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="p-4 sm:p-6 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {rfq.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                        <span className="text-xs sm:text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          Shipper:{" "}
                          <span className="font-semibold text-slate-700">
                            {rfq.created_by_username}
                          </span>
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Due:{" "}
                          {new Date(rfq.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/rfq/${rfq.id}`)}
                      className="bg-slate-900 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
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

  const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full shadow-sm" 
            style={{ backgroundColor: data.payload.fill || data.color || '#f97316' }} 
          />
          <span className="text-slate-500 font-semibold text-sm uppercase tracking-wider">{data.name}</span>
        </div>
        <span className="text-slate-900 font-black text-lg">{data.value}</span>
      </div>
    );
  }
  return null;
};

  // ==========================================
  // 🏢 ORGANIZATION DASHBOARD (Shipper)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Shipper Command Center
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
              Analyze procurement, manage RFQs, and optimize freight spend.
            </p>
          </div>
          <button
            onClick={() => navigate("/create-rfq")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Package className="h-5 w-5" /> Issue New Tender
          </button>
        </div>

        {/* 1. ORG KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Active RFQs"
            value={stats?.total_rfqs || 0}
            icon={<Package />}
            color="orange"
          />
          <StatCard
            title="Bids Received"
            value={stats?.total_bids || 0}
            icon={<Activity />}
            color="indigo"
          />
          <StatCard
            title="Registered Vendors"
            value={stats?.total_users || 0}
            icon={<Users />}
            color="blue"
          />
          <StatCard
            title="Avg Savings"
            value={`${calculatedSavings}%`}
            icon={<DollarSign />}
            color="green"
          />
        </div>

        {/* 2. RECENT RFQS DATATABLE (Moved up as requested) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-5 w-5 text-slate-500" /> Recent Freight
              Requests
            </h3>
            <button
              onClick={() => navigate("/rfq-list")}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span className="hidden sm:inline">View Database</span>{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Title & ID
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {myRfqs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No recent RFQs found.
                    </td>
                  </tr>
                ) : (
                  myRfqs.map((rfq) => (
                    <tr
                      key={rfq.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {rfq.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          ID: #{rfq.id}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span
                          className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-md 
                                                    ${rfq.status === "OPEN" ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}
                        >
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                          {new Date(rfq.deadline).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/rfq/${rfq.id}`)}
                          className="text-slate-900 hover:text-orange-600 bg-white border border-slate-200 hover:border-orange-200 shadow-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all whitespace-nowrap"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. TOP CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 1. TENDER STATUS - CLEAN DONUT CHART */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col">
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                Tender Status
              </h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                Distribution
              </p>
            </div>

            <div className="flex-1 flex justify-center items-center min-h-62.5">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={
                      stats?.pie_data?.length
                        ? stats.pie_data
                        : [{ name: "No Data", value: 1 }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    cornerRadius={6}
                    dataKey="value"
                    stroke="none"
                    // CUSTOM LABEL: Keeps text visible outside the donut
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                      name,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius * 1.35;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#1e293b"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-[11px] font-bold"
                        >
                          {name} ({value})
                        </text>
                      );
                    }}
                  >
                    {(stats?.pie_data?.length
                      ? stats.pie_data
                      : [{ name: "No Data", value: 1 }]
                    ).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ORANGE_THEME[index % ORANGE_THEME.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                    itemStyle={{ fontWeight: 600, color: "#1e293b" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. SPEND TRENDS - GREEN & ORANGE AREA CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Spend vs. Savings Trends
              </h3>
            </div>

            <div className="flex-1 w-full min-h-75">
              <ResponsiveContainer width="100%" height="100%">
                {/* Switched back to your dynamic data source */}
                <AreaChart
                  data={chartData.trend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorSavings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    width={60}
                  />

                  <ChartTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{
                      paddingBottom: "20px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  />

                  {/* type="monotone" creates the smooth curves instead of sharp angles */}
                  <Area
                    type="monotone"
                    dataKey="savings"
                    name="Savings"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="spend"
                    name="Freight Spend"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#f97316" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. ADVANCED ANALYTICS */}
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" /> Advanced Analytics
            Deep-Dive
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Comprehensive real-time historical data, vendor scoring, and
            logistics volumes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume vs Capacity */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">
              Monthly Volume vs Capacity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.volume}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    width={30}
                  />
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Freight Volume"
                  />
                  <Line
                    type="monotone"
                    dataKey="capacity"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Network Capacity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">
              Top Vendor Performance (Bids vs Won)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.vendors}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    width={30}
                  />
                  <ChartTooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="submitted"
                    fill="#93c5fd"
                    radius={[4, 4, 0, 0]}
                    name="Bids Submitted"
                  />
                  <Bar
                    dataKey="won"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    name="Bids Won"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Freight Categories */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-slate-400" /> Spend by Freight
              Category
            </h3>
            <div className="flex-1 flex justify-center items-center h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.category}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name }) => name}
                    labelLine={false}
                  >
                    {chartData.category.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Bid Velocity */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 text-sm sm:text-base">
              Market Bid Velocity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trend}>
                  <defs>
                    <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    width={30}
                  />
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bids"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBids)"
                    name="Total Bids Placed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, trend, isPositive }) => {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-100",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-100",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
      <div
        className={`absolute -right-6 -top-6 ${style.bg} w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-700 ease-out`}
      ></div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-start relative z-10 gap-2 sm:gap-0">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-1 sm:mb-2 line-clamp-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>

          {trend && (
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              <span
                className={`text-[10px] sm:text-xs font-bold flex items-center ${isPositive ? "text-green-600" : "text-rose-600"}`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-0.5 sm:mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5 sm:mr-1" />
                )}
                {trend}
              </span>
            </div>
          )}
        </div>
        <div
          className={`p-2 sm:p-3.5 rounded-xl ${style.bg} ${style.text} ${style.border} border shadow-inner w-max`}
        >
          {React.cloneElement(icon, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
