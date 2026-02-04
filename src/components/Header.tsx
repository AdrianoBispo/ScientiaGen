import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    Trophy, 
    Settings, 
    Moon, 
    User as UserIcon,
} from 'lucide-react';

export function Header() {
    const { currentUser, loginWithGoogle, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-20">
            {!currentUser ? (
                <button 
                    onClick={loginWithGoogle}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
                >
                    Entrar
                </button>
            ) : (
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                    >
                        {currentUser.photoURL ? (
                            <img 
                                src={currentUser.photoURL} 
                                alt={currentUser.displayName || 'User'} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <UserIcon size={20} />
                            </div>
                        )}
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            {/* User Profile Section */}
                            <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                                     {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                                            <UserIcon size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                        {currentUser.displayName || 'Usuário'}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">
                                        {currentUser.email}
                                    </p>
                                </div>
                            </div>

                            {/* Menu Items Group 1 */}
                            <div className="py-2">
                                <MenuItem icon={<Trophy size={20} />} label="Conquistas" />
                                <MenuItem icon={<Settings size={20} />} label="Configurações" />
                                <MenuItem icon={<Moon size={20} />} label="Modo escuro" />
                            </div>
                            
                            <div className="border-t border-gray-100 py-2">
                                <MenuItem label="Sair" onClick={() => {
                                    logout();
                                    setIsMenuOpen(false);
                                }} />
                            </div>

                            <div className="border-t border-gray-100 py-2">
                               <MenuItem label="Política de privacidade" />
                               <MenuItem label="Ajuda e comentários" />
                               <MenuItem label="Faça o upgrade" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}

// Helper component for menu items
function MenuItem({ icon, label, onClick }: { icon?: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full px-6 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
            {icon && <span className="text-gray-500">{icon}</span>}
            <span className={`font-medium ${!icon ? 'text-gray-600' : ''}`}>{label}</span>
        </button>
    );
}
