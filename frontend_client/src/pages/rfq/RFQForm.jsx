import { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import {
  ArrowLeft, Save, Loader2, FileText, Calendar, Eye, 
  AlignLeft, UploadCloud, ShieldCheck, Info, TrendingDown, Users
} from "lucide-react";

const RFQForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    visible_target_price: false,
    visible_bids: false,
  });

  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("deadline", formData.deadline);
      submitData.append("visible_target_price", formData.visible_target_price);
      submitData.append("visible_bids", formData.visible_bids);
      submitData.append("status", "OPEN");

      if (file) submitData.append("file", file);

      await api.post("/rfqs/", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/rfq-list");
    } catch (error) {
      alert("Error creating RFQ. Please check the console.");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/rfq-list")}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-orange-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Command Center
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* PREMIUM HEADER */}
          <div className="px-10 py-8 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                <FileText className="h-6 w-6 text-orange-500" />
                Initialize Freight Tender
              </h2>
              <p className="text-sm text-gray-400 mt-2 font-medium max-w-lg">
                Broadcast your logistics requirements to the carrier network and start receiving competitive bids instantly.
              </p>
            </div>
            <ShieldCheck className="h-12 w-12 text-gray-700 hidden sm:block opacity-50" />
          </div>

          <form onSubmit={handleSubmit} className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* LEFT COLUMN - CORE INPUTS */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Tender Reference Title
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:ring-0 focus:border-orange-500 transition-colors outline-none"
                    placeholder="e.g. Q4 Transpacific Logistics - Shanghai to LA"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-2"><AlignLeft className="h-4 w-4" /> Scope & Instructions</span>
                  </label>
                  <textarea
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-0 focus:border-orange-500 transition-colors outline-none leading-relaxed"
                    rows="4"
                    placeholder="Detail your specific commodity requirements, required certifications, or special handling instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Submission Deadline</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-0 focus:border-orange-500 transition-colors outline-none"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>

                  {/* CUSTOM FILE UPLOAD ZONE */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Attach Specifications (Optional)
                    </label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-orange-500 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center text-center group">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                      <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-orange-500 mb-2 transition-colors" />
                      <span className="text-sm font-bold text-gray-700 group-hover:text-orange-700">
                        {file ? file.name : "Click or drag file here"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - AUCTION STRATEGY */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <Eye className="h-4 w-4 text-indigo-500" /> Auction Strategy
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Interactive Toggle Card 1 */}
                    <div 
                      onClick={() => setFormData({...formData, visible_target_price: !formData.visible_target_price})}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.visible_target_price ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold ${formData.visible_target_price ? 'text-indigo-900' : 'text-gray-700'}`}>Share Target Price</span>
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.visible_target_price ? 'border-indigo-500' : 'border-gray-300'}`}>
                          {formData.visible_target_price && <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><TrendingDown className="h-3 w-3"/> Encourages bids under your budget.</p>
                    </div>

                    {/* Interactive Toggle Card 2 */}
                    <div 
                      onClick={() => setFormData({...formData, visible_bids: !formData.visible_bids})}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.visible_bids ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold ${formData.visible_bids ? 'text-orange-900' : 'text-gray-700'}`}>Open Competition</span>
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.visible_bids ? 'border-orange-500' : 'border-gray-300'}`}>
                          {formData.visible_bids && <div className="h-2 w-2 bg-orange-500 rounded-full"></div>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Users className="h-3 w-3"/> Vendors see competitor prices.</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-2 text-xs font-medium text-gray-500 bg-white p-3 rounded-lg border border-gray-100">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    You can add specific shipping lanes and container volumes on the next screen after saving.
                  </div>
                </div>
              </div>

            </div>

            {/* ACTION FOOTER */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/rfq-list")}
                className="px-8 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-10 py-3.5 border border-transparent shadow-lg shadow-orange-200 text-sm font-black rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                {loading ? "Initializing..." : "Publish Tender & Proceed"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RFQForm;