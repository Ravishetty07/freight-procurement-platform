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
  AlignLeft,
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
} from "lucide-react";
import BidChatDrawer from "../../components/chat/BidChatDrawer";

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQDetails();
  }, [id]);

  const getFileUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  const handleAddShipment = async (e) => {
    e.preventDefault();
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
    } catch (error) {
      alert("Failed to add shipment. Check console.");
    }
  };

  const handleAwardBid = async (bidId) => {
    const confirmed = window.confirm(
      "Are you sure you want to award the freight to this vendor? This will lock in the contract.",
    );
    if (!confirmed) return;
    try {
      await api.post(`/bids/${bidId}/award/`);
      fetchRFQDetails();
    } catch (error) {
      console.error(error);
      alert("Failed to award bid. Check permissions.");
    }
  };

  // --- COUNTER OFFER LOGIC ---
  const submitCounterOffer = async (e) => {
    e.preventDefault();
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
    } catch (error) {
      console.error("Backend Error:", error.response?.data || error);
      alert(error.response?.data?.error || "Failed to send counter offer.");
    }
  };

  const handleVendorCounterResponse = async (bidId, action) => {
    try {
      await api.post(`/bids/${bidId}/${action}_counter/`, {});
      fetchRFQDetails();
    } catch (error) {
      console.error("Backend Error:", error.response?.data || error.message);
      alert(
        error.response?.data?.error || `Failed to ${action} counter offer.`,
      );
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setSubmittingBid(true);
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
    } catch (error) {
      alert("Failed to submit bid. You can only bid once per lane.");
      console.error(error);
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-8 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="h-40 bg-white rounded-xl border border-gray-100 mb-8"></div>
        <div className="h-64 bg-white rounded-xl border border-gray-100"></div>
      </div>
    );
  if (!rfq)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 font-bold">
        RFQ Not Found or Access Denied
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 relative pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/rfq-list")}
          className="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Load Board
        </button>

        {/* 1. ENTERPRISE HEADER CARD */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden mb-8 border border-gray-200">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-6 bg-linear-to-r from-gray-50 to-white">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${rfq.status === "OPEN" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-200 text-gray-700 border-gray-300"}`}
                >
                  {rfq.status}
                </span>
                <span className="text-sm font-bold text-gray-400">
                  ID: #{rfq.id}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {rfq.title}
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-2">
                Tendered by:{" "}
                <span className="text-gray-900 font-bold">
                  {rfq.created_by_username}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <span className="flex items-center gap-1.5 font-bold bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Due: {new Date(rfq.deadline).toLocaleDateString()}
                </span>
                {rfq.visible_target_price && (
                  <span className="text-green-800 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Target Visible
                  </span>
                )}
                {rfq.visible_bids && (
                  <span className="text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Open Auction
                  </span>
                )}
              </div>
            </div>

            {rfq.file && (
              <a
                href={getFileUrl(rfq.file)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-orange-50 border-2 border-orange-100 rounded-xl hover:bg-orange-100 hover:border-orange-300 transition group w-full md:w-48 text-center"
              >
                <FileText className="h-8 w-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-orange-900">
                  Download Specs
                </span>
              </a>
            )}
          </div>
        </div>

        {/* 2. THE LANE & BIDDING ENGINE */}
        <div className="mb-8 flex items-center gap-3">
          <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Ship className="h-6 w-6 text-orange-600" /> Shipment Requirements
          </h3>
          <div className="h-px bg-gray-200 flex-1 ml-4"></div>
        </div>

        <div className="space-y-4">
          {rfq.shipments?.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-400 font-medium">
              No lanes have been added to this tender yet.
            </div>
          ) : (
            rfq.shipments.map((ship) => {
              const sortedBids = ship.all_bids
                ? [...ship.all_bids].sort(
                    (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
                  )
                : [];

              return (
                <div
                  key={ship.id}
                  className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 hidden sm:block">
                        <MapPin className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-lg font-black text-gray-900 flex items-center gap-3">
                          {ship.origin_port}{" "}
                          <span className="text-gray-300">➔</span>{" "}
                          {ship.destination_port}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm font-medium text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-bold">
                            {ship.volume}x 40HC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-auto text-right">
                      {isVendor ? (
                        ship.my_bid ? (
                          <div className="inline-flex flex-col items-end gap-2">
                            {/* VENDOR: COUNTER OFFER ACTION BANNER */}
                            {ship.my_bid.counter_offer_status === "PENDING" && (
                              <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-center gap-4 w-full justify-between shadow-sm animate-pulse">
                                <div className="text-left">
                                  <p className="text-xs font-black text-orange-800 uppercase tracking-wide">
                                    Shipper Counter-Offer
                                  </p>
                                  <p className="text-sm font-bold text-orange-900">
                                    Requested Price: $
                                    {ship.my_bid.counter_offer_amount}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleVendorCounterResponse(
                                        ship.my_bid.id,
                                        "reject",
                                      )
                                    }
                                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100"
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
                                    className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700"
                                  >
                                    Accept Price
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {/* VENDOR: PDF DOWNLOAD BUTTON (Only shows if they won) */}
                              {ship.my_bid.is_winner &&
                                ship.my_bid.contract_file && (
                                  <a
                                    href={getFileUrl(ship.my_bid.contract_file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-100 text-green-800 border border-green-200 px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 hover:bg-green-200 transition shadow-sm"
                                  >
                                    <Download className="h-4 w-4" /> Contract
                                    PDF
                                  </a>
                                )}

                              <button
                                onClick={() => openChat(ship.my_bid)}
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold transition border border-gray-200"
                              >
                                <MessageSquare className="h-4 w-4" /> Message
                                Shipper
                              </button>

                              {/* VENDOR: DYNAMIC BADGE (Changes if they win) */}
                              {ship.my_bid.is_winner ? (
                                <span className="inline-flex items-center gap-1.5 text-white bg-blue-600 px-4 py-2 rounded-lg font-black shadow-md">
                                  <Trophy className="h-5 w-5" /> Contract
                                  Awarded
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-green-800 bg-green-50 px-4 py-2 rounded-lg font-black border border-green-200">
                                  <CheckCircle className="h-5 w-5" /> Placed: $
                                  {ship.my_bid.amount}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 font-bold">
                              {ship.my_bid.counter_offer_status ===
                                "ACCEPTED" && "Counter Accepted"}
                              {ship.my_bid.counter_offer_status ===
                                "REJECTED" && "Counter Declined"}
                              {ship.my_bid.counter_offer_status === "NONE" &&
                                "Awaiting Shipper Decision"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setBiddingShipment(ship)}
                            className="w-full lg:w-auto bg-gray-900 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md transform active:scale-95"
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
                          className="w-full lg:w-auto bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                          {viewingBidsFor === ship.id
                            ? "Close Bids"
                            : `Compare Bids (${sortedBids.length})`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ORG: COMPARATIVE BID DASHBOARD */}
                  {viewingBidsFor === ship.id && !isVendor && (
                    <div className="bg-gray-50 border-t border-gray-200 p-6">
                      <h5 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                        <TrendingDown className="h-4 w-4 text-gray-400" /> Bid
                        Comparison Matrix
                      </h5>

                      {sortedBids.length > 0 ? (
                        <div className="space-y-3">
                          {sortedBids.map((bid, index) => {
                            const isBestPrice = index === 0;
                            return (
                              <div
                                key={bid.id}
                                className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border-2 transition-all ${isBestPrice ? "bg-green-50/50 border-green-400 shadow-sm" : "bg-white border-gray-100"}`}
                              >
                                <div className="flex-1 w-full md:w-auto mb-4 md:mb-0">
                                  <div className="flex items-center gap-3">
                                    <div className="font-black text-gray-900 text-lg">
                                      {bid.vendor_company || bid.vendor_name}
                                    </div>
                                    {isBestPrice && (
                                      <span className="bg-green-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                        <Trophy className="h-3 w-3" /> Best
                                        Price
                                      </span>
                                    )}
                                    {bid.is_winner && (
                                      <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />{" "}
                                        Awarded Winner
                                      </span>
                                    )}

                                    {/* THE MISSING PDF BUTTON GOES RIGHT HERE */}
                                    {bid.is_winner && bid.contract_file && (
                                      <a
                                        href={getFileUrl(bid.contract_file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-100 text-green-800 border border-green-200 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 hover:bg-green-200 transition"
                                      >
                                        <Download className="h-3 w-3" />{" "}
                                        Contract PDF
                                      </a>
                                    )}

                                    {bid.counter_offer_status === "PENDING" && (
                                      <span className="bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                        <RefreshCcw className="h-3 w-3" />{" "}
                                        Counter Pending
                                      </span>
                                    )}
                                    {bid.counter_offer_status ===
                                      "REJECTED" && (
                                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                        <X className="h-3 w-3" /> Counter
                                        Declined
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mt-2">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" /> Transit:{" "}
                                      {bid.transit_time_days} Days
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Free Days: {bid.free_days_demurrage}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-2xl font-black text-gray-900 mr-6 w-full md:w-auto text-left md:text-right">
                                  ${bid.amount}
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                  <button
                                    onClick={() => openChat(bid)}
                                    className="flex-1 md:flex-none text-sm bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-sm"
                                  >
                                    <MessageSquare className="h-4 w-4 text-[#EF7D00]" />{" "}
                                    Chat
                                  </button>

                                  {/* ORG: COUNTER OFFER BUTTON */}
                                  {!bid.is_winner &&
                                    rfq.status === "OPEN" &&
                                    bid.counter_offer_status !== "PENDING" && (
                                      <button
                                        onClick={() =>
                                          setCounterModal({
                                            isOpen: true,
                                            bidId: bid.id,
                                            currentAmount: bid.amount,
                                            counterAmount: "",
                                          })
                                        }
                                        className="flex-1 md:flex-none text-sm bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-700 px-4 py-2.5 rounded-lg font-bold transition shadow-sm flex items-center gap-1"
                                      >
                                        <RefreshCcw className="h-4 w-4" />{" "}
                                        Counter
                                      </button>
                                    )}

                                  {!bid.is_winner && rfq.status === "OPEN" && (
                                    <button
                                      onClick={() => handleAwardBid(bid.id)}
                                      className="flex-1 md:flex-none text-sm text-white px-6 py-2.5 rounded-lg font-bold transition shadow-md hover:shadow-lg"
                                      style={{
                                        background:
                                          "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)",
                                      }}
                                    >
                                      Award Contract
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-gray-500">
                            No quotes received for this lane yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 3. ORG: ADD LANE FORM */}
        {!isVendor && rfq.status === "OPEN" && (
          <div className="mt-8 bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200">
            <h4 className="text-lg font-black mb-6 text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-600" /> Add New Lane to
              Tender
            </h4>
            <form
              onSubmit={handleAddShipment}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
            >
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Origin Port
                </label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition"
                  value={newShipment.origin_port}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      origin_port: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Destination Port
                </label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition"
                  value={newShipment.destination_port}
                  onChange={(e) =>
                    setNewShipment({
                      ...newShipment,
                      destination_port: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Volume (TEU)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition"
                  value={newShipment.volume}
                  onChange={(e) =>
                    setNewShipment({ ...newShipment, volume: e.target.value })
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-orange-100 text-orange-800 p-3 rounded-xl text-sm font-black hover:bg-orange-200 transition border border-orange-200"
                >
                  Add Lane
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- ORG: COUNTER OFFER MODAL --- */}
      {counterModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-[#EF7D00]" /> Propose
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
                className="text-gray-400 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitCounterOffer} className="p-6">
              <p className="text-sm font-bold text-gray-500 mb-4">
                Current Vendor Bid:{" "}
                <span className="text-gray-900">
                  ${counterModal.currentAmount}
                </span>
              </p>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Your Proposed Price
              </label>
              <div className="relative mb-6">
                <span className="absolute left-4 top-3 text-gray-500 font-bold">
                  $
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full pl-8 p-3 border-2 border-gray-200 rounded-xl text-lg font-black text-gray-900 focus:border-[#EF7D00] focus:ring-0 outline-none"
                  value={counterModal.counterAmount}
                  onChange={(e) =>
                    setCounterModal({
                      ...counterModal,
                      counterAmount: e.target.value,
                    })
                  }
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gray-900 hover:bg-black text-white text-sm font-black rounded-xl shadow-md transition"
              >
                Send Counter-Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- VENDOR: FINANCIAL BIDDING MODAL --- */}
      {biddingShipment && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-900">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-400" /> Submit Formal
                Quote
              </h3>
              <button
                onClick={() => setBiddingShipment(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitBid} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Total Bid Amount
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-black"
                    value={bidForm.amount}
                    onChange={(e) =>
                      setBidForm({ ...bidForm, amount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Quote Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl font-bold"
                    value={bidForm.valid_until}
                    onChange={(e) =>
                      setBidForm({ ...bidForm, valid_until: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Transit Time (Days)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold"
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Free Days (Demurrage)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold"
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
              <div className="pt-6 border-t border-gray-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => setBiddingShipment(null)}
                  className="flex-1 py-3.5 bg-gray-100 font-black rounded-xl text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-xl"
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
