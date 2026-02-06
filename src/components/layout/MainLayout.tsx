import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

export function MainLayout() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 flex">
            <Sidebar />
            <div className="flex-1 ml-0 sm:ml-20 transition-all duration-300 w-full flex flex-col">
                <Header />
                <div className="p-4 sm:p-8 pb-20 sm:pb-8">
                    <div id="contentWrapper" className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
