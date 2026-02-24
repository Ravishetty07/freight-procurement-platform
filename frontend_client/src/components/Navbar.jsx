import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogOut, LayoutGrid, PlusCircle, PackageSearch, FileCheck, 
  Menu, X, Bell, Ship, ChevronDown, User, Settings
} from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for responsive elements
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isVendor = user?.role === "VENDOR";
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "U";

  // Check if a path is active
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

  // Dynamic Navigation Links based on Role
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
    <>
      {/* ========================================== */}
      {/* WIDE DESKTOP NAVIGATION BAR                */}
      {/* ========================================== */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* Changed from max-w-7xl to w-full with wider padding to fix the "too much inside" issue */}
        <div className="w-full px-4 md:px-8 lg:px-12">
          {/* Taller navbar (h-20) for better breathing room */}
          <div className="flex justify-between h-20 items-center">
            
            {/* LEFT: BRAND & DESKTOP LINKS */}
            <div className="flex items-center gap-10">
              
              {/* Brand Logo - Mix of Black and Orange */}
              <div 
                className="flex-shrink-0 flex items-center gap-2 cursor-pointer group"
                onClick={() => navigate("/dashboard")}
              >
                <div className="bg-gray-900 p-2.5 rounded-xl group-hover:bg-black transition shadow-sm">
                  <Ship className="h-6 w-6 text-[#EF7D00]" />
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  Freight<span className="text-[#EF7D00]">OS</span>
                </span>
              </div>

              {/* Desktop Links */}
              <div className="hidden md:flex space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                      isActive(item.path) 
                        ? "bg-orange-50 text-[#EF7D00] shadow-sm ring-1 ring-orange-100" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.path) ? "text-[#EF7D00]" : "text-gray-400"}`} />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* RIGHT: ACTIONS & USER PROFILE */}
            <div className="flex items-center gap-4 md:gap-6">
              
              {/* Create Request Button (Org Only) */}
              {!isVendor && (
                <button
                  onClick={() => navigate("/create-rfq")}
                  className="hidden md:flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md hover:shadow-lg active:scale-95"
                  style={{ background: "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)" }}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>New Tender</span>
                </button>
              )}

              {/* Notification Bell */}
              <button className="hidden md:block relative p-2 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition text-gray-500">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
              </button>

              <div className="hidden md:block h-8 w-px bg-gray-200"></div>

              {/* User Dropdown Profile */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-xl border border-transparent hover:border-gray-200 transition"
                >
                  <div className="h-10 w-10 rounded-xl text-white flex items-center justify-center font-black text-sm shadow-sm" style={{ background: "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)" }}>
                    {userInitial}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-gray-900 leading-none">{user?.username || "User"}</div>
                    <div className="text-[10px] text-[#EF7D00] uppercase mt-1 tracking-widest font-black">
                      {isVendor ? "Carrier" : "Shipper"}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
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
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-2.5 text-sm font-black hover:bg-red-50 flex items-center gap-3 text-red-600"
                    >
                      <LogOut className="h-4 w-4" /> Secure Logout
                    </button>
                  </div>
                )}
              </div>

              {/* MOBILE MENU TOGGLE */}
              <button
                className="md:hidden p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition text-gray-700"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* MOBILE OFFCANVAS SIDEBAR DRAWER            */}
      {/* ========================================== */}
      
      {/* Backdrop Overlay */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setMobileNavOpen(false)}
        ></div>
      )}

      {/* Sidebar Drawer Container (280px wide) */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[280px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="h-20 flex justify-between items-center px-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 font-black text-xl text-gray-900">
            <Ship className="h-6 w-6 text-[#EF7D00]" /> FreightOS
          </div>
          <button
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shadow-sm hover:bg-gray-50"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Profile Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-5">
             <div className="h-12 w-12 rounded-xl text-white flex items-center justify-center font-black text-xl shadow-sm" style={{ background: "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)" }}>
                {userInitial}
              </div>
              <div>
                <p className="text-base font-black text-gray-900 leading-tight">{user?.username || "User"}</p>
                <p className="text-xs font-bold text-[#EF7D00] uppercase mt-1 tracking-wider">{isVendor ? "Carrier" : "Shipper"}</p>
              </div>
          </div>
          {!isVendor && (
            <button
              onClick={() => { setMobileNavOpen(false); navigate("/create-rfq"); }}
              className="w-full flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl text-sm font-bold transition shadow-md"
              style={{ background: "linear-gradient(135deg, #EF7D00 0%, #D96F00 100%)" }}
            >
              <PlusCircle className="h-4 w-4" /> New Tender Request
            </button>
          )}
        </div>

        {/* Drawer Links */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <div className="px-6 text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Main Menu</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center gap-3 px-6 py-3.5 mx-3 rounded-xl mb-1 text-sm font-bold transition-colors ${
                isActive(item.path) 
                  ? "bg-orange-50 text-[#EF7D00]" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive(item.path) ? "text-[#EF7D00]" : "text-gray-400"}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Drawer Footer / Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => { setMobileNavOpen(false); handleLogout(); }}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut className="h-5 w-5" /> Secure Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;