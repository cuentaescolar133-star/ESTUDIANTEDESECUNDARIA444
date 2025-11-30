import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper for file encoding ---
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- 1. Translation & General Text (Fast) ---
// Uses gemini-2.5-flash-lite for low latency responses
export const translateText = async (text: string, targetLang: string = 'Spanish'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Translate the following text to ${targetLang}. Only provide the translation.\n\nText: "${text}"`,
    });
    return response.text || "La traducción falló.";
  } catch (error) {
    console.error("Translation error:", error);
    return "Error generando la traducción.";
  }
};

// --- 2. Pronunciation Guide (Text + Audio) ---
// Uses gemini-2.5-flash for JSON logic + gemini-2.5-flash-preview-tts for audio
export const getPronunciationGuide = async (text: string): Promise<{ json: any, audioBase64: string | undefined }> => {
  try {
    // Step 1: Get the phonetic breakdown
    const jsonResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the English text: "${text}". 
      Return a JSON object with:
      - "original": the English text
      - "phonetic_spanish": how a Spanish speaker would pronounce it (e.g. "Hello" -> "Jelou", "Schedule" -> "Es-ke-yul"). Make it easy to read for a Spanish speaker.
      - "translation": Spanish translation.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            phonetic_spanish: { type: Type.STRING },
            translation: { type: Type.STRING },
          },
        },
      }
    });

    const parsedJson = JSON.parse(jsonResponse.text || "{}");

    // Step 2: Get the TTS audio
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return { json: parsedJson, audioBase64 };
  } catch (error) {
    console.error("Pronunciation error:", error);
    throw error;
  }
};

// --- 3. Scenario/Creative Text (Thinking Mode) ---
// Uses gemini-3-pro-preview with thinking budget for high quality educational content
export const generateScenario = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert English teacher for Spanish speaking students. 
      The user will ask you to create English learning material (dialogues, stories, etc.) in Spanish.
      
      User Request: "${prompt}"
      
      Output: Provide the requested English text, followed by a Spanish translation and key vocabulary notes. 
      Ensure it is educational, grammatically correct, and easy to understand.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 } // Max thinking for deep reasoning on grammar/structure
      }
    });
    return response.text || "No se pudo generar el escenario.";
  } catch (error) {
    console.error("Scenario error:", error);
    return "Error generando el escenario.";
  }
};

// --- 4. Veo Video Generation ---
// Uses veo-3.1-fast-generate-preview
export const generateScenarioVideo = async (prompt: string): Promise<string | null> => {
  try {
    // Ensure key is selected (handled in UI, but double check logic here)
    // Note: In real app, re-init AI client here if needed with selected key
    // For this demo, assuming process.env.API_KEY is valid or injected.
    
    // We create a new client instance just in case keys were swapped dynamically
    // although in this environment we rely on the injected one.
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A cinematic, realistic scene representing: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) return null;
    
    return `${uri}&key=${process.env.API_KEY}`;
  } catch (error) {
    console.error("Veo error:", error);
    return null;
  }
};

// --- 5. Media Analysis (Image/Video) ---
// Uses gemini-3-pro-preview for advanced multimodal understanding
export const analyzeMedia = async (file: File, prompt: string): Promise<string> => {
  try {
    const filePart = await fileToGenerativePart(file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          filePart,
          { text: `Act as an English tutor for Spanish speakers. Analyze this media. 
          Important: If the image contains text, extract the English text, provide the Spanish translation, and explicitly provide the phonetic pronunciation for a Spanish speaker (e.g., "Hello" -> "Jelou").
          
          User Instruction: ${prompt}` }
        ]
      }
    });
    return response.text || "El análisis falló.";
  } catch (error) {
    console.error("Media analysis error:", error);
    return "Error analizando el archivo.";
  }
};

// --- 6. Search Grounding (Culture) ---
// Uses gemini-2.5-flash with googleSearch
export const askCultureQuestion = async (question: string): Promise<{text: string, sources: any[]}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Answer this question about English/American/British culture for a Spanish speaking student. Answer in Spanish. Question: ${question}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text || "No se encontró respuesta.", sources };
  } catch (error) {
    console.error("Search error:", error);
    return { text: "Error en la búsqueda.", sources: [] };
  }
};


// --- 7. Live API Helpers (Audio Utils) ---

export const createPcmBlob = (data: Float32Array): { data: string, mimeType: string } => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
};

export const decodeAudioData = async (
  base64: string,
  ctx: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length; // 1 channel
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

export const getLiveSession = (
  onOpen: () => void,
  onMessage: (msg: LiveServerMessage) => void,
  onClose: () => void,
  onError: (e: any) => void
) => {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: "Eres un profesor de inglés amable y paciente. Tu estudiante habla español. Ayúdale a practicar inglés conversando. Corrige sus errores gramaticales o de pronunciación de forma suave y motivadora. Mantén la conversación fluida.",
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
      }
    }
  });
};