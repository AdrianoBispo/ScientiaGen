import React from 'react';
import { Quiz } from '../components/Quiz';

export function Learn() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-gray-800">Modo Aprender</h1>
            <p className="text-gray-600">Responda às perguntas e receba feedback instantâneo da IA.</p>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <Quiz />
            </div>
        </div>
    );
}
