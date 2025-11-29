import type { LucideIcon } from 'lucide-react';

interface PlaygroundTab {
    id: string;
    name: string;
    icon: LucideIcon;
}

interface PlaygroundSelectorProps {
    tabs: PlaygroundTab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const PlaygroundSelector = ({ tabs, activeTab, onTabChange }: PlaygroundSelectorProps) => {
    return (
        <div className="border-b border-slate-200 overflow-x-auto">
            <div className="flex space-x-1 min-w-max px-4 sm:px-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                flex items-center space-x-2 px-6 py-4 border-b-2 transition-all
                ${isActive
                                    ? 'border-executive-blue text-executive-blue font-semibold'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }
              `}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-executive-blue' : 'text-slate-400'}`} />
                            <span className="whitespace-nowrap">{tab.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
