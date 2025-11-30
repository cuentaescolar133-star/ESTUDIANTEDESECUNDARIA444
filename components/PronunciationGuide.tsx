import React, { useState } from 'react';
import { Mic, Volume2, ArrowRight } from 'lucide-react';
import { getPronunciationGuide } from '../services/geminiService';
import { PronunciationResult } from '../types';

export const PronunciationGuide: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const { json, audioBase64 } = await getPronunciationGuide(text);
      setResult(json);

      if (audioBase64) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const binaryString = atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        try {
           const buffer = await audioContext.decodeAudioData(bytes.buffer);
           const source = audioContext.createBufferSource();
           source.buffer = buffer;
           source.connect(audioContext.destination);
           source.start(0);
        } catch (e) {
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
            const channel = buffer.getChannelData(0);
            for(let i=0; i<channel.length; i++) {
                channel[i] = dataInt16[i] / 32768.0;
            }
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(0);
        }
      }
    } catch (error) {
      alert("Algo salió mal. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
          <Mic size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Guía de Pronunciación</h2>
          <p className="text-slate-500">Escribe en inglés y mira cómo se pronuncia.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Texto en Inglés</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej. Hello, how are you today?"
            className="w-full p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !text}
          className={`w-full py-4 rounded-xl text-xl font-bold text-white transition-all shadow-lg flex items-center justify-center space-x-2
            ${loading || !text ? 'bg-slate-300 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 hover:scale-[1.02]'}
          `}
        >
          {loading ? (
            <span>Analizando...</span>
          ) : (
            <>
              <span>Enséñame</span>
              <ArrowRight size={24} />
            </>
          )}
        </button>

        {result && (
          <div className="mt-8 bg-slate-50 rounded-2xl p-8 border-2 border-teal-100 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original (Inglés)</span>
                <p className="text-2xl font-medium text-slate-900 mt-1">{result.original}</p>
              </div>
              
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pronunciación Figurada</span>
                <p className="text-2xl font-bold text-teal-600 mt-1">{result.phonetic_spanish}</p>
              </div>

              <div className="md:col-span-2 pt-6 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Traducción</span>
                <p className="text-xl text-slate-700 mt-1 italic">{result.translation}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleAnalyze} 
                className="flex items-center space-x-2 text-teal-600 font-bold hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Volume2 size={20} />
                <span>Repetir Audio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};