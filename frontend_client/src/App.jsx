import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// FIX 1: Implement React.lazy() so the browser only loads code for the page you are on.
// This shrinks the initial JavaScript bundle and prevents memory crashes.
const Login = React.lazy(() => import("./pages/auth/Login"));
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const RFQList = React.lazy(() => import("./pages/rfq/RFQList"));
const RFQForm = React.lazy(() => import("./pages/rfq/RFQForm"));
const RFQDetail = React.lazy(() => import("./pages/rfq/RFQDetail"));
const MyBids = React.lazy(() => import("./pages/vendor/MyBids"));

// A clean fallback UI that shows while a new page chunk is downloading
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
    <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-slate-500 font-medium">Loading...</p>
  </div>
);

// 🔒 GATEKEEPER 1: Protects Dashboard, RFQs, etc.
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// 🔓 GATEKEEPER 2: Protects Login Page
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    // FIX 2: Wrap Routes in Suspense. If you click "Back", React checks if it already 
    // downloaded the chunk. If yes, it loads instantly without crashing.
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes (Login) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Routes (Everything else) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/rfq-list" element={<ProtectedRoute><RFQList /></ProtectedRoute>} />
        <Route path="/create-rfq" element={<ProtectedRoute><RFQForm /></ProtectedRoute>} />
        <Route path="/rfq/:id" element={<ProtectedRoute><RFQDetail /></ProtectedRoute>} />
        <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;