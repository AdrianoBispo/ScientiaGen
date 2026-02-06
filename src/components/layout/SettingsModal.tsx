import React, { useState, useEffect } from 'react';
import { X, User, Palette, SlidersHorizontal, Trash2, Save, Loader2, CheckCircle, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { updateProfile } from 'firebase/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'profile' | 'appearance' | 'exercises' | 'data';

const SETTINGS_KEY = 'scientiagen_settings';

export interface AppSettings {
  defaultDifficulty: 'easy' | 'medium' | 'hard';
  defaultQuestionCount: number;
  animationsEnabled: boolean;
}

const defaultSettings: AppSettings = {
  defaultDifficulty: 'medium',
  defaultQuestionCount: 5,
  animationsEnabled: true,
};

export function getAppSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return defaultSettings;
}

function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Exercise settings state
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());

  // Data state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser?.displayName || '');
      setSettings(getAppSettings());
      setProfileSuccess(false);
      setProfileError('');
      setShowClearConfirm(false);
      setClearSuccess(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  async function handleSaveProfile() {
    if (!currentUser) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setProfileError('O nome não pode estar vazio.');
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      await updateProfile(currentUser, { displayName: trimmed });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setProfileLoading(false);
    }
  }

  function handleSaveExerciseSettings() {
    saveAppSettings(settings);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  }

  function handleClearData() {
    const keysToKeep = ['theme', SETTINGS_KEY];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    setShowClearConfirm(false);
    setClearSuccess(true);
    setTimeout(() => setClearSuccess(false), 3000);
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Perfil', icon: <User size={18} /> },
    { id: 'appearance', label: 'Aparência', icon: <Palette size={18} /> },
    { id: 'exercises', label: 'Exercícios', icon: <SlidersHorizontal size={18} /> },
    { id: 'data', label: 'Dados', icon: <Trash2 size={18} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Personalize sua experiência no ScientiaGen.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-700 px-6 gap-1 shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Nome de exibição
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  E-mail
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
                  {currentUser?.email || '—'}
                </div>
              </div>

              {profileError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  {profileError}
                </div>
              )}

              {profileSuccess && activeTab === 'profile' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle size={16} />
                  Perfil atualizado com sucesso!
                </div>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={profileLoading}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {profileLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar
              </button>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                  Tema
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { if (theme === 'dark') toggleTheme(); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <Sun size={24} className={theme === 'light' ? 'text-blue-600' : 'text-gray-400 dark:text-slate-500'} />
                    <span className={`text-sm font-medium ${theme === 'light' ? 'text-blue-600' : 'text-gray-600 dark:text-slate-400'}`}>
                      Claro
                    </span>
                  </button>
                  <button
                    onClick={() => { if (theme === 'light') toggleTheme(); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <Moon size={24} className={theme === 'dark' ? 'text-blue-400' : 'text-gray-400 dark:text-slate-500'} />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}>
                      Escuro
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Animações</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Ativar animações e transições na interface</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSettings = { ...settings, animationsEnabled: !settings.animationsEnabled };
                    setSettings(newSettings);
                    saveAppSettings(newSettings);
                  }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    settings.animationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Exercises Tab */}
          {activeTab === 'exercises' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Dificuldade padrão
                </label>
                <select
                  value={settings.defaultDifficulty}
                  onChange={(e) => setSettings({ ...settings, defaultDifficulty: e.target.value as AppSettings['defaultDifficulty'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Dificuldade que será selecionada por padrão ao iniciar um exercício.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Quantidade padrão de questões
                </label>
                <input
                  type="number"
                  value={settings.defaultQuestionCount}
                  onChange={(e) => setSettings({ ...settings, defaultQuestionCount: Math.max(1, Math.min(20, Number(e.target.value))) })}
                  min={1}
                  max={20}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Número de questões que será usado por padrão (1–20).
                </p>
              </div>

              {profileSuccess && activeTab === 'exercises' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle size={16} />
                  Configurações salvas!
                </div>
              )}

              <button
                onClick={handleSaveExerciseSettings}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
              >
                <Save size={18} />
                Salvar configurações
              </button>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Limpar dados locais
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Remove todos os dados salvos localmente (histórico, quizzes salvos, etc.). 
                  Dados sincronizados com sua conta na nuvem não serão afetados.
                </p>
              </div>

              {clearSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle size={16} />
                  Dados locais removidos com sucesso!
                </div>
              )}

              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  Limpar dados locais
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">
                    Tem certeza? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleClearData}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
