import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import RFQList from './pages/rfq/RFQList';
import RFQForm from './pages/rfq/RFQForm';
import RFQDetail from './pages/rfq/RFQDetail'; // <--- Ensure this import exists

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-4">Loading...</div>;
    
    // If no user, kick them to login
    if (!user) return <Navigate to="/login" />;
    
    return children;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />

            {/* RFQ List Route */}
            <Route 
                path="/rfq-list" 
                element={
                    <ProtectedRoute>
                        <RFQList />
                    </ProtectedRoute>
                } 
            />

            {/* Create RFQ Page */}
            <Route 
                path="/create-rfq" 
                element={
                    <ProtectedRoute>
                        <RFQForm />
                    </ProtectedRoute>
                } 
            />

            {/* --- FIX: USE THE COMPONENT, NOT THE PLACEHOLDER --- */}
            <Route 
                path="/rfq/:id" 
                element={
                    <ProtectedRoute>
                        <RFQDetail />
                    </ProtectedRoute>
                } 
            />

            {/* Default Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

export default App;