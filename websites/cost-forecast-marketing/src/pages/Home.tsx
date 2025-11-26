import { ArrowRight, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
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
                            New for 2025: Advanced Sensitivity Analysis
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-executive-navy mb-6 leading-tight">
                            Precision Cost Modeling for <span className="text-transparent bg-clip-text bg-gradient-to-r from-executive-blue to-teal-accent">Strategic Consultants</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Build complex cost models, run dynamic experiments, and deliver actionable insights to your B2B clients with the world's most advanced forecasting engine.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/case-study" className="px-8 py-4 bg-executive-navy text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
                                View 2025 Case Study <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <a href="#contact" className="px-8 py-4 bg-white text-executive-navy border border-slate-200 font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                                Request Access
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Target Audience / Value Prop */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-executive-navy mb-4">Why Top Consultants Choose CostVela</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Designed specifically for professional service providers who need to build, validate, and present complex economic models.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <TrendingUp className="h-8 w-8 text-executive-blue" />,
                                title: "Dynamic Experimentation",
                                description: "Don't just present static numbers. Give your clients a live model to play with. Adjust inputs, toggle scenarios, and see impacts instantly."
                            },
                            {
                                icon: <ShieldCheck className="h-8 w-8 text-teal-accent" />,
                                title: "Bank-Grade Validation",
                                description: "Our engine ensures audit-ready accuracy. Trace every calculation from input to result with our transparent dependency graph."
                            },
                            {
                                icon: <Zap className="h-8 w-8 text-gold-accent" />,
                                title: "Rapid Deployment",
                                description: "Turn weeks of Excel modeling into hours of structured development. Reuse logic across clients with our modular DSL."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300">
                                <div className="mb-6 p-3 bg-white rounded-xl inline-block shadow-sm">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-executive-navy mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-executive-navy relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-executive-blue rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-accent rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">Ready to elevate your consulting practice?</h2>
                    <p className="text-blue-100 text-lg mb-10">
                        Join the leading firms using CostVela to deliver superior value to their clients.
                    </p>
                    <button className="px-8 py-4 bg-white text-executive-navy font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
                        Start Your Free Trial
                    </button>
                </div>
            </section>
        </div>
    );
};
