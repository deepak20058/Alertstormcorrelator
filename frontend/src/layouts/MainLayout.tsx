import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle background ambient cyber grid glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Global Header */}
        <Header />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
