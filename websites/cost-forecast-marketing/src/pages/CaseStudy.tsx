import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Download } from 'lucide-react';

const scenarioData = [
    { month: 'Jan', Base: 100, Optimistic: 95, Pessimistic: 105 },
    { month: 'Feb', Base: 102, Optimistic: 96, Pessimistic: 108 },
    { month: 'Mar', Base: 105, Optimistic: 98, Pessimistic: 115 },
    { month: 'Apr', Base: 104, Optimistic: 97, Pessimistic: 118 },
    { month: 'May', Base: 108, Optimistic: 99, Pessimistic: 125 },
    { month: 'Jun', Base: 110, Optimistic: 100, Pessimistic: 130 },
    { month: 'Jul', Base: 112, Optimistic: 101, Pessimistic: 135 },
    { month: 'Aug', Base: 115, Optimistic: 102, Pessimistic: 140 },
];

const sensitivityData = [
    { name: 'Energy Price', impact: 85, color: '#b45309' }, // Gold
    { name: 'Logistics', impact: 65, color: '#0f766e' },    // Teal
    { name: 'Raw Material', impact: 45, color: '#0052cc' }, // Blue
    { name: 'Labor', impact: 25, color: '#020617' },        // Navy
];

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

                {/* Visuals / Charts */}
                <div className="space-y-16">

                    {/* Scenario Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-executive-navy">Cost Projection Scenarios (2025)</h3>
                                <p className="text-slate-500 text-sm mt-1">Projected unit cost ($) under varying market conditions</p>
                            </div>
                            <div className="flex space-x-4 text-sm">
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Pessimistic</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-executive-blue mr-2"></div> Base</div>
                                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-teal-accent mr-2"></div> Optimistic</div>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scenarioData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                    />
                                    <Line type="monotone" dataKey="Pessimistic" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Base" stroke="#0052cc" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Optimistic" stroke="#0f766e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sensitivity Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-executive-navy">Sensitivity Analysis: Impact on Margin</h3>
                            <p className="text-slate-500 text-sm mt-1">Relative impact of key cost drivers on final product margin (Basis Points)</p>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sensitivityData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#020617', fontWeight: 500, fontSize: 14 }} width={120} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={32}>
                                        {sensitivityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
