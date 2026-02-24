import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import RFQList from "./pages/rfq/RFQList";
import RFQForm from "./pages/rfq/RFQForm";
import RFQDetail from "./pages/rfq/RFQDetail";
import MyBids from "./pages/vendor/MyBids";

// 🔒 GATEKEEPER 1: Protects Dashboard, RFQs, etc.
// If not logged in, kicks you to Login.
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!user) {
    // Redirect to login, but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// 🔓 GATEKEEPER 2: Protects Login Page
// If already logged in, kicks you to Dashboard (so you can't go back to login)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rfq-list"
        element={
          <ProtectedRoute>
            <RFQList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-rfq"
        element={
          <ProtectedRoute>
            <RFQForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rfq/:id"
        element={
          <ProtectedRoute>
            <RFQDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-bids"
        element={
          <ProtectedRoute>
            <MyBids />
          </ProtectedRoute>
        }
      />

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
