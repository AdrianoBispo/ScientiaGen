import React from 'react';
import { Play, ArrowLeft, Settings } from 'lucide-react';

export interface ConfigurationOption {
  label: string;
  value: string | number | boolean;
  type: 'select' | 'number' | 'text' | 'readonly' | 'toggle';
  options?: { label: string; value: string | number }[]; // For select
  onChange?: (value: any) => void;
  min?: number; // For number
  max?: number; // For number
  step?: number; // For number
  placeholder?: string; // For text
  description?: string; // Helper text below the input
}

interface ExerciseSetupProps {
  title: string;
  description?: string;
  configurations?: ConfigurationOption[];
  onStart: () => void;
  onBack: () => void;
  startLabel?: string;
  isDisabled?: boolean;
}

export function ExerciseSetup({ 
  title, 
  description, 
  configurations = [], 
  onStart, 
  onBack,
  startLabel = "Começar Agora",
  isDisabled = false
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

                  {config.type === 'number' && (
                    <input
                      type="number"
                      value={config.value as number}
                      onChange={(e) => config.onChange?.(Number(e.target.value))}
                      min={config.min}
                      max={config.max}
                      step={config.step ?? 1}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {config.type === 'text' && (
                    <input
                      type="text"
                      value={config.value as string}
                      onChange={(e) => config.onChange?.(e.target.value)}
                      placeholder={config.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}

                  {config.type === 'toggle' && (
                    <button
                      type="button"
                      onClick={() => config.onChange?.(!config.value)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                        config.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          config.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}

                  {config.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{config.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onStart}
              disabled={isDisabled}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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