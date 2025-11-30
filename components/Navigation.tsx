import React from 'react';
import { BookOpen, Mic, Image, Video, Globe, MessageCircle, Sparkles } from 'lucide-react';
import { AppMode } from '../types';

interface NavigationProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const NavButton: React.FC<{ 
  mode: AppMode; 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
  onClick: () => void;
  color: string;
}> = ({ icon, title, desc, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-lg transition-all transform hover:scale-105 hover:shadow-2xl text-white ${color} w-full h-48`}
  >
    <div className="mb-4 bg-white/20 p-4 rounded-full backdrop-blur-sm">
      {React.cloneElement(icon as React.ReactElement, { size: 40, strokeWidth: 2 })}
    </div>
    <h3 className="text-xl font-bold text-center mb-1">{title}</h3>
    <p className="text-xs opacity-90 text-center">{desc}</p>
  </button>
);

export const Navigation: React.FC<NavigationProps> = ({ setMode }) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500 mb-4 tracking-tight uppercase">
          ENGLISH OPENS DOORS
        </h1>
        <p className="text-slate-600 text-lg">Tu Entrenador Personal de Inglés con IA. ¿Qué quieres aprender hoy?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NavButton 
          mode={AppMode.TRANSLATE}
          onClick={() => setMode(AppMode.TRANSLATE)}
          icon={<Globe />}
          title="Traductor Rápido"
          desc="Texto Inglés <-> Español"
          color="bg-indigo-500"
        />
        <NavButton 
          mode={AppMode.PRONUNCIATION}
          onClick={() => setMode(AppMode.PRONUNCIATION)}
          icon={<Mic />}
          title="Pronunciación"
          desc="Escucha y lee cómo se dice"
          color="bg-teal-500"
        />
        <NavButton 
          mode={AppMode.SCENARIO}
          onClick={() => setMode(AppMode.SCENARIO)}
          icon={<BookOpen />}
          title="Crear Escenarios"
          desc="Diálogos y textos a medida"
          color="bg-violet-500"
        />
        <NavButton 
          mode={AppMode.LIVE_TUTOR}
          onClick={() => setMode(AppMode.LIVE_TUTOR)}
          icon={<MessageCircle />}
          title="Tutor en Vivo"
          desc="Conversación real por voz"
          color="bg-rose-500"
        />
        <NavButton 
          mode={AppMode.MEDIA_ANALYSIS}
          onClick={() => setMode(AppMode.MEDIA_ANALYSIS)}
          icon={<Image />}
          title="Analizar Fotos"
          desc="Sube fotos o videos de textos"
          color="bg-blue-500"
        />
         <NavButton 
          mode={AppMode.CULTURE_SEARCH}
          onClick={() => setMode(AppMode.CULTURE_SEARCH)}
          icon={<Sparkles />}
          title="Cultura y Dudas"
          desc="Pregunta sobre cultura y datos"
          color="bg-amber-500"
        />
      </div>
    </div>
  );
};