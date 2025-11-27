import { useState, useEffect } from 'react';

interface AIGeneratorProps {
    onClose: () => void;
}

export function AIGenerator({ onClose }: AIGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [guideContent, setGuideContent] = useState('');
    const [status, setStatus] = useState<'idle' | 'generating' | 'copied'>('idle');

    useEffect(() => {
        fetch('/dsl_guide.md')
            .then(res => res.text())
            .then(text => setGuideContent(text))
            .catch(err => console.error('Failed to load guide for AI context', err));
    }, []);

    const handleGenerate = async () => {
        setStatus('generating');

        const fullPrompt = `
You are an expert in the CostVela DSL.
Use the following documentation to generate code that fulfills the user's request.

--- DSL GUIDE START ---
${guideContent}
--- DSL GUIDE END ---

User Request:
${prompt}

Generate ONLY the DSL code. Do not include markdown formatting or explanations unless asked.
`;

        try {
            await navigator.clipboard.writeText(fullPrompt);
            setStatus('copied');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('Failed to copy', err);
            setStatus('idle');
        }
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 w-[400px] bg-white shadow-2xl z-30 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="font-serif font-semibold text-lg">AI Assistant</h3>
                </div>
                <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-1">How this works:</p>
                    <p>Describe what you want to model. We'll generate a prompt optimized for ChatGPT or Claude that includes the full DSL documentation.</p>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Describe your model:</label>
                    <textarea
                        className="flex-1 w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none text-sm"
                        placeholder="E.g., I want to model a coffee shop. I sell 500 cups a day at $4 each. My rent is $2000/month. Calculate monthly profit."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || status === 'generating'}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2
            ${status === 'copied'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-slate-900 hover:bg-slate-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {status === 'copied' ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied to Clipboard!
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy Prompt for AI
                        </>
                    )}
                </button>

                <p className="text-xs text-center text-slate-400">
                    Paste the copied text into ChatGPT, Claude, or Gemini.
                </p>
            </div>
        </div>
    );
}
