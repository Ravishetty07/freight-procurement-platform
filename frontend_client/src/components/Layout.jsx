import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogOut, LayoutGrid, PlusCircle, PackageSearch, FileCheck, 
  Menu, X, Bell, Ship, ChevronDown, User, Settings, Search
} from "lucide-react";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isVendor = user?.role === "VENDOR";
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "U";

  const isActive = (path) => location.pathname.startsWith(path);

  // Close User Dropdown on Click Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "auto";
  }, [mobileNavOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = isVendor
    ? [
        { name: "Dashboard", path: "/dashboard", icon: LayoutGrid },
        { name: "Live Market", path: "/rfq-list", icon: PackageSearch },
        { name: "My Quotes", path: "/my-bids", icon: FileCheck },
      ]
    : [
        { name: "Dashboard", path: "/dashboard", icon: LayoutGrid },
        { name: "Tender Database", path: "/rfq-list", icon: PackageSearch },
      ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* ========================================== */}
      {/* DESKTOP SIDEBAR (280px Fixed)              */}
      {/* ========================================== */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-gray-200 hidden lg:flex flex-col shadow-sm">
        {/* Brand Header */}
        <div className="h-[74px] flex items-center px-6 border-b border-gray-100">
          <div className="bg-gray-900 p-2 rounded-lg mr-3 shadow-sm">
            <Ship className="h-6 w-6 text-[#EF7D00]" />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">
            Freight<span className="text-[#EF7D00]">OS</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</div>
          
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive(item.path) 
                  ? "bg-orange-50 text-[#EF7D00] shadow-sm ring-1 ring-orange-100/50" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive(item.path) ? "text-[#EF7D00]" : "text-gray-400"}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Support Card inside Sidebar */}
        <div className="p-6 mt-auto">
          <div className="p-5 rounded-2xl text-white shadow-md relative overflow-hidden" style={{ background: "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)" }}>
            <div className="absolute -right-4 -top-4 bg-white/20 w-24 h-24 rounded-full opacity-50"></div>
            <h6 className="font-bold text-sm mb-1 relative z-10">Need Support?</h6>
            <p className="text-xs text-orange-100 mb-4 relative z-10">Contact platform admin</p>
            <button className="w-full bg-white text-[#D96F00] text-xs font-black py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition relative z-10">
              Open Ticket
            </button>
          </div>
          <div className="text-center mt-4 text-xs font-bold text-gray-400">
            Freight OS Enterprise © 2026
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MOBILE OFFCANVAS DRAWER                    */}
      {/* ========================================== */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          onClick={() => setMobileNavOpen(false)}
        ></div>
      )}

      <aside 
        className={`fixed top-0 left-0 h-full w-[280px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-[74px] flex justify-between items-center px-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900">
             <Ship className="h-6 w-6 text-[#EF7D00]" /> FreightOS
          </div>
          <button onClick={() => setMobileNavOpen(false)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shadow-sm">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                isActive(item.path) ? "bg-orange-50 text-[#EF7D00]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive(item.path) ? "text-[#EF7D00]" : "text-gray-400"}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => { setMobileNavOpen(false); handleLogout(); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl text-sm font-bold transition-colors">
            <LogOut className="h-5 w-5" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT WRAPPER                       */}
      {/* ========================================== */}
      <div className="flex-1 lg:pl-[280px] flex flex-col min-w-0 transition-all duration-300">
        
        {/* TOP HEADER (74px) */}
        <header className="h-[74px] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
          
          {/* Mobile Header Left */}
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setMobileNavOpen(true)} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
              <Menu className="h-5 w-5" />
            </button>
            <Ship className="h-6 w-6 text-[#EF7D00]" />
          </div>

          {/* Desktop Header Left (Search) */}
          <div className="hidden lg:flex items-center w-96 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tenders, bids, or shipments..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#EF7D00] focus:bg-white outline-none transition-all font-medium"
            />
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            {!isVendor && (
              <button onClick={() => navigate("/create-rfq")} className="hidden sm:flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md active:scale-95">
                <PlusCircle className="h-4 w-4 text-[#EF7D00]" />
                <span>New Tender</span>
              </button>
            )}

            <button className="relative p-2 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition text-gray-500">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-xl border border-transparent hover:border-gray-200 transition"
              >
                <div className="h-9 w-9 rounded-lg text-white flex items-center justify-center font-black text-sm shadow-sm" style={{ background: "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)" }}>
                  {userInitial}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-black text-gray-900 leading-none">{user?.username || "User"}</div>
                  <div className="text-[10px] text-[#EF7D00] uppercase mt-1 tracking-widest font-black">
                    {isVendor ? "Carrier" : "Shipper"}
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform hidden md:block ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-5 py-3 border-b border-gray-50 mb-1">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-black text-gray-900 truncate mt-0.5">{user?.username}</p>
                  </div>
                  <button className="w-full text-left px-5 py-2.5 text-sm font-bold hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                    <User className="h-4 w-4 text-gray-400" /> Profile Settings
                  </button>
                  <button className="w-full text-left px-5 py-2.5 text-sm font-bold hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                    <Settings className="h-4 w-4 text-gray-400" /> Preferences
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-left px-5 py-2.5 text-sm font-black hover:bg-red-50 flex items-center gap-3 text-red-600">
                    <LogOut className="h-4 w-4" /> Secure Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ========================================== */}
        {/* PAGE CONTENT DYNAMIC INJECTION             */}
        {/* ========================================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden">
          {/* This removes the squished "max-w-7xl" feel and lets the layout breathe */}
          <div className="mx-auto w-full max-w-[1600px]">
             {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;