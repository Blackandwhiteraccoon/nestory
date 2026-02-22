import React from 'react';
import { HubOption, ViewState, SubscriptionTier, TIER_CONFIG } from '../types';
import { Package, Boxes, Sparkles, TrendingUp, Settings, Camera, Mic, Crown } from 'lucide-react';

interface MainHubProps {
  onNavigate: (view: ViewState) => void;
  itemCount: number;
  subscriptionTier: SubscriptionTier;
}

const MainHub: React.FC<MainHubProps> = ({ onNavigate, itemCount, subscriptionTier }) => {
  const limits = TIER_CONFIG[subscriptionTier];
  const isFree = subscriptionTier === 'FREE';
  const progress = isFree ? (itemCount / (limits.maxItems as number)) * 100 : 0;
  const options: HubOption[] = [
    {
      id: 'VISION',
      title: "Ajout d'objet par photo",
      description: "Utilisez la caméra ou importez une photo pour identifier et ajouter un objet.",
      icon: <Camera size={32} />,
      color: 'bg-purple-500',
    },
    {
      id: 'VOICE_AGENT',
      title: "Ajout par commande vocale",
      description: "Dictez simplement les informations de vos objets à l'IA en temps réel.",
      icon: <Mic size={32} />,
      color: 'bg-red-500',
    },
    {
      id: 'INVENTORY',
      title: 'Consulter l\'inventaire',
      description: 'Gérez votre stock et organisez vos éléments avec l\'aide de l\'IA.',
      icon: <Package size={32} />,
      color: 'bg-blue-500',
    },
    {
      id: 'STOCK_MANAGER',
      title: 'Gestion de Stock',
      description: 'Vue rapide pour ajuster les quantités ou supprimer des articles existants.',
      icon: <Boxes size={32} />,
      color: 'bg-orange-500',
    },
    {
      id: 'PRICE_UPDATER',
      title: 'Audit Financier',
      description: 'Mise à jour des valeurs marchandes par IA (Sauvegarde + Analyse 3 sources).',
      icon: <TrendingUp size={32} />,
      color: 'bg-emerald-500',
    },
    {
      id: 'SETTINGS',
      title: 'Paramètres',
      description: 'Configuration de l\'application, gestion des données et préférences.',
      icon: <Settings size={32} />,
      color: 'bg-slate-500',
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-7xl mx-auto p-6">
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center p-3 bg-slate-800 rounded-full mb-4 border border-slate-700">
            <Sparkles className="text-yellow-400 mr-2" size={20} />
            <span className="text-slate-200 font-medium">Propulsé par Google Gemini</span>
        </div>
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
          Bienvenue sur Nexus
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          L'assistant intelligent qui simplifie la gestion de vos biens. Inventoriez, valorisez et entretenez vos objets grâce à la puissance de l'IA.
        </p>

        {isFree && (
          <div className="mt-8 max-w-md mx-auto w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Utilisation Plan Free</span>
              <span className="text-sm font-black text-white">{itemCount} / {limits.maxItems} objets</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <button 
              onClick={() => onNavigate('SUBSCRIPTION')}
              className="mt-4 text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <Crown size={12} /> Passer à l'illimité
            </button>
          </div>
        )}
      </div>

      {/* Adjusted grid for more items: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onNavigate(option.id)}
            className="group relative overflow-hidden rounded-2xl glass-panel p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20 text-left border-t border-white/10 animate-slide-up h-full flex flex-col"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${option.color} opacity-10 rounded-bl-full transition-transform duration-500 group-hover:scale-150`} />
            
            <div className={`inline-flex p-3 rounded-xl ${option.color} bg-opacity-20 text-white mb-6 shadow-lg ring-1 ring-white/20 w-fit`}>
              {option.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
              {option.title}
            </h3>
            <p className="text-slate-400 leading-relaxed flex-grow text-sm">
              {option.description}
            </p>
            
            <div className="mt-6 flex items-center text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              Ouvrir <span className="ml-2 text-lg">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainHub;