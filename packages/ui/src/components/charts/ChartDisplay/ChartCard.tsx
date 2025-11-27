import React, { useState } from 'react';

interface ChartCardProps {
    title: string;
    onDelete: () => void;
    onTitleChange?: (newTitle: string) => void;
    children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, onDelete, onTitleChange, children }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(title);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentTitle !== title && onTitleChange) {
            onTitleChange(currentTitle);
        }
    };

    return (
        <div className="bg-white border border-slate-900 shadow-sm p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                {isEditing ? (
                    <input
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                        autoFocus
                        className="font-serif font-semibold text-base border-b-2 border-slate-900 outline-none w-full mr-2"
                    />
                ) : (
                    <h3
                        className="font-serif font-semibold text-base cursor-pointer hover:text-slate-600 truncate mr-2"
                        onClick={() => setIsEditing(true)}
                        title="Click to edit title"
                    >
                        {title}
                    </h3>
                )}
                <button
                    onClick={onDelete}
                    className="text-slate-300 hover:text-red-600 transition-colors"
                    title="Remove chart"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 min-h-[250px] w-full">
                {children}
            </div>
        </div>
    );
};
