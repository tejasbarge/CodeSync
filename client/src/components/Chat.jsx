import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ socketRef, roomId, username, messages, setMessages }) => {
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const messageData = {
            roomId,
            username,
            text: messageInput.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        socketRef.current.emit('SEND_MESSAGE', messageData);
        setMessages((prev) => [...prev, { ...messageData, self: true }]);
        setMessageInput('');
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] w-80 shrink-0 z-10 transition-all duration-300">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] shadow-sm">
                <h3 className="text-gray-200 font-bold tracking-widest uppercase text-xs">Room Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="text-gray-500 text-center text-sm mt-10 italic">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.self ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-gray-500 mb-1 font-semibold">{msg.self ? 'You' : msg.username} • {msg.time}</span>
                            <div className={`px-3 py-2 rounded-lg max-w-[85%] break-words text-sm shadow-md ${msg.self ? 'bg-[var(--color-accent)] text-black rounded-br-none font-medium' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex gap-2">
                <input 
                    type="text" 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type message..."
                    maxLength={500}
                    className="flex-1 bg-gray-800 text-[var(--text-main)] px-3 py-2 rounded-md outline-none focus:ring-1 focus:ring-[#4aee88] placeholder-gray-500 text-sm transition-shadow"
                />
                <button type="submit" className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-black px-3 py-2 rounded-md font-bold transition-colors text-sm shadow-sm active:translate-y-px">
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
