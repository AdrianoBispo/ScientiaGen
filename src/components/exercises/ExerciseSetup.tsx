import React from 'react';
import { Play, ArrowLeft, Settings } from 'lucide-react';

interface ConfigurationOption {
  label: string;
  value: string | number | boolean;
  type: 'select' | 'number' | 'text' | 'readonly';
  options?: { label: string; value: string | number }[]; // For select
  onChange?: (value: any) => void;
}

interface ExerciseSetupProps {
  title: string;
  description?: string;
  configurations?: ConfigurationOption[];
  onStart: () => void;
  onBack: () => void;
  startLabel?: string;
}

export function ExerciseSetup({ 
  title, 
  description, 
  configurations = [], 
  onStart, 
  onBack,
  startLabel = "Começar Agora"
}: ExerciseSetupProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          {description && <p className="text-blue-100">{description}</p>}
        </div>

        {/* Configuration Body */}
        <div className="p-6 space-y-6">
          {configurations.length > 0 && (
            <div className="space-y-4">
              {configurations.map((config, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {config.label}
                  </label>
                  
                  {config.type === 'readonly' && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100">
                      {config.value}
                    </div>
                  )}

                  {config.type === 'select' && config.options && (
                    <select 
                      value={config.value as string | number}
                      onChange={(e) => config.onChange?.(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {config.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                   
                   {/* Add other types as needed */}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg transform active:scale-[0.98]"
            >
              <Play className="w-5 h-5" />
              {startLabel}
            </button>
            
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 py-3 px-6 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}