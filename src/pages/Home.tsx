import React from 'react';
import { NavLink } from 'react-router-dom';

export function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8">
            <h1 className="text-4xl font-bold text-gray-800">Boas-vindas ao ScientiaGen</h1>
            <p className="text-xl text-gray-600 max-w-2xl">
                Sua plataforma de estudos inteligente, potencializada pela API Gemini. 
                Crie materiais de estudo interativos, desde flashcards e quizzes a soluções guiadas.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-4xl">
                <FeatureCard 
                    to="/learn"
                    title="Modo Aprender" 
                    desc="Teste seus conhecimentos com quizzes gerados por IA."
                    icon="🧠"
                />
                <FeatureCard 
                    to="/flashcards"
                    title="Cartões de Estudo" 
                    desc="Memorize conceitos com flashcards interativos."
                    icon="🃏"
                />
                <FeatureCard 
                    to="/guided"
                    title="Aprendizagem Guiada" 
                    desc="Receba ajuda passo a passo para resolver problemas."
                    icon="🎓"
                />
            </div>
        </div>
    );
}

function FeatureCard({ title, desc, icon, to }: { title: string, desc: string, icon: string, to: string }) {
    return (
        <NavLink to={to} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4 group">
            <span className="text-4xl mb-2">{icon}</span>
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-gray-600">{desc}</p>
        </NavLink>
    );
}
