import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import ThemeToggle from '../components/ThemeToggle';

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [roomName, setRoomName] = useState('');
    const [username, setUsername] = useState('');
    const [user, setUser] = useState(null);
    const [isExistingRoom, setIsExistingRoom] = useState(false);
    const [isCheckingRoom, setIsCheckingRoom] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setUsername(parsedUser.username);
        }
    }, [navigate]);

    // Debounced Room ID check
    useEffect(() => {
        if (!roomId || roomId.length < 1) {
            setIsExistingRoom(false);
            setRoomName('');
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingRoom(true);
            try {
                const response = await api.get(`/api/rooms/check/${roomId}`);
                if (response.data.exists) {
                    setIsExistingRoom(true);
                    setRoomName(response.data.name);
                    toast.success(`Found: "${response.data.name}"`, { id: 'room-check' });
                } else {
                    setIsExistingRoom(false);
                    if (isExistingRoom) setRoomName('');
                }
            } catch (err) {
                console.error('Room check failed:', err);
            } finally {
                setIsCheckingRoom(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [roomId]);

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        setIsExistingRoom(false);
        setRoomName('');
        toast.success('Generated a new room ID');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('Room ID & Username are required');
            return;
        }
        if (!isExistingRoom && !roomName.trim()) {
            toast.error('Please give your new workspace a name');
            return;
        }
        navigate(`/editor/${roomId}`, {
            state: {
                username,
                roomName: roomName.trim() || 'Untitled Room',
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') joinRoom();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-8">
            <div className="max-w-6xl mx-auto">

                {/* ── Header (matches Dashboard exactly) ── */}
                <header className="flex justify-between items-center mb-10 border-b border-[var(--border-color)] pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-1">
                            Code<span className="text-[var(--color-accent)]">Sync</span> Lobby
                        </h1>
                        <p className="text-[var(--text-muted)]">
                            Welcome back, <span className="text-[var(--color-accent)] font-semibold">{user?.username}</span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <ThemeToggle />
                        <Link
                            to="/dashboard"
                            className="bg-gray-700 text-[var(--text-main)] font-bold px-6 py-2 rounded-md hover:bg-gray-600 transition-all border border-gray-600"
                        >
                            Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-red-400 font-semibold transition-colors border border-[var(--border-color)] px-4 py-2 rounded-md hover:border-red-500"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* ── Two-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Left — Form Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 shadow-xl">

                        {/* Status badge */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className={`w-2.5 h-2.5 rounded-full ${isCheckingRoom ? 'bg-yellow-400 animate-pulse' : isExistingRoom ? 'bg-blue-400' : 'bg-[var(--color-accent)] animate-pulse'}`}></span>
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                {isCheckingRoom ? 'Verifying Room ID...' : isExistingRoom ? 'Joining Existing Room' : 'Creating New Room'}
                            </span>
                        </div>

                        <div className="flex flex-col gap-5">
                            {/* Room ID */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Room ID</label>
                                <input
                                    type="text"
                                    className="bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-lg outline-none border border-[var(--border-color)] focus:border-[var(--color-accent)] transition-colors font-mono text-xs w-full"
                                    placeholder="Paste an existing ID or generate a new one"
                                    onChange={(e) => setRoomId(e.target.value)}
                                    value={roomId}
                                    onKeyUp={handleInputEnter}
                                />
                            </div>

                            {/* Room Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    {isExistingRoom ? 'Room Name (Auto-filled)' : 'Room Name (Required)'}
                                </label>
                                <input
                                    type="text"
                                    className={`p-3 rounded-lg outline-none border transition-all w-full ${
                                        isExistingRoom
                                            ? 'bg-[#3a3d4d] text-[var(--text-muted)] border-gray-600 cursor-not-allowed italic'
                                            : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)] focus:border-[var(--color-accent)]'
                                    }`}
                                    placeholder={isExistingRoom ? '' : 'e.g. My Python Project'}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    value={roomName}
                                    onKeyUp={handleInputEnter}
                                    readOnly={isExistingRoom}
                                />
                            </div>

                            {/* Username (read-only) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Your Name</label>
                                <input
                                    type="text"
                                    className="bg-[#3a3d4d] text-[var(--text-muted)] p-3 rounded-lg outline-none border border-[var(--border-color)] cursor-not-allowed w-full"
                                    value={username}
                                    readOnly
                                />
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={joinRoom}
                                className={`w-full font-bold py-3 rounded-lg mt-2 transition-all active:scale-[0.98] shadow-lg ${
                                    isExistingRoom
                                        ? 'bg-blue-500 hover:bg-blue-600 text-[var(--text-main)] shadow-blue-500/20'
                                        : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black shadow-[#4aee88]/20'
                                }`}
                            >
                                {isExistingRoom ? 'Connect to Room' : 'Initialize Workspace →'}
                            </button>

                            <p className="text-center text-sm text-gray-500 mt-1">
                                Need a fresh ID? &nbsp;
                                <a onClick={createNewRoom} href="" className="text-[var(--color-accent)] border-b border-[#4aee88] hover:text-[#2bca6a] transition-colors">
                                    Generate New
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Right — Info / Visual hints */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold mb-4 text-[var(--text-main)]">How it works</h3>
                            <div className="flex flex-col gap-4">
                                {[
                                    { icon: '🆕', title: 'Create', desc: 'Click "Generate New", give your workspace a name, and enter the room.' },
                                    { icon: '🔗', title: 'Share', desc: 'Copy your Room ID from inside the editor and share it with collaborators.' },
                                    { icon: '🚀', title: 'Join', desc: 'Paste a friend\'s Room ID here — the name will auto-fill. Click connect!' },
                                ].map(({ icon, title, desc }) => (
                                    <div key={title} className="flex gap-4 items-start">
                                        <span className="text-2xl">{icon}</span>
                                        <div>
                                            <p className="font-bold text-[var(--text-main)] text-sm">{title}</p>
                                            <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-xl p-6 text-center shadow-xl">
                            <p className="text-gray-500 text-sm mb-3">Want to see your existing rooms?</p>
                            <Link
                                to="/dashboard"
                                className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[#4aee88] px-6 py-2.5 rounded-md hover:bg-[var(--color-accent)] hover:text-black transition-all font-bold text-sm inline-block"
                            >
                                Open Dashboard →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
