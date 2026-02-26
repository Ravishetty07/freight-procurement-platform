import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import {
  ArrowLeft,
  MapPin,
  Ship,
  Calendar,
  Plus,
  FileText,
  DollarSign,
  Clock,
  X,
  CheckCircle,
  Trophy,
  TrendingDown,
  AlertCircle,
  MessageSquare,
  RefreshCcw,
  Download,
  BarChart2,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Target, // 🚀 Added this to fix the ReferenceError
} from "lucide-react";
import BidChatDrawer from "../../components/chat/BidChatDrawer";
import { toast, Toaster } from "react-hot-toast";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

const RFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);

  const isVendor = user?.role === "VENDOR";

  // --- ORG STATES ---
  const [newShipment, setNewShipment] = useState({
    origin_port: "",
    destination_port: "",
    volume: 1,
    target_price: "",
  });
  const [viewingBidsFor, setViewingBidsFor] = useState(null);
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardConfirmModal, setAwardConfirmModal] = useState({
    isOpen: false,
    bidId: null,
  });

  // Counter Offer Modal State (For Org)
  const [counterModal, setCounterModal] = useState({
    isOpen: false,
    bidId: null,
    currentAmount: "",
    counterAmount: "",
  });

  // --- VENDOR STATES ---
  const [biddingShipment, setBiddingShipment] = useState(null);
  const [bidForm, setBidForm] = useState({
    amount: "",
    transit_time_days: "",
    free_days_demurrage: 14,
    valid_until: "",
  });
  const [bidFile, setBidFile] = useState(null);
  const [submittingBid, setSubmittingBid] = useState(false);

  // --- CHAT STATES ---
  const [activeChatBid, setActiveChatBid] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = (bid) => {
    setActiveChatBid(bid);
    setIsChatOpen(true);
  };

  const fetchRFQDetails = async () => {
    try {
      const response = await api.get(`/rfqs/${id}/`);
      setRfq(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading RFQ", error);
      toast.error("Failed to load RFQ Details.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQDetails();
  }, [id]);

  const getFileUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://127.0.0.1:8000"}${path}`;
  };

  const handleAddShipment = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Adding lane...");
    try {
      const payload = { ...newShipment, rfq: id, container_type: "40HC" };
      if (!payload.target_price) delete payload.target_price;
      await api.post("/shipments/", payload);
      fetchRFQDetails();
      setNewShipment({
        origin_port: "",
        destination_port: "",
        volume: 1,
        target_price: "",
      });
      toast.success("Lane added successfully!", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to add lane.", { id: loadingToast });
    }
  };

  const executeAwardBid = async () => {
    if (!awardConfirmModal.bidId || isAwarding) return;
    setIsAwarding(true);
    const loadingToast = toast.loading(
      "Awarding contract and generating PDF (this may take a moment)...",
    );

    try {
      // 1. Send the award request
      await api.post(`/bids/${awardConfirmModal.bidId}/award/`);

      // 2. 🚀 THE FIX: Wait 3.5 seconds to give the backend thread time to generate the PDF!
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // 3. Now fetch the updated data, which will contain the correct PDF file name
      await fetchRFQDetails();

      toast.success("Contract awarded & PDF generated successfully!", {
        id: loadingToast,
      });
      setAwardConfirmModal({ isOpen: false, bidId: null });
    } catch (error) {
      console.error(error);
      toast.error("Failed to award bid. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setIsAwarding(false);
    }
  };

  // --- COUNTER OFFER LOGIC ---
  const submitCounterOffer = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Sending counter-offer...");
    try {
      await api.post(`/bids/${counterModal.bidId}/make_counter/`, {
        counter_amount: counterModal.counterAmount,
      });
      setCounterModal({
        isOpen: false,
        bidId: null,
        currentAmount: "",
        counterAmount: "",
      });
      fetchRFQDetails();
      toast.success("Counter-offer sent!", { id: loadingToast });
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to send counter offer.",
        { id: loadingToast },
      );
    }
  };

  const handleVendorCounterResponse = async (bidId, action) => {
    const loadingToast = toast.loading(
      `${action === "accept" ? "Accepting" : "Declining"} counter-offer...`,
    );
    try {
      await api.post(`/bids/${bidId}/${action}_counter/`, {});
      fetchRFQDetails();
      toast.success(`Counter-offer ${action}ed!`, { id: loadingToast });
    } catch (error) {
      toast.error(
        error.response?.data?.error || `Failed to ${action} counter offer.`,
        { id: loadingToast },
      );
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmittingBid(true);
    const loadingToast = toast.loading("Submitting quote...");
    try {
      const submitData = new FormData();
      submitData.append("shipment", biddingShipment.id);
      submitData.append("amount", bidForm.amount);
      submitData.append("transit_time_days", bidForm.transit_time_days);
      submitData.append("free_days_demurrage", bidForm.free_days_demurrage);
      submitData.append("valid_until", bidForm.valid_until);
      if (bidFile) submitData.append("file", bidFile);

      await api.post("/bids/", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBiddingShipment(null);
      setBidForm({
        amount: "",
        transit_time_days: "",
        free_days_demurrage: 14,
        valid_until: "",
      });
      setBidFile(null);
      fetchRFQDetails();
      toast.success("Quote submitted successfully!", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to submit bid. You can only bid once per lane.", {
        id: loadingToast,
      });
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 pt-20 px-4 sm:px-8 animate-pulse">
        <div className="max-w-7xl mx-auto">
          <div className="h-4 bg-slate-200 rounded w-48 mb-6"></div>
          <div className="h-40 bg-white rounded-2xl shadow-sm mb-8"></div>
          <div className="h-64 bg-white rounded-2xl shadow-sm"></div>
        </div>
      </div>
    );

  if (!rfq)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800">RFQ Not Found</h2>
          <p className="text-slate-500 mt-2">
            The document may have been deleted or you lack permissions.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        }}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/rfq-list")}
          className="mb-6 flex items-center text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />{" "}
          Back to Load Board
        </button>
        {/* 1. ENTERPRISE HEADER CARD */}
        <div className="bg-white shadow-sm hover:shadow-md hover:shadow-orange-900/5 transition-shadow rounded-2xl overflow-hidden mb-8 border border-orange-200/60">
          <div className="p-6 sm:p-8 border-b border-orange-100 flex flex-col md:flex-row justify-between items-start gap-6 bg-linear-to-r from-orange-50/50 to-white">
            <div className="w-full md:w-auto">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                    rfq.status === "OPEN"
                      ? "bg-orange-500 text-white border-orange-600"
                      : "bg-stone-100 text-stone-500 border-stone-200"
                  }`}
                >
                  {rfq.status}
                </span>
                <span className="text-sm font-bold text-orange-400 font-mono bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                  ID: #{rfq.id}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
                {rfq.title}
              </h1>

              <p className="text-sm font-medium text-stone-500 mt-2 flex items-center gap-1.5">
                Tendered by:{" "}
                <span className="text-stone-800 font-bold bg-orange-50 px-2 py-0.5 rounded-md">
                  {rfq.created_by_username}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <span className="flex items-center gap-1.5 font-bold bg-white px-4 py-2 rounded-xl border border-orange-200 shadow-sm text-sm text-stone-700">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Due: {new Date(rfq.deadline).toLocaleDateString()}
                </span>

                {rfq.visible_target_price && (
                  <span className="text-amber-700 bg-amber-50 px-3 py-2 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-1.5 shadow-sm">
                    <DollarSign className="h-3.5 w-3.5" /> Target Visible
                  </span>
                )}

                {rfq.visible_bids && (
                  <span className="text-orange-800 bg-orange-100 px-3 py-2 rounded-xl text-xs font-bold border border-orange-300 flex items-center gap-1.5 shadow-sm">
                    <AlertCircle className="h-3.5 w-3.5" /> Open Auction
                  </span>
                )}
              </div>
            </div>

            {rfq.file && (
              <a
                href={getFileUrl(rfq.file)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-5 bg-white border-2 border-orange-100 rounded-2xl hover:bg-orange-50 hover:border-orange-400 hover:shadow-md hover:shadow-orange-100 transition-all group w-full md:w-56 text-center"
              >
                <FileText className="h-10 w-10 text-orange-400 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-transform" />
                <span className="text-sm font-black text-stone-800">
                  Download Official Specs
                </span>
                <span className="text-xs text-orange-500 mt-1 font-medium">
                  PDF / Excel Document
                </span>
              </a>
            )}
          </div>
        </div>

        {/* 2. THE LANE & BIDDING ENGINE */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2.5 rounded-2xl">
              <Ship className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                Shipment Requirements
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                {rfq.shipments?.length || 0} active logistics lanes
              </p>
            </div>
          </div>
          <div className="h-px bg-slate-200 flex-1 ml-4 hidden sm:block"></div>

          {/* Legend for Target Price visibility */}
          {rfq.visible_target_price && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[12px] font-black text-emerald-700 uppercase tracking-tight">
                Target Prices Visible to Vendors
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {rfq.shipments?.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <MapPin className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold text-lg">
                No lanes have been added to this tender yet.
              </p>
            </div>
          ) : (
            rfq.shipments.map((ship) => {
              const sortedBids = ship.all_bids
                ? [...ship.all_bids].sort(
                    (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
                  )
                : [];

              const chartData = sortedBids.map((b) => ({
                name: (b.vendor_company || b.vendor_name).substring(0, 10),
                amount: parseFloat(b.amount),
                transit: parseInt(b.transit_time_days) || 0,
              }));

              return (
                <div
                  key={ship.id}
                  className="bg-white shadow-sm rounded-3xl border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    {/* Lane Info */}
                    <div className="flex items-start sm:items-center gap-4 w-full lg:w-auto">
                      <div className="bg-linear-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200 hidden sm:block shadow-inner">
                        <MapPin className="h-7 w-7 text-orange-600" />
                      </div>
                      <div className="w-full">
                        {/* 🚀 Dynamic Lane Title */}
                        <div className="text-xs font-bold text-orange-600 uppercase tracking-[0.2em] mb-1">
                          {ship.title || "Standard Logistics Lane"}
                        </div>
                        <div className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 flex flex-wrap items-center gap-2 sm:gap-3">
                          {ship.origin_port}{" "}
                          <span className="text-slate-400">➔</span>{" "}
                          {ship.destination_port}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-sm">
                            {ship.volume}x {ship.container_type || "40HC"}
                          </span>

                          {/* 🚀 Target Price Badge (Only if visible) */}
                          {rfq.visible_target_price && ship.target_price && (
                            <span className="bg-emerald-50 px-3 py-1 rounded-lg text-emerald-700 font-bold text-xs sm:text-sm border border-emerald-100 flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5" /> Target: $
                              {ship.target_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full lg:w-auto flex flex-col items-end gap-3">
                      {isVendor ? (
                        ship.my_bid ? (
                          <div className="flex flex-col items-end gap-3 w-full">
                            {/* VENDOR: COUNTER OFFER BANNER */}
                            {ship.my_bid.counter_offer_status === "PENDING" && (
                              <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full justify-between shadow-sm animate-pulse">
                                <div>
                                  <p className="text-[10px] sm:text-xs font-black text-orange-800 uppercase tracking-widest mb-1">
                                    Shipper Counter-Offer
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-orange-900">
                                    Requested Price: $
                                    {ship.my_bid.counter_offer_amount}
                                  </p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() =>
                                      handleVendorCounterResponse(
                                        ship.my_bid.id,
                                        "reject",
                                      )
                                    }
                                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleVendorCounterResponse(
                                        ship.my_bid.id,
                                        "accept",
                                      )
                                    }
                                    className="flex-1 sm:flex-none px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition shadow-sm"
                                  >
                                    Accept Price
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full">
                              {/* VENDOR: PDF DOWNLOAD */}
                              {ship.my_bid.is_winner &&
                                ship.my_bid.contract_file && (
                                  <a
                                    href={getFileUrl(ship.my_bid.contract_file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-100 text-green-800 border border-green-200 px-4 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-green-200 transition shadow-sm"
                                  >
                                    <Download className="h-4 w-4" /> Contract
                                  </a>
                                )}

                              <button
                                onClick={() => openChat(ship.my_bid)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold transition border border-slate-200 shadow-sm text-sm"
                              >
                                <MessageSquare className="h-4 w-4" /> Message
                              </button>

                              {ship.my_bid.is_winner ? (
                                <span className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-white bg-blue-600 px-5 py-2.5 rounded-xl font-black shadow-md text-sm">
                                  <Trophy className="h-5 w-5 text-yellow-300" />{" "}
                                  Contract Awarded
                                </span>
                              ) : (
                                <span className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-green-800 bg-green-50 px-5 py-2.5 rounded-xl font-black border border-green-200 shadow-sm text-sm">
                                  <CheckCircle className="h-5 w-5" /> Placed: $
                                  {ship.my_bid.amount}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setBiddingShipment(ship)}
                            className="w-full lg:w-auto bg-slate-900 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg transform hover:-translate-y-1"
                          >
                            Submit Quote
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() =>
                            setViewingBidsFor(
                              viewingBidsFor === ship.id ? null : ship.id,
                            )
                          }
                          className={`w-full lg:w-auto px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${viewingBidsFor === ship.id ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 shadow-sm"}`}
                        >
                          {viewingBidsFor === ship.id
                            ? "Close Bids"
                            : `Compare Bids (${sortedBids.length})`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 🚀 RESTORED: ORG COMPARATIVE BID DASHBOARD W/ ADVANCED CHARTS */}
                  {viewingBidsFor === ship.id &&
                    !isVendor &&
                    (() => {
                      const minPrice =
                        sortedBids.length > 0
                          ? Math.min(...chartData.map((b) => b.amount))
                          : 0;
                      const avgPrice =
                        sortedBids.length > 0
                          ? chartData.reduce(
                              (acc, curr) => acc + curr.amount,
                              0,
                            ) / chartData.length
                          : 0;

                      return (
                        <div className="bg-[#f8fafc] border-t border-slate-200 p-4 sm:p-8 animate-in fade-in duration-500 rounded-b-3xl">
                          {/* HEADER & METRICS */}
                          <div className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                                  Live Analysis
                                </span>
                              </div>
                              <h5 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <BarChart2 className="h-6 w-6 text-orange-500" />
                                Bid Intelligence
                              </h5>
                            </div>

                            {sortedBids.length > 0 && (
                              <div className="flex flex-wrap gap-4">
                                <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                                  <div className="bg-green-100 p-2 rounded-lg">
                                    <TrendingDown className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                      Best Quote
                                    </p>
                                    <p className="text-lg font-black text-slate-900">
                                      ${minPrice.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                                  <div className="bg-blue-100 p-2 rounded-lg">
                                    <BarChart2 className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                      Market Avg
                                    </p>
                                    <p className="text-lg font-black text-slate-900">
                                      ${Math.round(avgPrice).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {sortedBids.length > 0 ? (
                            <>
                              {/* ADVANCED ANALYTICS GRID */}
                              {sortedBids.length > 1 && (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                                  {/* Composed Price vs Time Chart */}
                                  <div className="xl:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm h-80">
                                    <div className="flex items-center justify-between mb-4">
                                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Price vs. Lead Time Efficiency
                                      </h6>
                                    </div>
                                    <ResponsiveContainer
                                      width="100%"
                                      height="90%"
                                      minWidth={0}
                                      minHeight={0}
                                    >
                                      <ComposedChart
                                        data={chartData}
                                        margin={{
                                          top: 10,
                                          right: 10,
                                          left: -20,
                                          bottom: 0,
                                        }}
                                      >
                                        <CartesianGrid
                                          strokeDasharray="3 3"
                                          vertical={false}
                                          stroke="#f1f5f9"
                                        />
                                        <XAxis
                                          dataKey="name"
                                          axisLine={false}
                                          tickLine={false}
                                          tick={{
                                            fill: "#64748b",
                                            fontSize: 11,
                                            fontWeight: "bold",
                                          }}
                                        />
                                        <YAxis
                                          yAxisId="left"
                                          axisLine={false}
                                          tickLine={false}
                                          tick={{
                                            fill: "#64748b",
                                            fontSize: 11,
                                          }}
                                        />
                                        <YAxis
                                          yAxisId="right"
                                          orientation="right"
                                          axisLine={false}
                                          tickLine={false}
                                          tick={{
                                            fill: "#64748b",
                                            fontSize: 11,
                                          }}
                                        />
                                        <Tooltip
                                          cursor={{ fill: "#f8fafc" }}
                                          contentStyle={{
                                            borderRadius: "16px",
                                            border: "none",
                                            boxShadow:
                                              "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                            fontWeight: "bold",
                                          }}
                                        />
                                        <Legend
                                          wrapperStyle={{
                                            fontSize: "11px",
                                            fontWeight: "bold",
                                            paddingTop: "10px",
                                          }}
                                        />
                                        <Bar
                                          yAxisId="left"
                                          dataKey="amount"
                                          name="Bid Price ($)"
                                          fill="#0f172a"
                                          radius={[6, 6, 0, 0]}
                                          barSize={40}
                                        >
                                          {chartData.map((entry, index) => (
                                            <Cell
                                              key={`cell-${index}`}
                                              fill={
                                                index === 0
                                                  ? "#10b981"
                                                  : "#0f172a"
                                              }
                                            />
                                          ))}
                                        </Bar>
                                        <Line
                                          yAxisId="right"
                                          type="monotone"
                                          dataKey="transit"
                                          name="Transit Time (Days)"
                                          stroke="#f97316"
                                          strokeWidth={3}
                                          dot={{
                                            r: 4,
                                            fill: "#f97316",
                                            strokeWidth: 2,
                                            stroke: "#fff",
                                          }}
                                        />
                                      </ComposedChart>
                                    </ResponsiveContainer>
                                  </div>

                                  {/* Smart Insight Card */}
                                  <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                      <Zap className="h-24 w-24" />
                                    </div>
                                    <div className="relative z-10">
                                      <Zap className="h-6 w-6 text-orange-400 mb-4" />
                                      <h3 className="text-xl font-black mb-2 tracking-tight">
                                        Smart Insight
                                      </h3>
                                      <p className="text-slate-400 text-sm leading-relaxed">
                                        <span className="text-white font-bold">
                                          {sortedBids[0]?.vendor_company ||
                                            sortedBids[0]?.vendor_name}
                                        </span>{" "}
                                        is currently offering the most
                                        competitive rate.
                                      </p>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-slate-800 relative z-10">
                                      <div className="flex justify-between items-center mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span>Cost vs Average</span>
                                        <span className="text-green-400 text-xs">
                                          -
                                          {Math.round(
                                            ((avgPrice - minPrice) / avgPrice) *
                                              100,
                                          )}
                                          %
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                          className="bg-green-400 h-full rounded-full transition-all duration-1000"
                                          style={{
                                            width: `${((avgPrice - minPrice) / avgPrice) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* DETAILED COMPARISON CARDS */}
                              <div className="space-y-4">
                                {sortedBids.map((bid, index) => {
                                  const isBestPrice = index === 0;
                                  return (
                                    <div
                                      key={bid.id}
                                      className={`group relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 rounded-3xl border-2 transition-all duration-300 ${
                                        isBestPrice
                                          ? "bg-white border-green-500 shadow-xl lg:scale-[1.01] z-10"
                                          : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                                      }`}
                                    >
                                      {/* Badges Overlay */}
                                      <div className="absolute -top-3 left-6 flex gap-2 z-20">
                                        {isBestPrice && (
                                          <span className="bg-green-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                                            <Trophy className="h-3 w-3" />{" "}
                                            Recommended
                                          </span>
                                        )}
                                        {bid.is_winner && (
                                          <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                                            <CheckCircle className="h-3 w-3" />{" "}
                                            Awarded Winner
                                          </span>
                                        )}
                                      </div>

                                      {/* Info Section */}
                                      <div className="flex-1 w-full lg:w-auto mt-2 lg:mt-0 mb-6 lg:mb-0 pr-0 lg:pr-8">
                                        <div className="flex items-center gap-4 mb-4">
                                          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl border border-slate-200">
                                            {(
                                              bid.vendor_company ||
                                              bid.vendor_name
                                            )?.charAt(0) || "V"}
                                          </div>
                                          <div>
                                            <h4 className="font-black text-slate-900 text-xl tracking-tight">
                                              {bid.vendor_company ||
                                                bid.vendor_name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                              {bid.is_winner && (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                  <ShieldCheck className="h-3 w-3" />{" "}
                                                  Verified Partner
                                                </span>
                                              )}
                                              <span className="text-xs text-slate-400 font-medium">
                                                Quote Valid:{" "}
                                                {bid.valid_until
                                                  ? new Date(
                                                      bid.valid_until,
                                                    ).toLocaleDateString()
                                                  : "N/A"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <div>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">
                                                Transit Time
                                              </p>
                                              <p className="text-sm font-black text-slate-800 leading-none">
                                                {bid.transit_time_days} Days
                                              </p>
                                            </div>
                                          </div>
                                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-slate-400" />
                                            <div>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">
                                                Free Days
                                              </p>
                                              <p className="text-sm font-black text-slate-800 leading-none">
                                                {bid.free_days_demurrage} Days
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Pricing & Actions Section */}
                                      <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-6 lg:pl-8 lg:border-l lg:border-slate-100">
                                        <div className="text-left xl:text-right w-full sm:w-auto">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Total All-In Cost
                                          </p>
                                          <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                            ${bid.amount}
                                          </div>
                                          {!isBestPrice && (
                                            <div className="text-[10px] font-bold text-red-400 mt-1">
                                              +$
                                              {(
                                                parseFloat(bid.amount) -
                                                minPrice
                                              ).toLocaleString()}{" "}
                                              vs best
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                                          <button
                                            onClick={() => openChat(bid)}
                                            className="flex-1 sm:flex-none h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                          >
                                            <MessageSquare className="h-4 w-4" />{" "}
                                            <span className="hidden sm:inline">
                                              Chat
                                            </span>
                                          </button>

                                          {!bid.is_winner &&
                                            rfq.status === "OPEN" &&
                                            bid.counter_offer_status !==
                                              "PENDING" && (
                                              <button
                                                onClick={() =>
                                                  setCounterModal({
                                                    isOpen: true,
                                                    bidId: bid.id,
                                                    currentAmount: bid.amount,
                                                    counterAmount: "",
                                                  })
                                                }
                                                className="flex-1 sm:flex-none h-12 bg-white hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-300 text-slate-700 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
                                              >
                                                <RefreshCcw className="h-4 w-4" />{" "}
                                                <span className="hidden sm:inline">
                                                  Counter
                                                </span>
                                              </button>
                                            )}

                                          {bid.is_winner &&
                                            bid.contract_file && (
                                              <a
                                                href={getFileUrl(
                                                  bid.contract_file,
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 sm:flex-none h-12 bg-green-100 text-green-800 border border-green-200 text-xs font-black uppercase px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-200 transition"
                                              >
                                                <Download className="h-4 w-4" />{" "}
                                                Contract
                                              </a>
                                            )}

                                          {!bid.is_winner &&
                                            rfq.status === "OPEN" && (
                                              <button
                                                onClick={() =>
                                                  setAwardConfirmModal({
                                                    isOpen: true,
                                                    bidId: bid.id,
                                                  })
                                                }
                                                className="w-full sm:w-auto h-12 text-sm text-white px-6 rounded-xl font-black transition shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 bg-linear-to-br from-orange-500 to-orange-600"
                                              >
                                                Award Contract
                                              </button>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                              <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-10 w-10 text-slate-300" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 mb-2">
                                Awaiting Vendor Quotes
                              </h3>
                              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                Your tender is live. Comparative analytics and
                                charts will appear here automatically once bids
                                are submitted.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
              );
            })
          )}
        </div>

        {/* 3. ORG: ADD LANE FORM */}
        {!isVendor && rfq.status === "OPEN" && (
          <div className="mt-10 bg-white p-6 sm:p-8 rounded-3xl border-2 border-dashed border-slate-300 hover:border-orange-400 transition-colors">
            <h4 className="text-xl font-black mb-6 text-slate-900 flex items-center gap-2">
              <Plus className="h-6 w-6 text-orange-600 bg-orange-100 p-1 rounded-full" />{" "}
              Add New Lane to Tender
            </h4>
            <form
              onSubmit={handleAddShipment}
              className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end"
            >
              {/* Lane Title */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Lane Title / Reference
                </label>
                <input
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-0 outline-none transition"
                  value={newShipment.title || ""}
                  onChange={(e) =>
                    setNewShipment({ ...newShipment, title: e.target.value })
                  }
                  placeholder="e.g. German Supply Chain"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Origin Port
                </label>
                <input
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-0 outline-none transition"
                  value={newShipment.origin_port}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      origin_port: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g. Shanghai"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Destination Port
                </label>
                <input
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-0 outline-none transition"
                  value={newShipment.destination_port}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      destination_port: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g. Los Angeles"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Volume (40HC Count)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-0 outline-none transition"
                  value={newShipment.volume}
                  onChange={(e) =>
                    setNewShipment({ ...newShipment, volume: e.target.value })
                  }
                  required
                />
              </div>

              {/* Target Price Field */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Target Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    className="w-full pl-8 p-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-0 outline-none transition"
                    value={newShipment.target_price}
                    onChange={(e) =>
                      setNewShipment({
                        ...newShipment,
                        target_price: e.target.value,
                      })
                    }
                    placeholder="3500"
                  />
                </div>
              </div>

              <div className="md:col-span-6">
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white p-3.5 rounded-xl text-sm font-black hover:bg-orange-600 transition shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Publish Lane & Start Bidding
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- CUSTOM MODAL: CONFIRM AWARD CONTRACT --- */}
      {awardConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 shadow-inner">
                <ShieldAlert className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Confirm Award
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-8">
                Are you sure you want to award the freight to this vendor? This
                action is final and will auto-generate the binding legal
                contract.
              </p>
              <div className="flex gap-4 w-full">
                <button
                  disabled={isAwarding}
                  onClick={() =>
                    setAwardConfirmModal({ isOpen: false, bidId: null })
                  }
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={isAwarding}
                  onClick={executeAwardBid}
                  className={`flex-1 py-3.5 text-white font-black rounded-xl shadow-md transition ${isAwarding ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {isAwarding ? "Awarding..." : "Yes, Award Contract"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ORG: COUNTER OFFER MODAL --- */}
      {counterModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-orange-600" /> Propose
                Counter
              </h3>
              <button
                onClick={() =>
                  setCounterModal({
                    isOpen: false,
                    bidId: null,
                    currentAmount: "",
                    counterAmount: "",
                  })
                }
                className="text-slate-400 hover:text-slate-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitCounterOffer} className="p-6 sm:p-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Current Vendor Bid
                </p>
                <p className="text-2xl font-black text-slate-900">
                  ${counterModal.currentAmount}
                </p>
              </div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Your Proposed Price
              </label>
              <div className="relative mb-8">
                <span className="absolute left-4 top-3.5 text-slate-400 font-black text-lg">
                  $
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full pl-9 p-3.5 border-2 border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:border-orange-500 focus:ring-0 outline-none transition"
                  value={counterModal.counterAmount}
                  onChange={(e) =>
                    setCounterModal({
                      ...counterModal,
                      counterAmount: e.target.value,
                    })
                  }
                  placeholder="Enter new price..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-xl shadow-md transition transform hover:-translate-y-0.5"
              >
                Send Counter-Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- VENDOR: FINANCIAL BIDDING MODAL --- */}
      {biddingShipment && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-400" /> Submit Formal
                Quote
              </h3>
              <button
                onClick={() => setBiddingShipment(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitBid} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Total Bid Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full p-4 border-2 border-slate-200 focus:border-orange-500 rounded-xl font-black text-lg text-slate-900 outline-none transition"
                    value={bidForm.amount}
                    onChange={(e) =>
                      setBidForm({ ...bidForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Quote Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-4 border-2 border-slate-200 focus:border-orange-500 rounded-xl font-bold text-slate-700 outline-none transition"
                    value={bidForm.valid_until}
                    onChange={(e) =>
                      setBidForm({ ...bidForm, valid_until: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Transit Time (Days)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full p-3.5 border-2 border-slate-200 focus:border-orange-500 rounded-xl font-bold text-slate-700 outline-none transition"
                    value={bidForm.transit_time_days}
                    onChange={(e) =>
                      setBidForm({
                        ...bidForm,
                        transit_time_days: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Free Days (Demurrage)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full p-3.5 border-2 border-slate-200 focus:border-orange-500 rounded-xl font-bold text-slate-700 outline-none transition"
                    value={bidForm.free_days_demurrage}
                    onChange={(e) =>
                      setBidForm({
                        ...bidForm,
                        free_days_demurrage: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setBiddingShipment(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className={`flex-1 py-4 text-white font-black rounded-xl shadow-md transition transform ${submittingBid ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 hover:-translate-y-0.5"}`}
                >
                  {submittingBid ? "Submitting..." : "Submit Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- IN-APP CHAT DRAWER --- */}
      <BidChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        bidId={activeChatBid?.id}
        chatTitle={
          activeChatBid
            ? `Bid from ${activeChatBid.vendor_company || activeChatBid.vendor_name} for $${activeChatBid.amount}`
            : ""
        }
      />
    </div>
  );
};

export default RFQDetail;
