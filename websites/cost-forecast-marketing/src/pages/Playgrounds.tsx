import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { PlaygroundSelector } from '../components/playground/PlaygroundSelector';
import { PlaygroundCard } from '../components/playground/PlaygroundCard';
import { allPlaygrounds } from '../data/playgroundData';

export const Playgrounds = () => {
    const [activePlayground, setActivePlayground] = useState(allPlaygrounds[0].id);

    const currentPlayground = allPlaygrounds.find(p => p.id === activePlayground) || allPlaygrounds[0];

    const tabs = allPlaygrounds.map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon
    }));

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <section className="bg-white pt-32 pb-16 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-executive-blue text-xs font-semibold tracking-wide uppercase mb-6">
                            <Rocket className="h-3 w-3 mr-2" />
                            Interactive Demos
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-executive-navy mb-6 leading-tight">
                            Try CostVela <span className="text-transparent bg-clip-text bg-gradient-to-r from-executive-blue to-teal-accent">Live</span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            Explore 5 real-world use cases where CostVela outperforms Excel. Drag the sliders, run scenarios, and see the calculations update in real-time.
                        </p>
                    </div>
                </div>
            </section>

            {/* Tab Selector */}
            <section className="bg-white sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <PlaygroundSelector
                        tabs={tabs}
                        activeTab={activePlayground}
                        onTabChange={setActivePlayground}
                    />
                </div>
            </section>

            {/* Active Playground */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <PlaygroundCard key={currentPlayground.id} config={currentPlayground} />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-executive-navy">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                        Ready to build your own model?
                    </h2>
                    <p className="text-blue-100 text-lg mb-10">
                        These are just demo scenarios. With CostVela, you can model anything—from supply chains to SaaS pricing—without a single Excel cell.
                    </p>
                    <button className="px-8 py-4 bg-white text-executive-navy font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
                        Request Access
                    </button>
                </div>
            </section>
        </div>
    );
};
