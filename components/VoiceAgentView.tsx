import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { Mic, MicOff, Activity, Box, X } from 'lucide-react';
import { InventoryItem } from '../types';

interface VoiceAgentViewProps {
  onAddItem: (item: InventoryItem) => void;
  currency: string;
}

const VoiceAgentView: React.FC<VoiceAgentViewProps> = ({ onAddItem, currency }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  // Refs for Audio Contexts and Streams
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper: Audio Helpers
  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    // Simple PCM conversion
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    
    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const decodeAudioData = async (b64: string, ctx: AudioContext) => {
     const binaryString = atob(b64);
     const len = binaryString.length;
     const bytes = new Uint8Array(len);
     for (let i = 0; i < len; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     
     // Decode raw PCM
     const dataInt16 = new Int16Array(bytes.buffer);
     const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
     const channelData = buffer.getChannelData(0);
     for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
     }
     return buffer;
  };

  // Tool Definition
  const addItemTool: FunctionDeclaration = {
    name: 'addItem',
    parameters: {
      type: Type.OBJECT,
      description: 'Adds a new item to the inventory ONLY after collecting all fields.',
      properties: {
        name: { type: Type.STRING, description: 'Name of the item' },
        category: { type: Type.STRING, description: 'Category of the item' },
        brand: { type: Type.STRING, description: 'Brand of the item' },
        location: { type: Type.STRING, description: 'Storage location' },
        condition: { type: Type.STRING, description: 'Condition (Neuf, Bon, Moyen, etc)' },
        quantity: { type: Type.NUMBER, description: 'Quantity count' },
        purchasePrice: { type: Type.NUMBER, description: `Buying price in ${currency}` },
        resaleValue: { type: Type.NUMBER, description: `Estimated resale value in ${currency}` },
      },
      required: ['name', 'quantity'],
    },
  };

  const connect = async () => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Init Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsListening(true);
            
            // Setup Input Stream
            if (inputAudioContextRef.current) {
                const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                scriptProcessor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const buffer = await decodeAudioData(audioData, ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
             }

             // Handle Transcription
             if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
                setAiResponse(prev => prev + msg.serverContent?.modelTurn?.parts?.[0]?.text);
             }
             
             // Handle Tool Calls
             if (msg.toolCall) {
                 for (const fc of msg.toolCall.functionCalls) {
                     if (fc.name === 'addItem') {
                         const args = fc.args as any;
                         const newItem: InventoryItem = {
                             id: Date.now().toString(),
                             name: args.name,
                             category: args.category || 'Divers',
                             brand: args.brand || 'Inconnu',
                             location: args.location || 'Non spécifié',
                             condition: args.condition || 'Bon',
                             quantity: args.quantity || 1,
                             image: null,
                             acquisitionDate: new Date().toISOString().split('T')[0],
                             purchasePrice: Number(args.purchasePrice) || 0,
                             resaleValue: Number(args.resaleValue) || 0
                         };
                         onAddItem(newItem);
                         setTranscription(prev => prev + `\n[Item Added: ${args.name}]`);
                         
                         // Respond to tool
                         sessionPromise.then(session => {
                             session.sendToolResponse({
                                 functionResponses: {
                                     id: fc.id,
                                     name: fc.name,
                                     response: { result: 'Success' }
                                 }
                             });
                         });
                     }
                 }
             }
          },
          onclose: () => {
              setIsConnected(false);
              setIsListening(false);
          },
          onerror: (err) => {
              console.error(err);
              setIsConnected(false);
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            // Instruction système complexe pour forcer le comportement étape par étape
            systemInstruction: `
                Tu es un assistant vocal expert en gestion d'inventaire. Ton objectif est de remplir une fiche produit avec l'utilisateur.
                
                **PROCESSUS OBLIGATOIRE ÉTAPE PAR ÉTAPE :**
                Tu dois collecter les informations suivantes, UNE PAR UNE, dans cet ordre précis :
                1. Nom de l'objet
                2. Marque
                3. Catégorie
                4. État (Neuf, Bon, Moyen...)
                5. Emplacement (Où est-il rangé ?)
                6. Quantité
                7. Prix d'achat estimé (en ${currency})
                8. Valeur de revente estimée (en ${currency})

                **RÈGLES DE CONVERSATION :**
                1. **Pas à pas :** Ne pose JAMAIS plusieurs questions à la fois. Attends la réponse de l'utilisateur.
                2. **Confirmation :** Après chaque réponse de l'utilisateur, reformule pour valider avant de passer à la suite. 
                   Exemple : "D'accord, c'est un 'iPhone 12'. On valide ce nom ?" ou "Noté pour la marque Apple. Quelle est la catégorie ?"
                3. **Suggestions :** Si l'utilisateur te demande une suggestion (ex: "Je ne sais pas le prix"), propose une estimation réaliste basée sur l'objet et demande-lui de valider ta suggestion.
                4. **Skip :** Si l'utilisateur dit "passer", "skip", "je ne sais pas" (sans demander de suggestion) ou "suivant", laisse le champ vide ou mets une valeur par défaut et passe à la question suivante.
                5. **Finalisation :** Seulement quand TOUS les champs ont été passés en revue, appelle l'outil 'addItem' avec toutes les données collectées.

                Parle de manière naturelle, brève et professionnelle en français.
                Commence maintenant par saluer l'utilisateur et lui demander quel est le nom de l'objet à ajouter.
            `,
            tools: [{ functionDeclarations: [addItemTool] }]
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Connection failed", err);
      alert("Erreur de connexion au microphone ou à l'API.");
    }
  };

  const disconnect = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setIsConnected(false);
    setIsListening(false);
  };

  useEffect(() => {
      return () => disconnect();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up pb-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="glass-panel p-8 rounded-3xl border border-white/10 w-full max-w-xl text-center relative overflow-hidden">
        
        {/* Pulse Animation Background */}
        {isConnected && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                 <div className="w-64 h-64 bg-red-500 rounded-full filter blur-3xl animate-pulse"></div>
            </div>
        )}

        <div className="relative z-10">
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isConnected ? 'bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)]' : 'bg-slate-800 border border-slate-700'}`}>
                {isConnected ? <Activity className="text-white animate-bounce" size={40} /> : <MicOff className="text-slate-500" size={40} />}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
                {isConnected ? "Session Active" : "Assistant Vocal Guidé"}
            </h2>
            <p className="text-slate-400 mb-8 text-sm h-10">
                {isConnected 
                    ? "Je vais vous poser des questions pour créer la fiche..." 
                    : "L'IA vous guidera étape par étape (Nom, Marque, Prix...) avec validation."}
            </p>

            {/* Transcription / Logs */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 min-h-[150px] max-h-[200px] overflow-y-auto text-left mb-8 font-mono text-xs text-slate-300">
                 {transcription && <div className="mb-2 text-blue-300">Actions: {transcription}</div>}
                 {aiResponse && <div>IA: {aiResponse.slice(-200)}...</div>}
                 {!transcription && !aiResponse && <span className="text-slate-600 italic">Les échanges apparaîtront ici...</span>}
            </div>

            <button
                onClick={isConnected ? disconnect : connect}
                className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 mx-auto transition-all w-full max-w-xs ${
                    isConnected 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
                }`}
            >
                {isConnected ? (
                    <>
                        <X size={24} /> Arrêter
                    </>
                ) : (
                    <>
                        <Mic size={24} /> Démarrer
                    </>
                )}
            </button>
        </div>
      </div>

      <div className="mt-8 flex gap-2 text-slate-500 text-sm items-center bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
          <Box size={14} />
          <span>Dites "Passer" pour sauter une question ou "Suggère-moi un prix" pour de l'aide.</span>
      </div>
    </div>
  );
};

export default VoiceAgentView;