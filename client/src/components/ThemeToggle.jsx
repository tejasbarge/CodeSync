import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--color-accent)] transition-all shadow-sm active:scale-95"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            {theme === 'dark' ? (
                // Sun Icon for Dark Mode (Switch to Light)
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-8.66h-1M4.34 12.34h-1m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.02 0l-.7.7M6.34 17.66l-.7.7M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
            ) : (
                // Moon Icon for Light Mode (Switch to Dark)
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
};

export default ThemeToggle;
