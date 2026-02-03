import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export function MainLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-20 p-8 transition-all duration-300 w-full">
                <div id="contentWrapper" className="max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
