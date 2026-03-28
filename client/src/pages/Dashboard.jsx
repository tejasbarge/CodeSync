import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

const Dashboard = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (!storedUser || !token) {
                console.log('No auth found, redirecting to login');
                navigate('/login');
                return;
            }

            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                fetchRooms(token);
            } catch (err) {
                console.error('Error parsing user data:', err);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    const fetchRooms = async (token) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            if (!backendUrl) {
                console.warn('VITE_BACKEND_URL is not defined in .env');
            }
            
            const response = await api.get('/api/rooms/user');
            console.log('Fetched rooms:', response.data);
            setRooms(response.data);
        } catch (err) {
            console.error('Fetch rooms error:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out');
        navigate('/login');
    };

    const openRoom = (roomId) => {
        if (!user) return;
        navigate(`/editor/${roomId}`, {
            state: { username: user.username }
        });
    };

    const deleteRoom = async (e, roomId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this room?')) return;

        try {
            await api.delete(`/api/rooms/${roomId}`);
            toast.success('Room deleted');
            setRooms(rooms.filter(room => room.roomId !== roomId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete room');
        }
    };

    const currentUserId = user?.id || user?._id;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-10 border-b border-[var(--border-color)] pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-1">
                            Code<span className="text-[var(--color-accent)]">Sync</span> Dashboard
                        </h1>
                        <p className="text-[var(--text-muted)]">Welcome back, <span className="text-[var(--color-accent)] font-semibold">{user?.username}</span></p>
                    </div>
                    <div className="flex gap-4">
                        <ThemeToggle />
                        <button 
                            onClick={() => navigate('/')}
                            className="bg-[var(--color-accent)] text-black font-bold px-6 py-2 rounded-md hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/10"
                        >
                            + New Room
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="bg-gray-700 text-[var(--text-main)] font-bold px-6 py-2 rounded-md hover:bg-gray-600 transition-all border border-gray-600"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-64 flex-col gap-4">
                        <div className="w-10 h-10 border-4 border-[#4aee88] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 animate-pulse text-sm">Loading your workspaces...</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-color)] shadow-xl">
                        <div className="mb-6 opacity-20">
                            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-xl text-[var(--text-muted)] mb-4 font-medium">No active rooms found</h3>
                        <button 
                            onClick={() => navigate('/')}
                            className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[#4aee88] px-8 py-3 rounded-md hover:bg-[var(--color-accent)] hover:text-black transition-all font-bold"
                        >
                            Create or Join a Room
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <div 
                                key={room.roomId}
                                onClick={() => openRoom(room.roomId)}
                                className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl hover:border-[#4aee88] transition-all cursor-pointer group relative shadow-lg hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] group-hover:border-[var(--color-accent)]/30 transition-colors">
                                        <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-widest">{room.language}</span>
                                    </div>
                                    {room.creator === currentUserId && (
                                        <button 
                                            onClick={(e) => deleteRoom(e, room.roomId)}
                                            className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                            title="Delete Room"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">{room.name || 'Untitled Room'}</h3>
                                <p className="text-gray-500 text-[10px] font-mono mb-4 break-all opacity-40">ID: {room.roomId}</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-color)]/50">
                                    <span className="text-xs text-gray-500 italic">Updated {new Date(room.updatedAt).toLocaleDateString()}</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <span className="text-[10px] text-[var(--color-accent)] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Open</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
