import React, { useState, useEffect } from 'react';
import { Settings, Database, Info, Trash2, Save, Globe, DollarSign, Box, BrainCircuit, CheckCircle, Plus, ArrowRightLeft, Crown, MessageSquarePlus } from 'lucide-react';
import { InventoryItem, ViewState, SubscriptionTier } from '../types';

interface SettingsViewProps {
  items?: InventoryItem[];
  setItems?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  currency: string;
  setCurrency: (c: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  onNavigate?: (view: ViewState) => void;
  subscriptionTier: SubscriptionTier;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  items = [], 
  setItems,
  currency,
  setCurrency,
  language,
  setLanguage,
  onNavigate,
  subscriptionTier
}) => {
  // États pour les paramètres
  const [defaultCondition, setDefaultCondition] = useState('Bon');
  const [defaultLocation, setDefaultLocation] = useState('');
  const [aiDetailLevel, setAiDetailLevel] = useState('standard');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // États pour les devises personnalisées et conversion
  const [customCurrencies, setCustomCurrencies] = useState<string[]>([]);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [conversionRate, setConversionRate] = useState<number>(1);

  // Simulation de sauvegarde automatique
  useEffect(() => {
    const timer = setTimeout(() => {
       // Save logic simulation
    }, 500);
    return () => clearTimeout(timer);
  }, [language, defaultCondition, defaultLocation, aiDetailLevel]);

  const handleSave = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
  };

  const handleClearData = () => {
    if (window.confirm("Attention : Cette action est irréversible. Voulez-vous vraiment effacer toutes les données locales ?")) {
       if (setItems) setItems([]);
       alert("Données effacées.");
    }
  };

  const handleAddCustomCurrency = () => {
      if (newCurrencyCode && !customCurrencies.includes(newCurrencyCode.toUpperCase())) {
          setCustomCurrencies([...customCurrencies, newCurrencyCode.toUpperCase()]);
          setNewCurrencyCode('');
      }
  };

  const initiateCurrencyChange = (newVal: string) => {
      if (newVal !== currency) {
          setPendingCurrency(newVal);
          setConversionRate(1); // Reset default rate
      } else {
          setPendingCurrency(null);
      }
  };

  const applyConversion = (convertValues: boolean) => {
      if (!pendingCurrency || !setItems) return;

      if (convertValues && conversionRate !== 1) {
          const updatedItems = items.map(item => ({
              ...item,
              purchasePrice: parseFloat((item.purchasePrice * conversionRate).toFixed(2)),
              resaleValue: parseFloat((item.resaleValue * conversionRate).toFixed(2))
          }));
          setItems(updatedItems);
      }

      setCurrency(pendingCurrency);
      setPendingCurrency(null);
      handleSave();
  };

  const sendFeedback = () => {
    if (!feedbackText.trim()) return;
    // Simulate sending feedback
    console.log("Beta Feedback:", feedbackText);
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up pb-12 relative">
      
      {/* Notification Toast */}
      {showSaveNotification && (
        <div className="fixed top-24 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in z-50">
          <CheckCircle size={16} />
          Paramètres sauvegardés
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-slate-500/20 rounded-xl">
          <Settings className="text-slate-300" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Paramètres</h2>
          <p className="text-slate-400">Personnalisez votre expérience Nexus AI.</p>
        </div>
      </div>

      {/* Beta Feedback Section */}
      <section className="glass-panel p-6 rounded-2xl border border-yellow-500/20 mb-6 bg-yellow-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
            <MessageSquarePlus size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Feedback Bêta</h3>
            <p className="text-xs text-slate-400">Aidez-nous à améliorer Nexus AI.</p>
          </div>
        </div>
        
        {feedbackSent ? (
          <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 text-sm font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle size={18} /> Merci pour votre retour !
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea 
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Un bug ? Une suggestion ? Dites-nous tout..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none h-24 resize-none"
            />
            <button 
              onClick={sendFeedback}
              disabled={!feedbackText.trim()}
              className="self-end px-6 py-2 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer le rapport
            </button>
          </div>
        )}
      </section>

      {/* Subscription Section */}
      <section className="glass-panel p-6 rounded-2xl border border-white/10 mb-6 bg-gradient-to-br from-blue-600/5 to-purple-600/5">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mon Abonnement</h3>
              <p className="text-xs text-slate-400">Gérez vos limites et fonctionnalités premium.</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            subscriptionTier === 'FREE' ? 'bg-slate-800 text-slate-400' :
            subscriptionTier === 'BASE' ? 'bg-blue-500/20 text-blue-400' :
            subscriptionTier === 'PRO' ? 'bg-purple-500/20 text-purple-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            Plan {subscriptionTier}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 text-sm text-slate-300">
            {subscriptionTier === 'FREE' ? (
              "Vous utilisez la version gratuite limitée à 50 objets. Passez à la version supérieure pour débloquer l'illimité et le scan 3D."
            ) : (
              `Vous profitez actuellement des avantages du plan ${subscriptionTier}. Merci de soutenir Nexus AI !`
            )}
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('SUBSCRIPTION')}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors whitespace-nowrap"
          >
            {subscriptionTier === 'FREE' ? 'Passer au Premium' : 'Gérer mon plan'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Préférences Générales (Langue & Devise) */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                <Globe size={20} className="text-blue-400" />
                Général
            </h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <Globe size={14} /> Langue de l'interface
                    </label>
                    <select 
                        value={language}
                        onChange={(e) => {
                            const newLang = e.target.value;
                            setLanguage(newLang);
                            if (newLang === 'fr-CA') {
                                initiateCurrencyChange('CAD');
                            }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                    >
                        <option value="fr">Français (France)</option>
                        <option value="fr-CA">Français (Canada)</option>
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                        <DollarSign size={14} /> Devise principale
                    </label>
                    <select 
                        value={pendingCurrency || currency}
                        onChange={(e) => initiateCurrencyChange(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                    >
                        <option value="EUR">Euro (€)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="CAD">Dollar Canadien (C$)</option>
                        <option value="GBP">Livre Sterling (£)</option>
                        <option value="CHF">Franc Suisse (CHF)</option>
                        {customCurrencies.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    
                    {/* Ajout Custom Currency */}
                    <div className="mt-3 flex gap-2">
                        <input 
                            type="text" 
                            value={newCurrencyCode}
                            onChange={(e) => setNewCurrencyCode(e.target.value)}
                            placeholder="Code (ex: BTC)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            maxLength={5}
                        />
                        <button 
                            onClick={handleAddCustomCurrency}
                            disabled={!newCurrencyCode}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Conversion Logic Block */}
                    {pendingCurrency && (
                        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl animate-fade-in">
                            <h4 className="text-sm font-bold text-blue-200 mb-2 flex items-center gap-2">
                                <ArrowRightLeft size={14} /> Changement de devise
                            </h4>
                            <p className="text-xs text-slate-400 mb-3">
                                Vous passez de <strong>{currency}</strong> à <strong>{pendingCurrency}</strong>. 
                                Souhaitez-vous convertir les montants existants ?
                            </p>
                            
                            <div className="mb-3">
                                <label className="text-xs text-slate-500 block mb-1">Taux de change (1 {currency} = ? {pendingCurrency})</label>
                                <input 
                                    type="number" 
                                    value={conversionRate}
                                    onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                                    step="0.01"
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => applyConversion(true)}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    Appliquer et Convertir les prix
                                </button>
                                <button 
                                    onClick={() => applyConversion(false)}
                                    className="w-full py-2 bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 text-xs rounded-lg transition-colors"
                                >
                                    Changer le symbole uniquement
                                </button>
                                <button 
                                    onClick={() => setPendingCurrency(null)}
                                    className="w-full py-1 text-slate-500 hover:text-slate-300 text-xs"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 2. Configuration Inventaire (Valeurs par défaut) */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                <Box size={20} className="text-orange-400" />
                Valeurs par défaut
            </h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm text-slate-400 mb-2">État par défaut des objets</label>
                    <select 
                        value={defaultCondition}
                        onChange={(e) => setDefaultCondition(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none"
                    >
                        <option value="Neuf">Neuf</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Bon">Bon</option>
                        <option value="Moyen">Moyen</option>
                        <option value="À rénover">À rénover</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">Emplacement favori</label>
                    <input 
                        type="text"
                        value={defaultLocation}
                        onChange={(e) => setDefaultLocation(e.target.value)}
                        placeholder="Ex: Entrepôt A, Salon..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Pré-remplit le champ lors d'un nouvel ajout.</p>
                </div>
            </div>
        </div>

        {/* 3. Intelligence Artificielle */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                <BrainCircuit size={20} className="text-purple-400" />
                Configuration IA
            </h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm text-slate-400 mb-2 flex justify-between">
                        <span>Niveau de détail (Analyse Visuelle)</span>
                        <span className="text-purple-400 text-xs">{aiDetailLevel === 'concise' ? 'Concis' : aiDetailLevel === 'standard' ? 'Standard' : 'Expert'}</span>
                    </label>
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                        <button 
                            onClick={() => setAiDetailLevel('concise')}
                            className={`flex-1 py-2 rounded-lg text-sm transition-all ${aiDetailLevel === 'concise' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Court
                        </button>
                        <button 
                            onClick={() => setAiDetailLevel('standard')}
                            className={`flex-1 py-2 rounded-lg text-sm transition-all ${aiDetailLevel === 'standard' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Normal
                        </button>
                        <button 
                            onClick={() => setAiDetailLevel('detailed')}
                            className={`flex-1 py-2 rounded-lg text-sm transition-all ${aiDetailLevel === 'detailed' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Expert
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Influence la longueur des descriptions générées par Gemini.</p>
                </div>
            </div>
        </div>

        {/* 4. Gestion des Données */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                <Database size={20} className="text-emerald-400" />
                Données & Système
            </h3>
            
            <div className="space-y-4">
                 <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                    <span className="text-slate-400 text-sm">Version</span>
                    <span className="text-white font-mono text-xs bg-slate-800 px-2 py-1 rounded">v2.3.0</span>
                </div>
                
                <div className="pt-2 flex flex-col gap-3">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700">
                        <Save size={18} />
                        Exporter l'inventaire (JSON)
                    </button>
                    <button 
                        onClick={handleClearData}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20"
                    >
                        <Trash2 size={18} />
                        Réinitialiser l'application
                    </button>
                </div>
            </div>
        </div>

      </div>

      {/* Floating Save Button (Mobile/Desktop) */}
      <div className="mt-8 flex justify-end">
         <button 
            onClick={handleSave}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
         >
            <Save size={20} />
            Enregistrer les modifications
         </button>
      </div>
    </div>
  );
};

export default SettingsView;