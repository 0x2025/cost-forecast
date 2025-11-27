import { Download } from 'lucide-react';
import { ScenarioDemo } from '../components/demo/ScenarioDemo';
import { SensitivityDemo } from '../components/demo/SensitivityDemo';

export const CaseStudy = () => {
    return (
        <div className="bg-white pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-16 border-b border-slate-200 pb-12">
                    <div className="flex items-center space-x-2 text-executive-blue font-semibold uppercase tracking-wider text-sm mb-4">
                        <span>Case Study</span>
                        <span>•</span>
                        <span>Manufacturing</span>
                        <span>•</span>
                        <span>2025</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-executive-navy mb-6">
                        Navigating 2025 Supply Chain Volatility
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
                        How a global manufacturing consultancy used CostVela to model energy price shocks and identify $2.4M in potential savings for their client.
                    </p>
                </div>

                {/* Challenge & Solution Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-2xl font-serif font-bold text-executive-navy mb-4">The Challenge</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                In early 2025, energy markets faced unprecedented volatility due to new carbon taxation policies and geopolitical shifts. Our client, a Tier-1 automotive supplier, needed to understand how these fluctuations would impact their unit economics across 12 different product lines.
                            </p>
                            <p className="text-slate-600 leading-relaxed">
                                Traditional Excel models were breaking down under the complexity of multi-variable sensitivity analysis. They needed a robust, auditable way to simulate thousands of scenarios instantly.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-executive-navy mb-4">The Solution</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Using CostVela's <strong>Dynamic Graph Engine</strong>, the consultancy built a digital twin of the client's cost structure. This allowed them to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 mt-4 ml-4">
                                <li>Ingest real-time energy index futures.</li>
                                <li>Model non-linear relationships between logistics surcharges and fuel prices.</li>
                                <li>Create an interactive dashboard for the C-suite to "play" with the assumptions.</li>
                            </ul>
                        </section>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 h-fit">
                        <h3 className="text-lg font-bold text-executive-navy mb-6">Key Metrics</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="text-3xl font-serif font-bold text-executive-blue">4 Hours</div>
                                <div className="text-sm text-slate-500">Modeling time (down from 2 weeks)</div>
                            </div>
                            <div>
                                <div className="text-3xl font-serif font-bold text-teal-accent">$2.4M</div>
                                <div className="text-sm text-slate-500">Identified savings</div>
                            </div>
                            <div>
                                <div className="text-3xl font-serif font-bold text-gold-accent">1,500+</div>
                                <div className="text-sm text-slate-500">Scenarios simulated</div>
                            </div>
                        </div>
                        <button className="w-full mt-8 py-3 bg-white border border-slate-200 text-executive-navy font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center">
                            <Download className="h-4 w-4 mr-2" /> Download Full Report
                        </button>
                    </div>
                </div>


                {/* Interactive Demos - Inline as requested */}
                <div className="mt-20 pt-16 border-t-2 border-slate-200">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-serif font-bold text-executive-navy mb-4">
                            Experience CostVela in Action
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Try our interactive demos below to see how CostVela enables powerful scenario analysis and sensitivity testing.
                        </p>
                    </div>

                    {/* Scenario Demo */}
                    <ScenarioDemo />

                    {/* Sensitivity Demo */}
                    <SensitivityDemo />
                </div>

            </div>
        </div>
    );
};
