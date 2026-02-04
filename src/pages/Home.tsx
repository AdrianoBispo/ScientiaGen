import React from 'react';
import { NavLink } from 'react-router-dom';
import { Brain, GalleryVerticalEnd, GraduationCap } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export function Home() {
    const features = [
        {
            to: "/learn",
            title: "Modo Aprender",
            desc: "Teste seus conhecimentos com quizzes gerados por IA.",
            icon: <Brain size={40} />
        },
        {
            to: "/flashcards",
            title: "Cartões de Estudo",
            desc: "Memorize conceitos com flashcards interativos.",
            icon: <GalleryVerticalEnd size={40} />
        },
        {
            to: "/guided",
            title: "Aprendizagem Guiada",
            desc: "Receba ajuda passo a passo para resolver problemas.",
            icon: <GraduationCap size={40} />
        }
    ];

    // Duplicating items to ensure smooth infinite loop with 3 items visible
    const carouselItems = [...features, ...features];

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8 overflow-hidden">
            <h1 className="text-4xl font-bold text-gray-800">Boas-vindas ao ScientiaGen</h1>
            <p className="text-xl text-gray-600 max-w-2xl">
                Sua plataforma de estudos inteligente, potencializada pela API Gemini. 
                Crie materiais de estudo interativos, desde flashcards e quizzes a soluções guiadas.
            </p>
            
            <div className="w-full max-w-5xl mt-8 px-4 h-96">
                <Swiper
                    modules={[Autoplay, Navigation]}
                    spaceBetween={30}
                    slidesPerView={3}
                    centeredSlides={true}
                    loop={true}
                    navigation={true}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                    }}
                    className="h-full py-10"
                >
                    {carouselItems.map((item, index) => (
                        <SwiperSlide key={index} className="flex justify-center items-center py-5">
                            {({ isActive }) => (
                                <div className={`transform transition-all duration-500 w-full max-w-sm ${
                                    isActive 
                                    ? 'scale-110 opacity-100 z-10 shadow-xl' 
                                    : 'scale-90 opacity-50 blur-[2px] pointer-events-none'
                                }`}>
                                    <FeatureCard 
                                        to={item.to}
                                        title={item.title}
                                        desc={item.desc}
                                        icon={item.icon}
                                    />
                                </div>
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
            
            <GeneralStatistics />
        </div>

    );
}

function FeatureCard({ title, desc, icon, to }: { title: string, desc: string, icon: React.ReactNode, to: string }) {
    return (
        <NavLink to={to} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4 group">
            <span className="mb-2 text-blue-600">{icon}</span>
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-gray-600">{desc}</p>
        </NavLink>
    );
}

function GeneralStatistics() {
    return (
        <div className="bg-white p-32 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Estatísticas Gerais</h1>
            <div className="flex gap-4 border-b border-gray-200 mb-4">
                <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">Histórico</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Soluções Salvas</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Meus Cartões</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Exercícios Salvos</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Relatórios</button>
            </div>
            
            <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>Nenhum item encontrado na biblioteca.</p>
            </div>
        </div>
    );
}
