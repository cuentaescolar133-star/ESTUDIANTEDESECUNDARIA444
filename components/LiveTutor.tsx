import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Radio } from 'lucide-react';
import { getLiveSession, createPcmBlob, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';

export const LiveTutor: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Listo para conectar');
  const [volume, setVolume] = useState(0); 

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    try {
      setStatus('Solicitando micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setStatus('Conectando con Gemini...');
      setIsActive(true);

      const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputContextRef.current = inputContext;
      
      const source = inputContext.createMediaStreamSource(stream);
      const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
        setVolume(Math.sqrt(sum / inputData.length) * 100);

        const pcmBlob = createPcmBlob(inputData);
        
        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        }
      };
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputContext.destination);

      const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputContext;
      nextStartTimeRef.current = 0;

      sessionPromiseRef.current = getLiveSession(
        () => {
           setStatus('¡Conectado! Di "Hello" a tu tutor.');
        },
        async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const buffer = await decodeAudioData(base64Audio, ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                
                source.addEventListener('ended', () => {
                   sourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
        },
        () => {
            setStatus('Conexión cerrada');
            setIsActive(false);
        },
        (err) => {
            console.error(err);
            setStatus('Ocurrió un error');
            setIsActive(false);
        }
      );

    } catch (e) {
      console.error(e);
      setStatus('No se pudo acceder al micrófono');
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(s => s.close());
        sessionPromiseRef.current = null;
    }
    
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    sourcesRef.current.clear();
    setIsActive(false);
    setStatus('Listo para conectar');
    setVolume(0);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
      <div className="mb-8">
        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-rose-100' : 'bg-slate-100'}`}>
          {isActive ? (
             <div className="relative">
                <Radio className={`text-rose-600 animate-pulse`} size={64} />
                <div className="absolute top-0 left-0 -ml-1 -mt-1 w-[72px] h-[72px] rounded-full border-4 border-rose-400 opacity-50" 
                     style={{ transform: `scale(${1 + Math.min(volume, 1)})` }}></div>
             </div>
          ) : (
             <MicOff className="text-slate-400" size={64} />
          )}
        </div>
        <h2 className="mt-6 text-3xl font-bold text-slate-800">Tutor de Inglés en Vivo</h2>
        <p className={`mt-2 font-medium ${isActive ? 'text-rose-500' : 'text-slate-500'}`}>{status}</p>
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        className={`w-full py-5 rounded-2xl text-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-3
          ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-rose-500 hover:bg-rose-600'}
        `}
      >
        {isActive ? (
            <>
                <PhoneOff size={28} />
                <span>Terminar Llamada</span>
            </>
        ) : (
            <>
                <Mic size={28} />
                <span>Iniciar Conversación</span>
            </>
        )}
      </button>
      
      {isActive && (
        <p className="mt-4 text-xs text-slate-400">Impulsado por Gemini 2.5 Live API. Habla claro.</p>
      )}
    </div>
  );
};