import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Brain, GalleryVerticalEnd, Puzzle, Shuffle, GraduationCap, ClipboardList } from 'lucide-react';

export function Sidebar() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside 
                id="sidebar" 
                className={`
                    hidden sm:flex
                    fixed top-0 left-0 z-30 h-screen flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
                    transition-all duration-300 ease-in-out overflow-x-hidden
                    ${isHovered ? 'w-60 shadow-xl' : 'w-20'}
                `}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <nav className="flex flex-col gap-2 p-3 mt-4 flex-1">
                    <NavItem to="/" icon={<Home size={24} />} label="Início" isHovered={isHovered} />
                    <div className="border-t border-gray-100 dark:border-slate-700 my-2"></div>
                    <NavItem to="/learn" icon={<Brain size={24} />} label="Aprender" isHovered={isHovered} />
                    <NavItem to="/test" icon={<ClipboardList size={24} />} label="Testes" isHovered={isHovered} />
                    <NavItem to="/flashcards" icon={<GalleryVerticalEnd size={24} />} label="Cartões" isHovered={isHovered} />
                    <NavItem to="/match" icon={<Puzzle size={24} />} label="Combinar" isHovered={isHovered} />
                    <NavItem to="/mixed" icon={<Shuffle size={24} />} label="Misto" isHovered={isHovered} />
                    <NavItem to="/guided" icon={<GraduationCap size={24} />} label="Solução Guiada" isHovered={isHovered} />
                </nav>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-area-bottom">
                <div className="flex items-center justify-around px-1 py-1.5">
                    <MobileNavItem to="/" icon={<Home size={20} />} label="Início" />
                    <MobileNavItem to="/learn" icon={<Brain size={20} />} label="Aprender" />
                    <MobileNavItem to="/test" icon={<ClipboardList size={20} />} label="Testes" />
                    <MobileNavItem to="/flashcards" icon={<GalleryVerticalEnd size={20} />} label="Cartões" />
                    <MobileNavItem to="/match" icon={<Puzzle size={20} />} label="Combinar" />
                    <MobileNavItem to="/mixed" icon={<Shuffle size={20} />} label="Misto" />
                    <MobileNavItem to="/guided" icon={<GraduationCap size={20} />} label="Guiada" />
                </div>
            </nav>
        </>
    );
}

function NavItem({ icon, label, isHovered, to }: { icon: React.ReactNode, label: string, isHovered: boolean, to: string }) {
    return (
        <NavLink 
            to={to}
            className={({ isActive }) => `
                flex items-center gap-4 p-3 rounded-lg transition-colors group
                ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'}
            `}
        >
            <span className="min-w-6 flex justify-center">{icon}</span>
            <span 
                className={`
                    whitespace-nowrap font-medium transition-opacity duration-200
                    ${isHovered ? 'opacity-100 delay-100' : 'opacity-0'}
                `}
            >
                {label}
            </span>
        </NavLink>
    );
}

function MobileNavItem({ icon, label, to }: { icon: React.ReactNode, label: string, to: string }) {
    return (
        <NavLink 
            to={to}
            className={({ isActive }) => `
                flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-lg transition-colors min-w-0
                ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}
            `}
        >
            {icon}
            <span className="text-[10px] font-medium leading-tight truncate max-w-[48px]">{label}</span>
        </NavLink>
    );
}
