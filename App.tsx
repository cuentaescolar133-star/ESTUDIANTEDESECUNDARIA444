import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppMode } from './types';
import { Navigation } from './components/Navigation';
import { PronunciationGuide } from './components/PronunciationGuide';
import { ScenarioBuilder } from './components/ScenarioBuilder';
import { LiveTutor } from './components/LiveTutor';
import { MediaAnalyzer } from './components/MediaAnalyzer';
import { translateText, askCultureQuestion } from './services/geminiService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  
  const [inputText, setInputText] = useState('');
  const [simpleResult, setSimpleResult] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSimpleAction = async () => {
    if (!inputText) return;
    setLoading(true);
    setSimpleResult('');
    setSources([]);
    
    if (mode === AppMode.TRANSLATE) {
        const res = await translateText(inputText);
        setSimpleResult(res);
    } else if (mode === AppMode.CULTURE_SEARCH) {
        const { text, sources: resSources } = await askCultureQuestion(inputText);
        setSimpleResult(text);
        setSources(resSources);
    }
    setLoading(false);
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.HOME:
        return <Navigation currentMode={mode} setMode={setMode} />;
      
      case AppMode.PRONUNCIATION:
        return <PronunciationGuide />;
      
      case AppMode.SCENARIO:
        return <ScenarioBuilder />;
      
      case AppMode.LIVE_TUTOR:
        return <LiveTutor />;

      case AppMode.MEDIA_ANALYSIS:
        return <MediaAnalyzer />;

      case AppMode.TRANSLATE:
      case AppMode.CULTURE_SEARCH:
        return (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <h2 className="text-3xl font-bold mb-6 text-slate-800">
                    {mode === AppMode.TRANSLATE ? "Traductor Instantáneo" : "Cultura y Datos"}
                </h2>
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={mode === AppMode.TRANSLATE ? "Escribe texto para traducir..." : "Pregunta sobre cultura de EE.UU./Reino Unido..."}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-200 outline-none"
                    rows={4}
                />
                <button 
                    onClick={handleSimpleAction}
                    disabled={loading || !inputText}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
                >
                    {loading ? "Procesando..." : "Enviar"}
                </button>
                
                {simpleResult && (
                    <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <p className="whitespace-pre-wrap text-lg text-slate-800">{simpleResult}</p>
                        {sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fuentes</p>
                                <ul className="space-y-1">
                                    {sources.map((chunk, i) => (
                                        <li key={i}>
                                            {chunk.web?.uri && (
                                                <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate block">
                                                    {chunk.web.title || chunk.web.uri}
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );

      default:
        return <Navigation currentMode={mode} setMode={setMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        {mode !== AppMode.HOME && (
            <div className="p-4 max-w-6xl mx-auto">
                <button 
                    onClick={() => {
                        setMode(AppMode.HOME);
                        setInputText('');
                        setSimpleResult('');
                    }}
                    className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors px-4 py-2 bg-white rounded-full shadow-sm"
                >
                    <ArrowLeft size={20} />
                    <span>Volver al Inicio</span>
                </button>
            </div>
        )}
        
        <main className="p-4 md:p-8 animate-fade-in">
            {renderContent()}
        </main>
    </div>
  );
};

export default App;