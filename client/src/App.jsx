import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const user = localStorage.getItem('user');
    if (!user) {
        return <Navigate to="/login" />;
    }
    return children;
};

function App() {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <div>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        success: {
                            theme: {
                                primary: '#4aee88',
                            },
                        },
                    }}
                ></Toaster>
            </div>

            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/editor/:roomId" 
                    element={
                        <ProtectedRoute>
                            <EditorPage />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </GoogleOAuthProvider>
    );
}

export default App;
