import { ArrowRight, FileSpreadsheet, AlertTriangle, GitBranch, CheckCircle2, Wand2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
    return (
        <div className="bg-slate-50">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 opacity-70"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-executive-blue text-xs font-semibold tracking-wide uppercase mb-6">
                            Stop Wrestling with Spreadsheets
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-executive-navy mb-6 leading-tight">
                            The End of <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Excel Hell</span> for Cost Modeling
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            You're an analyst, not a cell-formatting robot. Build robust, auditable cost models that your clients can actually trust—and play with.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/case-study" className="px-8 py-4 bg-executive-navy text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
                                See the Difference <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <a href="#contact" className="px-8 py-4 bg-white text-executive-navy border border-slate-200 font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                                Request Demo
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Excel Trap Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-executive-navy mb-4">Why Your Excel Models Are Failing You</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            We know the struggle. You spend 90% of your time checking formulas and only 10% actually analyzing data.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <FileSpreadsheet className="h-10 w-10 text-red-500" />,
                                title: "The Fragility Nightmare",
                                description: "One broken link. One accidental deletion. One hard-coded number hidden in a formula. That's all it takes to destroy your credibility with a client."
                            },
                            {
                                icon: <GitBranch className="h-10 w-10 text-orange-500" />,
                                title: "Version Control Chaos",
                                description: "Final_v2_REALLY_FINAL_copy(1).xlsx. Sound familiar? Stop emailing massive files and start treating your models like the software they are."
                            },
                            {
                                icon: <AlertTriangle className="h-10 w-10 text-amber-500" />,
                                title: "The Black Box Problem",
                                description: "Clients can't trust what they can't understand. When your logic is buried in thousands of cells, 'trust me' is your only defense."
                            }
                        ].map((pain, idx) => (
                            <div key={idx} className="p-8 rounded-2xl bg-red-50 border border-red-100 hover:shadow-lg transition-all duration-300">
                                <div className="mb-6 p-3 bg-white rounded-xl inline-block shadow-sm">{pain.icon}</div>
                                <h3 className="text-xl font-bold text-executive-navy mb-3">{pain.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{pain.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The CostVela Solution Section */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600 blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500 blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900 border border-blue-700 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-6">
                                The Better Way
                            </div>
                            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                                Logic First.<br />Numbers Second.
                            </h2>
                            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                                CostVela separates your logic from your data. Build your model structure once using our intuitive visual engine, then run infinite scenarios without breaking a thing.
                            </p>

                            <div className="space-y-6">
                                {[
                                    "Visual Dependency Graph: See exactly how every cost flows.",
                                    "Instant Sensitivity Analysis: Identify key drivers in seconds.",
                                    "Client-Ready Dashboards: Give them a slider, not a spreadsheet."
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start">
                                        <CheckCircle2 className="h-6 w-6 text-teal-400 mr-3 flex-shrink-0" />
                                        <span className="text-slate-200 text-lg">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10">
                                <Link to="/case-study" className="inline-flex items-center text-teal-400 font-semibold hover:text-teal-300 transition-colors text-lg">
                                    See how it works in our Case Study <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl blur-lg opacity-40"></div>
                            <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
                                {/* Abstract representation of the engine UI */}
                                <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="text-slate-400 text-sm font-mono">model_v1.costvela</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                        <span className="text-slate-300 font-mono">Input: Raw Materials</span>
                                        <span className="text-teal-400 font-mono font-bold">$1,200,000</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowRight className="h-5 w-5 text-slate-500 rotate-90" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                        <span className="text-slate-300 font-mono">Logic: Processing Fee (15%)</span>
                                        <span className="text-blue-400 font-mono font-bold">+ $180,000</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowRight className="h-5 w-5 text-slate-500 rotate-90" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-blue-900/30 rounded-lg border border-blue-500/50">
                                        <span className="text-white font-bold">Total Cost</span>
                                        <span className="text-white font-bold text-xl">$1,380,000</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modeling AI Section */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs font-semibold tracking-wide uppercase mb-6">
                            New Feature
                        </div>
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-executive-navy mb-6">
                            From Excel to Engine in <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Seconds</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Don't start from scratch. Upload your legacy spreadsheets and let our Modeling AI automatically translate your formulas into robust CostVela logic.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connection Line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-purple-200 to-slate-200 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            {/* Step 1 */}
                            <div className="text-center group">
                                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-xl mb-8 group-hover:-translate-y-2 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-slate-50 rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-300 -z-10"></div>
                                    <FileSpreadsheet className="h-10 w-10 text-slate-400" />
                                    <div className="absolute -bottom-3 -right-3 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm text-xs font-mono text-slate-400">.xlsx</div>
                                </div>
                                <h3 className="text-xl font-bold text-executive-navy mb-3">1. Upload Excel</h3>
                                <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
                                    Drag and drop your existing cost models. We support complex formulas and linked sheets.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center group">
                                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white border border-purple-100 shadow-xl shadow-purple-100/50 mb-8 group-hover:-translate-y-2 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-purple-50 rounded-2xl transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300 -z-10"></div>
                                    <Wand2 className="h-10 w-10 text-purple-600" />
                                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold animate-pulse">AI</div>
                                </div>
                                <h3 className="text-xl font-bold text-executive-navy mb-3">2. AI Translation</h3>
                                <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
                                    Our engine analyzes dependencies, extracts input variables, and reconstructs your logic visually.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center group">
                                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white border border-teal-100 shadow-xl shadow-teal-100/50 mb-8 group-hover:-translate-y-2 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-teal-50 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300 -z-10"></div>
                                    <Zap className="h-10 w-10 text-teal-500" />
                                </div>
                                <h3 className="text-xl font-bold text-executive-navy mb-3">3. Instant Analysis</h3>
                                <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
                                    Immediately run sensitivity analysis and scenarios on your newly minted CostVela model.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200">
                            <span className="px-3 py-1 rounded-full bg-white shadow-sm text-xs font-semibold text-slate-700 mr-3">Beta</span>
                            <span className="text-sm text-slate-600 mr-3">Modeling AI is currently available for evaluation only.</span>
                            <Link to="/contact" className="text-sm font-medium text-executive-navy hover:text-blue-600 transition-colors px-2">
                                Request Access &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-executive-navy mb-6">Ready to ditch the spreadsheet anxiety?</h2>
                    <p className="text-slate-600 text-lg mb-10">
                        Join the forward-thinking consultants who are building better models, faster.
                    </p>
                    <button className="px-8 py-4 bg-executive-navy text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg">
                        Start Your Free Trial
                    </button>
                </div>
            </section>
        </div>
    );
};
