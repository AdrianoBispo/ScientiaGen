import React from "react";
import { NavLink } from "react-router-dom";
import {
  Brain,
  ClipboardList,
  GalleryVerticalEnd,
  GraduationCap,
  Puzzle,
  Shuffle,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export function Home() {
  const features = [
    {
      to: "/learn",
      title: "Aprender",
      desc: "Teste seus conhecimentos com quizzes gerados por IA.",
      icon: <Brain size={40} />,
    },
    {
      to: "/test",
      title: "Testes",
      desc: "Desafie-se com testes personalizados para avaliar seu aprendizado.",
      icon: <ClipboardList size={40} />,
    },
    {
      to: "/flashcards",
      title: "Cartões de Estudo",
      desc: "Memorize conceitos com flashcards interativos.",
      icon: <GalleryVerticalEnd size={40} />,
    },
    {
      to: "/match",
      title: "Combinar",
      desc: "Melhore sua memória combinando pares relacionados.",
      icon: <Puzzle size={40} />,
    },
    {
      to: "/mixed",
      title: "Misto",
      desc: "Combine diferentes tipos de exercícios para um estudo diversificado.",
      icon: <Shuffle size={40} />,
    },
    {
      to: "/guided",
      title: "Solução Guiada",
      desc: "Receba ajuda passo a passo para resolver problemas.",
      icon: <GraduationCap size={40} />,
    },
  ];

  // Duplicating items to ensure smooth infinite loop with 3 items visible
  const carouselItems = [...features, ...features];

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[60vh] text-center gap-4 sm:gap-8 overflow-hidden">
      <style>{`
        .swiper-button-prev,
        .swiper-button-next {
          top: var(--swiper-navigation-top-offset, 50%);
          margin-top: 0;
          transform: translateY(-50%);
        }
        @media (max-width: 639px) {
          .swiper-button-prev,
          .swiper-button-next {
            display: none;
          }
        }
      `}</style>
      <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white px-2">
        Boas-vindas ao ScientiaGen
      </h1>
      <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl px-2">
        Sua plataforma de estudos inteligente, potencializada pela API Gemini.
        Crie materiais de estudo interativos, desde flashcards e quizzes a
        soluções guiadas.
      </p>

      <div className="w-full max-w-5xl mt-4 sm:mt-8 px-2 sm:px-4 h-72 sm:h-96">
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={16}
          slidesPerView={1}
          centeredSlides={true}
          loop={true}
          navigation={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
          className="h-full py-5 sm:py-10"
        >
          {carouselItems.map((item, index) => (
            <SwiperSlide
              key={index}
              className="flex justify-center items-center py-5"
            >
              {({ isActive }) => (
                <div
                  className={`transform transition-all duration-500 w-full max-w-sm ${
                    isActive
                      ? "scale-110 opacity-100 z-10 shadow-xl"
                      : "scale-90 opacity-50 blur-[2px] pointer-events-none"
                  }`}
                >
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
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
  to,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  to: string;
}) {
  return (
    <NavLink
      to={to}
      className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 sm:gap-4 group"
    >
      <span className="mb-1 sm:mb-2 text-blue-600 dark:text-blue-400">{icon}</span>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{desc}</p>
    </NavLink>
  );
}
