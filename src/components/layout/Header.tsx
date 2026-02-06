import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoginModal } from '../../features/auth/components/LoginModal';
import { RegisterModal } from '../../features/auth/components/RegisterModal';
import { SettingsModal } from './SettingsModal';
import { 
    BarChart, 
    Settings, 
    Moon, 
    Sun,
    User as UserIcon,
} from 'lucide-react';

export function Header() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
        <>
            <header className="h-14 sm:h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-end px-4 sm:px-8 sticky top-0 z-20">
                {!currentUser ? (
                    <button 
                        onClick={() => setIsLoginModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
                    >
                        Entrar
                    </button>
                ) : (
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                        >
                            {currentUser.photoURL ? (
                                <img 
                                    src={currentUser.photoURL} 
                                    alt={currentUser.displayName || 'User'} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-400">
                                    <UserIcon size={20} />
                                </div>
                            )}
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-2 z-50">
                                {/* User Profile Section */}
                                <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                                         {currentUser.photoURL ? (
                                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-slate-400">
                                                <UserIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {currentUser.displayName || 'Usuário'}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                            {currentUser.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Menu Items Group 1 */}
                                <div className="py-2">
                                    <MenuItem 
                                        icon={<BarChart size={20} />} 
                                        label="Estatísticas" 
                                        onClick={() => {
                                            navigate('/statistics');
                                            setIsMenuOpen(false);
                                        }}
                                    />
                                    <MenuItem icon={<Settings size={20} />} label="Configurações" onClick={() => {
                                        setIsSettingsModalOpen(true);
                                        setIsMenuOpen(false);
                                    }} />
                                    <MenuItem 
                                        icon={theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} 
                                        label={theme === 'dark' ? "Modo claro" : "Modo escuro"}
                                        onClick={toggleTheme}
                                    />
                                </div>
                                
                                <div className="border-t border-gray-100 dark:border-slate-700 py-2">
                                    <MenuItem label="Sair" onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSwitchToRegister={() => {
                    setIsLoginModalOpen(false);
                    setIsRegisterModalOpen(true);
                }}
            />

            {/* Register Modal */}
            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onSwitchToLogin={() => {
                    setIsRegisterModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </>
    );
}

// Helper component for menu items
function MenuItem({ icon, label, onClick }: { icon?: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="w-full px-6 py-3 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
        >
            {icon && <span className="text-gray-500 dark:text-slate-400">{icon}</span>}
            <span className={`font-medium ${!icon ? 'text-gray-600 dark:text-slate-400' : ''}`}>{label}</span>
        </button>
    );
}
