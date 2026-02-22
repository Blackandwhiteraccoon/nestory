import React, { useState } from 'react';
import { LoadingState } from '../types';
import { Image as ImageIcon, Wand2, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { generateImageFromText } from '../services/geminiService';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loadingState === LoadingState.LOADING) return;

    setLoadingState(LoadingState.LOADING);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64Image = await generateImageFromText(prompt);
      setGeneratedImage(base64Image);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      setError("Impossible de générer l'image. Veuillez réessayer.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full w-full max-w-6xl mx-auto animate-slide-up p-4">
      
      {/* Controls */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Wand2 className="text-purple-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Studio Image</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description de l'image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Un chat cyborg jouant du piano dans l'espace, style néon..."
                className="w-full h-32 bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loadingState === LoadingState.LOADING || !prompt.trim()}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              {loadingState === LoadingState.LOADING ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Création en cours...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Générer l'image
                </>
              )}
            </button>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl bg-slate-900/30">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Conseils</h3>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>Soyez précis sur le style (ex: photoréaliste, dessin animé).</li>
                <li>Décrivez l'éclairage (ex: lumière douce, néon).</li>
                <li>Mentionnez les couleurs principales.</li>
            </ul>
        </div>
      </div>

      {/* Preview Area */}
      <div className="w-full lg:w-2/3">
        <div className="h-full min-h-[400px] glass-panel rounded-2xl flex items-center justify-center relative overflow-hidden border border-white/10 bg-black/20">
            
            {loadingState === LoadingState.IDLE && !generatedImage && (
                <div className="text-center text-slate-500">
                    <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                    <p>L'image générée apparaîtra ici</p>
                </div>
            )}

            {loadingState === LoadingState.LOADING && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                     <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                     <p className="mt-4 text-purple-300 font-medium animate-pulse">L'IA rêve...</p>
                </div>
            )}

            {loadingState === LoadingState.ERROR && (
                <div className="text-center text-red-400 p-6">
                    <AlertTriangle size={48} className="mx-auto mb-2" />
                    <p>{error}</p>
                </div>
            )}

            {generatedImage && (
                <div className="relative w-full h-full flex items-center justify-center p-4 group">
                    <img 
                        src={generatedImage} 
                        alt="Generated AI" 
                        className="max-w-full max-h-[600px] rounded-lg shadow-2xl border border-white/10"
                    />
                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                            href={generatedImage} 
                            download={`nexus-gen-${Date.now()}.png`}
                            className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:bg-slate-200 transition-colors"
                        >
                            <Download size={16} /> Sauvegarder
                        </a>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageView;