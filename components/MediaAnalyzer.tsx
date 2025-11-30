import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { analyzeMedia } from '../services/geminiService';

export const MediaAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('Analiza el texto de la imagen, tradúcelo y dame la pronunciación.');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult('');
    const text = await analyzeMedia(file, prompt);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
       <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
          <ImageIcon size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Análisis Multimedia</h2>
          <p className="text-slate-500">Sube una foto de un texto o video para aprender.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className={`border-4 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer relative ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="image/*,video/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                    <div className="flex flex-col items-center">
                        {file.type.startsWith('video') ? <Film size={48} className="text-blue-500 mb-2"/> : <ImageIcon size={48} className="text-blue-500 mb-2"/>}
                        <span className="font-bold text-slate-700 truncate max-w-full px-4">{file.name}</span>
                        <span className="text-xs text-blue-500 mt-1">Clic para cambiar</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-400">
                        <Upload size={48} className="mb-2"/>
                        <span className="font-bold">Clic para Subir</span>
                        <span className="text-sm">Foto o Video</span>
                    </div>
                )}
            </div>

            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-4 border rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="¿Qué debe buscar Gemini?"
                rows={3}
            />

            <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] flex justify-center
                    ${!file || loading ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'}
                `}
            >
                {loading ? <Loader2 className="animate-spin" /> : "Analizar Archivo"}
            </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full min-h-[300px]">
            {result ? (
                 <div className="prose prose-slate">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Análisis de Gemini</h3>
                    <p className="whitespace-pre-wrap">{result}</p>
                 </div>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-center">
                    El resultado aparecerá aquí...
                </div>
            )}
        </div>
      </div>
    </div>
  );
};