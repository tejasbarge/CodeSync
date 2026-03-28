import React, { useState, useEffect } from 'react';
import api from '../api';
import ReactMarkdown from 'react-markdown';

const OutputPanel = ({ output, isRunning, onClose, status, time, memory, code, language }) => {
    const [aiExplanation, setAiExplanation] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    // Reset AI state whenever a new execution happens
    useEffect(() => {
        setAiExplanation('');
        setAiError('');
        setIsAiLoading(false);
    }, [output]);

    const hasError = status && status !== 'Accepted';

    const fixWithAI = async () => {
        setIsAiLoading(true);
        setAiExplanation('');
        setAiError('');
        try {
            const response = await api.post('/api/ai/fix', { code, error: output, language });
            setAiExplanation(response.data.explanation);
        } catch (err) {
            console.error('AI fix error:', err);
            const msg = err.response?.data?.message || err.message || 'Unknown error';
            setAiError(`AI Error: ${msg}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="h-72 bg-[var(--bg-main)] border-t border-[var(--border-color)] flex flex-col shadow-2xl z-10 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-2 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">Output</span>
                    {status && !isRunning && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            status === 'Accepted'
                                ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                                : 'bg-red-500/20 text-red-400'
                        }`}>
                            {status}
                        </span>
                    )}
                    {time && !isRunning && <span className="text-[10px] text-gray-500 font-mono">{time}s</span>}
                    {memory && !isRunning && <span className="text-[10px] text-gray-500 font-mono">{Math.round(memory / 1024)}MB</span>}
                    {isRunning && (
                        <div className="flex gap-1 items-center animate-pulse">
                            <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full"></span>
                            <span className="text-[10px] text-[var(--color-accent)] font-semibold italic">Executing...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Fix with AI button — toggles to View Raw Error when AI is active */}
                    {hasError && !isRunning && (
                        (isAiLoading || aiExplanation || aiError) ? (
                            <button
                                onClick={() => {
                                    setAiExplanation('');
                                    setAiError('');
                                    setIsAiLoading(false);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all border bg-gray-800 border-[var(--border-color)] text-gray-300 hover:bg-gray-700 hover:text-[var(--text-main)]"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                View Raw Error
                            </button>
                        ) : (
                            <button
                                onClick={fixWithAI}
                                disabled={isAiLoading}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all border ${
                                    isAiLoading
                                        ? 'bg-gray-700 border-gray-600 text-[var(--text-muted)] cursor-not-allowed'
                                        : 'bg-purple-600/20 border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-[var(--text-main)]'
                                }`}
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Fix with AI
                            </button>
                        )
                    )}
                    <button onClick={() => { onClose(); setAiExplanation(''); }} className="text-gray-500 hover:text-[var(--text-main)] transition-colors text-sm font-bold">✕</button>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {(isAiLoading || aiExplanation || aiError) ? (
                    <div className="p-4 min-h-full bg-purple-900/10 border-l-2 border-purple-500">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">AI Analysis</span>
                        </div>
                        {isAiLoading ? (
                            <div className="flex gap-1 items-center">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                <span className="text-purple-400 text-xs ml-2 italic">Analyzing your code...</span>
                            </div>
                        ) : aiError ? (
                            <p className="text-red-400 text-xs font-mono">{aiError}</p>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300 text-sm leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        code: ({ node, inline, children, ...props }) => (
                                            inline
                                                ? <code className="bg-gray-800 px-1 py-0.5 rounded text-purple-300 font-mono text-xs" {...props}>{children}</code>
                                                : <pre className="bg-[#1a1a2e] border border-purple-800/40 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">
                                                    <code className="text-gray-300" {...props}>{children}</code>
                                                  </pre>
                                        ),
                                        p: ({ children }) => <p className="mb-2 text-gray-300">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 text-gray-300">{children}</ul>,
                                        li: ({ children }) => <li className="mb-1">{children}</li>,
                                        strong: ({ children }) => <strong className="text-purple-300 font-bold">{children}</strong>,
                                    }}
                                >
                                    {aiExplanation}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4">
                        {!output && !isRunning ? (
                            <div className="text-gray-600 italic text-sm">Click "Run Code" to see the output here...</div>
                        ) : (
                            <pre className={`whitespace-pre-wrap text-sm font-mono leading-relaxed ${
                                hasError ? 'text-red-400' : 'text-gray-300'
                            }`}>
                                {output}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
