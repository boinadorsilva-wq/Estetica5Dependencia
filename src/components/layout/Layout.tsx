import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useStore } from '../../store/useStore';
import { Menu, Activity } from 'lucide-react';

export const Layout = () => {
    const { user } = useStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center text-cyan-brand">
                        <Activity size={20} />
                    </div>
                    <span className="font-bold text-slate-800">GestãoFisio</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            <main className="md:ml-64 p-4 md:p-8 min-h-[calc(100vh-65px)] md:min-h-screen transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
