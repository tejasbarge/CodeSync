import React from 'react';

const Client = ({ username, isSelf }) => {
    return (
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-black font-bold text-lg shrink-0">
                {username.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-gray-200 font-medium truncate">
                {username} {isSelf && <span className="text-xs text-gray-500 ml-1">(You)</span>}
            </span>
        </div>
    );
};

export default Client;
