import React, { useState } from 'react';
import { BookOpen, Video as VideoIcon, Sparkles, Loader2 } from 'lucide-react';
import { generateScenario, generateScenarioVideo } from '../services/geminiService';

export const ScenarioBuilder: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setResult('');
    const text = await generateScenario(prompt);
    setResult(text);
    setLoading(false);
  };

  const handleGenerateVideo = async () => {
    if (!prompt) return;
    if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            try {
                const success = await (window as any).aistudio.openSelectKey();
                 if(!success) return; 
            } catch (e) {
                console.error(e);
                alert("No se pudo seleccionar la clave API.");
                return;
            }
        }
    }

    setGeneratingVideo(true);
    setVideoUrl(null);
    const url = await generateScenarioVideo(prompt);
    setVideoUrl(url);
    setGeneratingVideo(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-violet-100 text-violet-600 rounded-full">
          <BookOpen size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Creador de Escenarios</h2>
          <p className="text-slate-500">Pide a la IA que cree diálogos, historias o lecciones para ti.</p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej. Crea un diálogo entre un turista y un vendedor en Londres sobre comprar souvenirs."
          className="w-full p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-100 outline-none transition-all h-32"
        />

        <div className="flex space-x-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className={`flex-1 py-3 rounded-xl text-lg font-bold text-white shadow-lg flex items-center justify-center space-x-2
              ${loading ? 'bg-slate-300' : 'bg-violet-600 hover:bg-violet-700'}
            `}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            <span>Generar Texto</span>
          </button>

          <button
             onClick={handleGenerateVideo}
             disabled={generatingVideo || !prompt}
             className={`px-6 py-3 rounded-xl text-lg font-bold text-violet-700 bg-violet-100 border-2 border-violet-200 hover:bg-violet-200 flex items-center space-x-2 transition-colors
                ${generatingVideo ? 'opacity-50 cursor-not-allowed' : ''}
             `}
          >
             {generatingVideo ? <Loader2 className="animate-spin" /> : <VideoIcon />}
             <span>Visualizar (Veo)</span>
          </button>
        </div>
      </div>

      {/* Results Area */}
      {(result || videoUrl) && (
        <div className="mt-8 space-y-6">
          {videoUrl && (
            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-slate-900 bg-black">
                <video src={videoUrl} controls autoPlay loop className="w-full h-auto aspect-video" />
                <div className="bg-slate-900 text-white p-2 text-center text-xs">
                    Generado por Veo
                </div>
            </div>
          )}
          
          {result && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 prose prose-lg max-w-none text-slate-800">
               <pre className="whitespace-pre-wrap font-sans">{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};