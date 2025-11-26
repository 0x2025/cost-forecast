import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <img src="/logo.svg" alt="CostVela" className="h-8" />
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-executive-blue' : 'text-slate-600 hover:text-executive-navy'}`}>Home</Link>
                        <Link to="/case-study" className={`text-sm font-medium transition-colors ${isActive('/case-study') ? 'text-executive-blue' : 'text-slate-600 hover:text-executive-navy'}`}>Case Studies</Link>
                        <a href="#contact" className="px-4 py-2 bg-executive-navy text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
                            Book Demo
                        </a>
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-executive-navy">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-white border-b border-slate-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link to="/" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-executive-blue hover:bg-slate-50 rounded-md">Home</Link>
                        <Link to="/case-study" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-executive-blue hover:bg-slate-50 rounded-md">Case Studies</Link>
                        <a href="#contact" className="block px-3 py-2 text-base font-medium text-executive-blue font-semibold">Book Demo</a>
                    </div>
                </div>
            )}
        </nav>
    );
};

export const Footer = () => {
    return (
        <footer className="bg-executive-navy text-slate-300 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="mb-4">
                            <span className="font-serif font-bold text-xl text-white">CostVela</span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-xs">
                            Empowering consultants and enterprises with next-generation cost modeling and scenario planning intelligence.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-serif font-semibold mb-4">Solutions</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Cost Modeling</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Scenario Planning</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Risk Analysis</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-serif font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 mt-12 pt-8 text-sm text-center text-slate-500">
                    © 2025 CostVela. All rights reserved.
                </div>
            </div>
        </footer>
    );
};
