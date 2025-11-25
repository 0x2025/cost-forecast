import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HelpPanelProps {
    onClose: () => void;
}

export function HelpPanel({ onClose }: HelpPanelProps) {
    const [content, setContent] = useState<string>('Loading guide...');

    useEffect(() => {
        fetch('/dsl_guide.md')
            .then(res => res.text())
            .then(text => setContent(text))
            .catch(err => setContent('Failed to load guide: ' + err.message));
    }, []);

    return (
        <div className="absolute top-0 right-0 bottom-0 w-[500px] bg-white shadow-2xl z-30 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 flex items-center justify-center rounded-full">
                        <span className="text-white font-serif font-bold text-lg">?</span>
                    </div>
                    <h3 className="font-serif font-semibold text-lg text-slate-900">DSL Reference Guide</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6 prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-a:text-blue-600 prose-code:text-pink-600 prose-pre:bg-slate-900 prose-pre:text-slate-50">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
        </div>
    );
}
