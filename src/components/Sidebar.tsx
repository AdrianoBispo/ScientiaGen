import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Library, Brain, GalleryVerticalEnd, Puzzle, Shuffle, GraduationCap } from 'lucide-react';

export function Sidebar() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <aside 
            id="sidebar" 
            className={`
                fixed top-0 left-0 z-10 h-screen flex flex-col bg-white border-r border-gray-200 
                transition-all duration-300 ease-in-out overflow-x-hidden
                ${isHovered ? 'w-60 shadow-xl' : 'w-20'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <nav className="flex flex-col gap-2 p-3 mt-4">
                <NavItem to="/" icon={<Home size={24} />} label="Início" isHovered={isHovered} />
                <div className="border-t border-gray-100 my-2"></div>
                <NavItem to="/library" icon={<Library size={24} />} label="Biblioteca" isHovered={isHovered} />
                <NavItem to="/learn" icon={<Brain size={24} />} label="Aprender" isHovered={isHovered} />
                <NavItem to="/flashcards" icon={<GalleryVerticalEnd size={24} />} label="Cartões" isHovered={isHovered} />
                <NavItem to="/match" icon={<Puzzle size={24} />} label="Combinar" isHovered={isHovered} />
                <NavItem to="/mixed" icon={<Shuffle size={24} />} label="Misto" isHovered={isHovered} />
                <NavItem to="/guided" icon={<GraduationCap size={24} />} label="Aprendizagem Guiada" isHovered={isHovered} />
            </nav>
        </aside>
    );
}

function NavItem({ icon, label, isHovered, to }: { icon: React.ReactNode, label: string, isHovered: boolean, to: string }) {
    return (
        <NavLink 
            to={to}
            className={({ isActive }) => `
                flex items-center gap-4 p-3 rounded-lg transition-colors group
                ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'}
            `}
        >
            <span className="min-w-[24px] flex justify-center">{icon}</span>
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
