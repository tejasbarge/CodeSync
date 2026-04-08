import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { initSocket } from '../socket';
import api from '../api';
import Client from '../components/Client';
import Editor from '../components/Editor';
import Chat from '../components/Chat';
import ThemeToggle from '../components/ThemeToggle';
import OutputPanel from '../components/OutputPanel';

const EditorPage = () => {
    const socketRef = React.useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    
    // UI State for Editor Layout
    const [clients, setClients] = useState([]);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('// Write your code here...');
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // Extracted Chat State
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Execution State
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isOutputOpen, setIsOutputOpen] = useState(false);
    const [executionMetadata, setExecutionMetadata] = useState({ status: '', time: '', memory: '' });
    
    // Runtime Input State
    const [stdin, setStdin] = useState('');
    const [isInputOpen, setIsInputOpen] = useState(false);
    // Persistence State
    const [syncStatus, setSyncStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
    const [initialLoad, setInitialLoad] = useState(true);
    const codeRef = React.useRef('// Write your code here...');
    const languageRef = React.useRef('javascript');
    const isChatOpenRef = React.useRef(false);

    const toggleChat = () => {
        setIsChatOpen((prev) => {
            const newState = !prev;
            isChatOpenRef.current = newState;
            if (newState) {
                setUnreadCount(0); // Reset unread when opening chat
            }
            return newState;
        });
    };

    useEffect(() => {
        // Auth Check
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            reactNavigator('/login');
            return;
        }

        const init = async () => {
            // Fetch initial room state from DB — join if exists, create if not
            try {
                const roomName = location.state?.roomName || 'Untitled Room';
                let response;

                try {
                    // Try to join existing room first
                    response = await api.get(`/api/rooms/${roomId}`);
                } catch (err) {
                    if (err.response?.status === 404) {
                        // Room doesn't exist — create it
                        response = await api.post('/api/rooms/create', { roomId, name: roomName });
                    } else {
                        throw err; // rethrow unexpected errors
                    }
                }

                if (response.data) {
                    const savedCode = response.data.code || '// Write your code here...';
                    const savedLanguage = response.data.language || 'javascript';

                    setCode(savedCode);
                    codeRef.current = savedCode;
                    setLanguage(savedLanguage);
                    languageRef.current = savedLanguage;
                    setInitialLoad(false);
                }
            } catch (err) {
                console.error('Failed to fetch/create room:', err);
                toast.error('Could not load room. Please try again.');
                setInitialLoad(false);
            }


            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit('JOIN', {
                roomId,
                username: location.state?.username,
            });

            // Listen for joined event
            socketRef.current.on('JOINED', ({ clients: connectedClients, username, socketId }) => {
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room.`);
                    console.log(`${username} joined`);

                    socketRef.current.emit('SYNC_STATE', {
                        socketId,
                        code: codeRef.current,
                        language: languageRef.current,
                    });
                }
                setClients(connectedClients);
            });

            // Listen for code changes from network
            socketRef.current.on('CODE_CHANGE', ({ code: newCode }) => {
                if (newCode !== null) {
                    setCode(newCode);
                    codeRef.current = newCode;
                }
            });

            // Listen for global chat payload
            socketRef.current.on('RECEIVE_MESSAGE', (messageData) => {
                setMessages((prev) => [...prev, messageData]);
                if (!isChatOpenRef.current) {
                    setUnreadCount((prev) => prev + 1);
                }
            });

            // Listen for code execution result
            socketRef.current.on('CODE_RESULT', ({ output: resultOutput, success, username, status, time, memory }) => {
                const isSelf = username === location.state?.username;
                setOutput(resultOutput);
                setIsRunning(false);
                setExecutionMetadata({ status, time, memory });
                toast.dismiss('execution-toast');
                
                if (success) {
                    toast.success(`Execution completed by ${isSelf ? 'you' : username}`);
                } else {
                    toast.error(`Execution failed for ${isSelf ? 'you' : username}`);
                }
            });

            // Listen for code running
            socketRef.current.on('CODE_RUNNING', ({ username }) => {
                setIsRunning(true);
                setIsOutputOpen(true);
                setOutput('');
                setExecutionMetadata({ status: '', time: '', memory: '' });
                if (username !== location.state?.username) {
                    toast.loading(`${username} is running the code...`, { id: 'execution-toast', duration: 2000 });
                }
            });

            // Listen for language changes from network
            socketRef.current.on('LANGUAGE_CHANGE', ({ language: newLanguage }) => {
                if (newLanguage !== null) {
                    setLanguage(newLanguage);
                    languageRef.current = newLanguage;
                    toast.success(`Language changed to ${newLanguage}`);
                }
            });

            // Sync full state for new joins
            socketRef.current.on('SYNC_STATE', ({ code: newCode, language: newLanguage }) => {
                if (newCode !== null) {
                    setCode(newCode);
                    codeRef.current = newCode;
                }
                if (newLanguage !== null) {
                    setLanguage(newLanguage);
                    languageRef.current = newLanguage;
                }
            });

            // Listen for disconnected
            socketRef.current.on('DISCONNECTED', ({ socketId, username }) => {
                toast.success(`${username} left the room.`);
                setClients((prev) => {
                    return prev.filter((client) => client.socketId !== socketId);
                });
            });
        };
        init();

        return () => {
            socketRef.current?.disconnect();
            socketRef.current?.off('JOINED');
            socketRef.current?.off('CODE_CHANGE');
            socketRef.current?.off('RECEIVE_MESSAGE');
            socketRef.current?.off('CODE_RESULT');
            socketRef.current?.off('CODE_RUNNING');
            socketRef.current?.off('LANGUAGE_CHANGE');
            socketRef.current?.off('SYNC_STATE');
            socketRef.current?.off('DISCONNECTED');
        };
    }, []);

    // Auto-Save Logic (Debounced)
    useEffect(() => {
        if (initialLoad) return;

        setSyncStatus('unsaved');
        const timeoutId = setTimeout(async () => {
            setSyncStatus('saving');
            try {
                await api.post('/api/rooms/save', {
                    roomId,
                    code,
                    language
                });
                setSyncStatus('saved');
            } catch (err) {
                console.error('Auto-save failed:', err);
                setSyncStatus('error');
            }
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [code, language, roomId, initialLoad]);

    const copyRoomId = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(roomId);
                toast.success('Room ID copied to clipboard');
            } else {
                // Fallback for insecure contexts (navigator.clipboard is only on localhost/HTTPS)
                const textArea = document.createElement('textarea');
                textArea.value = roomId;
                document.body.appendChild(textArea);
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    toast.success('Room ID copied to clipboard');
                } else {
                    toast.error('Could not copy the Room ID');
                }
            }
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    };

    const leaveRoom = () => {
        reactNavigator('/');
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        codeRef.current = newCode;
        if (socketRef.current) {
            socketRef.current.emit('CODE_CHANGE', {
                roomId,
                code: newCode,
            });
        }
    };

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        languageRef.current = newLanguage;
        toast.success(`Language changed to ${newLanguage}`);
        
        if (socketRef.current) {
            socketRef.current.emit('LANGUAGE_CHANGE', {
                roomId,
                language: newLanguage,
            });
        }
    };

    const runCode = async () => {
        setIsRunning(true);
        setIsOutputOpen(true);
        setOutput('');

        if (socketRef.current) {
            socketRef.current.emit('EXECUTE_CODE', {
                roomId,
                username: location.state?.username,
                language: language,
                code: codeRef.current,
                stdin: stdin,
            });
        } else {
            setIsRunning(false);
            setOutput('Error: Socket connection not established.');
        }
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
            {/* Sidebar Section */}
            <div className="w-64 bg-[var(--bg-card)] flex flex-col p-4 border-r border-[var(--border-color)] shadow-xl z-10 hidden md:flex">
                <div className="mb-6 border-b border-gray-600 pb-4">
                    <h1 className="text-2xl font-extrabold tracking-wide text-[var(--text-main)] cursor-default">
                        Code<span className="text-[var(--color-accent)]">Sync</span>
                    </h1>
                </div>
                
                <h3 className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3 font-semibold">
                    Connected Users
                </h3>
                
                <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                    {clients.map((client) => (
                        <Client 
                            key={client.socketId} 
                            username={client.username} 
                            isSelf={client.username === location.state?.username} 
                        />
                    ))}
                </div>
                
                <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-[var(--border-color)]">
                    <button 
                        onClick={copyRoomId}
                        className="bg-gray-100 text-black font-bold py-2.5 rounded-md hover:bg-white transition-colors tracking-wide"
                    >
                        Copy Room ID
                    </button>
                    <button 
                        onClick={leaveRoom}
                        className="bg-red-500 text-[var(--text-main)] font-bold py-2.5 rounded-md hover:bg-red-600 transition-colors tracking-wide"
                    >
                        Leave Room
                    </button>
                    <div className="flex justify-center my-1 border-t border-[var(--border-color)] pt-3">
                        <ThemeToggle />
                    </div>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            toast.success('Logged out');
                            reactNavigator('/login');
                        }}
                        className="text-xs text-gray-500 hover:text-red-400 underline font-semibold transition-colors uppercase tracking-widest mt-2"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Editor Section */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Toolbar */}
                <div className="h-14 bg-[var(--bg-card)] flex items-center justify-between px-6 border-b border-[var(--border-color)] shadow-sm z-0">
                    <div className="flex items-center gap-3">
                        <label className="text-[var(--text-muted)] font-medium text-sm border-r border-gray-600 pr-3">
                            Language
                        </label>
                        <select 
                            value={language}
                            onChange={handleLanguageChange}
                            className="bg-transparent text-[var(--text-main)] py-1 outline-none cursor-pointer font-semibold text-sm focus:text-[var(--color-accent)] transition-colors"
                        >
                            <option className="bg-[var(--bg-card)] text-[var(--text-main)]" value="javascript">JavaScript</option>
                            <option className="bg-[var(--bg-card)] text-[var(--text-main)]" value="python">Python</option>
                            <option className="bg-[var(--bg-card)] text-[var(--text-main)]" value="cpp">C++</option>
                            <option className="bg-[var(--bg-card)] text-[var(--text-main)]" value="java">Java</option>
                        </select>
                    </div>

                    {/* Sync Status Indicator */}
                    <div className="flex items-center gap-2 px-4 py-1 bg-[var(--bg-main)]/50 rounded-full border border-[var(--border-color)]/50">
                        <div className={`w-2 h-2 rounded-full ${
                            syncStatus === 'saved' ? 'bg-[var(--color-accent)]' : 
                            syncStatus === 'saving' ? 'bg-yellow-400 animate-pulse' : 
                            syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                            {syncStatus === 'saved' ? 'Synced' : 
                             syncStatus === 'saving' ? 'Saving...' : 
                             syncStatus === 'error' ? 'Sync Error' : 'Unsaved'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={toggleChat}
                            className={`relative px-4 py-1.5 rounded font-bold text-sm transition-all duration-300 border shadow-md active:translate-y-px ${isChatOpen ? 'bg-gray-700 text-[var(--text-main)] border-gray-600 hover:bg-gray-600' : 'bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)] border-[#2bca6a]'}`}
                        >
                            {isChatOpen ? 'Close Chat' : 'Open Chat'}
                            {!isChatOpen && unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-[var(--text-main)] font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce border-2 border-[#282a36]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setIsInputOpen(!isInputOpen)}
                            className={`px-4 py-1.5 rounded font-bold text-sm transition-all shadow-md border ${isInputOpen ? 'bg-gray-700 text-[var(--text-main)] border-gray-600' : 'bg-gray-200 text-black border-gray-300 hover:bg-white'}`}
                        >
                            {isInputOpen ? 'Hide Input' : 'Input'}
                        </button>
                        <button 
                            onClick={runCode}
                            disabled={isRunning}
                            className={`px-5 py-1.5 rounded font-bold text-sm transition-all shadow-md border-b-4 active:border-b-0 active:translate-y-1 ${isRunning ? 'bg-gray-600 border-[var(--border-color)] text-[var(--text-muted)]' : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black border-[#2bca6a]'}`}
                        >
                            {isRunning ? 'Running...' : 'Run Code'}
                        </button>
                    </div>
                </div>

                {/* Main Content Layout Wrapper */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Editor Container */}
                    <div className="flex-1 bg-[var(--bg-main)] flex flex-col min-h-0 min-w-0 relative">
                        <div className="flex-1 overflow-hidden">
                            <Editor 
                                language={language} 
                                code={code} 
                                onCodeChange={handleCodeChange} 
                            />
                        </div>
                        
                        {/* Output Panel Integration */}
                        {isOutputOpen && (
                            <OutputPanel 
                                output={output} 
                                isRunning={isRunning} 
                                onClose={() => setIsOutputOpen(false)} 
                                status={executionMetadata.status}
                                time={executionMetadata.time}
                                memory={executionMetadata.memory}
                                code={code}
                                language={language}
                            />
                        )}

                        {/* Stdin Input Panel */}
                        {isInputOpen && (
                            <div className="absolute bottom-0 left-0 right-0 h-40 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex flex-col z-10 shadow-2xl">
                                <div className="flex justify-between items-center px-4 py-2 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                                    <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest">Standard Input (stdin)</span>
                                    <button onClick={() => setIsInputOpen(false)} className="text-gray-500 hover:text-[var(--text-main)] transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <textarea
                                    className="flex-1 bg-transparent text-[var(--text-main)] p-4 outline-none resize-none font-mono text-sm"
                                    placeholder="Enter input here (e.g. for Scanner in Java)..."
                                    value={stdin}
                                    onChange={(e) => setStdin(e.target.value)}
                                ></textarea>
                            </div>
                        )}
                    </div>

                    {/* Chat Sidebar Overlay */}
                    {isChatOpen && (
                        <div className="absolute top-0 right-0 bottom-0 shadow-2xl z-20 transition-transform transform translate-x-0">
                            <Chat 
                                socketRef={socketRef} 
                                roomId={roomId} 
                                username={location.state?.username} 
                                messages={messages}
                                setMessages={setMessages}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
