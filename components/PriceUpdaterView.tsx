import React, { useState } from 'react';
import { InventoryItem, LoadingState } from '../types';
import { TrendingUp, Download, Play, AlertTriangle, CheckCircle, ArrowRight, Save, RefreshCw, DollarSign } from 'lucide-react';
import { evaluateItemMarketValue } from '../services/geminiService';

interface PriceUpdaterViewProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  currency: string;
}

const PriceUpdaterView: React.FC<PriceUpdaterViewProps> = ({ items, setItems, currency }) => {
  const [step, setStep] = useState<'BACKUP' | 'UPDATE' | 'RESULTS'>('BACKUP');
  const [backupDone, setBackupDone] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Stocke les résultats temporaires avant application
  const [updatedItems, setUpdatedItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const getCurrencySymbol = (code: string) => {
      switch (code) {
          case 'EUR': return '€';
          case 'USD': return '$';
          case 'CAD': return 'C$';
          case 'GBP': return '£';
          case 'CHF': return 'CHF';
          default: return code;
      }
  };

  const currencySymbol = getCurrencySymbol(currency);

  // 1. Générer et Télécharger le Backup
  const handleBackup = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nexus_inventory_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setBackupDone(true);
    setLogs(prev => [...prev, `Backup sauvegardé : ${exportFileDefaultName}`]);
  };

  // 2. Lancer l'analyse IA par lots
  const startUpdateProcess = async () => {
    if (!backupDone && !window.confirm("Vous n'avez pas fait de backup. Continuer quand même ?")) return;
    
    setStep('UPDATE');
    setUpdating(true);
    setUpdatedItems([]);
    setProgress(0);
    
    const newItemsList: InventoryItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setLogs(prev => [...prev, `Analyse de : ${item.name}...`]);
        
        try {
            // Appel à l'IA
            const valuation = await evaluateItemMarketValue(item, currency);
            
            const updatedItem: InventoryItem = {
                ...item,
                purchasePrice: valuation.newPrice,
                resaleValue: valuation.usedPrice,
                lastValuationDate: today,
                valuationDetails: valuation.sources
            };
            
            newItemsList.push(updatedItem);
            setLogs(prev => [...prev, `> ${item.name} mis à jour. (${valuation.sources})`]);
            
        } catch (err) {
            console.error(err);
            setLogs(prev => [...prev, `> Erreur sur ${item.name}, valeurs conservées.`]);
            newItemsList.push(item);
        }

        setProgress(Math.round(((i + 1) / items.length) * 100));
    }

    setUpdatedItems(newItemsList);
    setUpdating(false);
    setStep('RESULTS');
  };

  // 3. Appliquer les changements
  const applyChanges = () => {
      setItems(updatedItems);
      alert("Inventaire mis à jour avec succès !");
  };

  // Calculate stats for comparison
  const oldTotalValue = items.reduce((acc, i) => acc + (i.resaleValue * i.quantity), 0);
  const newTotalValue = updatedItems.reduce((acc, i) => acc + (i.resaleValue * i.quantity), 0);
  const diff = newTotalValue - oldTotalValue;

  return (
    <div className="w-full max-w-5xl mx-auto animate-slide-up pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <TrendingUp className="text-emerald-400" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Audit Financier IA</h2>
          <p className="text-slate-400">Réévaluez votre patrimoine en temps réel grâce à 3 sources de marché.</p>
        </div>
      </div>

      {/* Step 1: Backup */}
      <div className={`glass-panel p-6 rounded-2xl mb-6 border border-white/10 transition-all ${step === 'BACKUP' ? 'opacity-100' : 'opacity-60'}`}>
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm border border-slate-600">1</span>
                  Sauvegarde de sécurité
              </h3>
              {backupDone && <CheckCircle className="text-emerald-400" />}
          </div>
          <p className="text-slate-400 mb-4 text-sm">
              Avant de modifier les valeurs financières, il est impératif de créer une copie de votre inventaire actuel.
              Cela vous permettra de revenir en arrière si les estimations de l'IA ne vous conviennent pas.
          </p>
          <button 
              onClick={handleBackup}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${backupDone ? 'bg-slate-700 text-slate-300' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
          >
              <Download size={20} />
              {backupDone ? "Backup effectué (Télécharger à nouveau)" : "Télécharger le Backup (.json)"}
          </button>
      </div>

      {/* Step 2: Analysis Process */}
      <div className={`glass-panel p-6 rounded-2xl mb-6 border border-white/10 transition-all ${step === 'UPDATE' ? 'opacity-100 ring-2 ring-emerald-500' : step === 'RESULTS' ? 'opacity-60' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm border border-slate-600">2</span>
                  Mise à jour des valeurs
              </h3>
          </div>
          
          {step === 'BACKUP' && (
             <div className="bg-slate-900/50 p-4 rounded-lg border border-yellow-500/20 flex gap-3 items-start">
                 <AlertTriangle className="text-yellow-500 flex-shrink-0" />
                 <p className="text-sm text-slate-300">
                     L'IA va parcourir vos {items.length} objets un par un. Elle consultera 3 sources pour déterminer la valeur Neuve actuelle et la valeur Occasion. Ce processus peut prendre quelques minutes.
                 </p>
             </div>
          )}

          {step === 'UPDATE' && (
              <div className="space-y-4">
                  <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-center text-emerald-400 font-mono text-sm">{progress}% - Analyse en cours...</p>
                  
                  <div className="h-32 overflow-y-auto bg-black/30 rounded-lg p-3 font-mono text-xs text-slate-400 border border-slate-800">
                      {logs.map((log, i) => <div key={i}>{log}</div>)}
                      <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
                  </div>
              </div>
          )}

          {step === 'BACKUP' && (
            <button 
                onClick={startUpdateProcess}
                disabled={!backupDone}
                className={`mt-4 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!backupDone ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
            >
                <Play size={20} />
                Lancer l'Audit IA
            </button>
          )}
      </div>

      {/* Step 3: Review & Apply */}
      {step === 'RESULTS' && (
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 animate-slide-up">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm text-white">3</span>
                      Résultats & Validation
                  </h3>
                  <div className={`px-4 py-2 rounded-lg border ${diff >= 0 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                      Variation Totale : {diff >= 0 ? '+' : ''}{diff.toLocaleString()} {currencySymbol}
                  </div>
              </div>

              <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left text-sm">
                      <thead>
                          <tr className="text-slate-500 border-b border-slate-700">
                              <th className="pb-2">Objet</th>
                              <th className="pb-2 text-right">Ancienne Valeur (Occasion)</th>
                              <th className="pb-2 text-right">Nouvelle Valeur (Occasion)</th>
                              <th className="pb-2 pl-4">Sources détectées</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                          {updatedItems.map((newItem, idx) => {
                              const oldItem = items[idx];
                              const priceDiff = newItem.resaleValue - oldItem.resaleValue;
                              return (
                                  <tr key={newItem.id} className="group hover:bg-white/5">
                                      <td className="py-3 font-medium text-white">{newItem.name}</td>
                                      <td className="py-3 text-right text-slate-400">{oldItem.resaleValue} {currencySymbol}</td>
                                      <td className={`py-3 text-right font-bold ${priceDiff > 0 ? 'text-emerald-400' : priceDiff < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                                          {newItem.resaleValue} {currencySymbol}
                                      </td>
                                      <td className="py-3 pl-4 text-xs text-slate-500 italic">{newItem.valuationDetails}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>

              <button 
                  onClick={applyChanges}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
              >
                  <Save size={20} />
                  Valider et Mettre à jour l'inventaire
              </button>
          </div>
      )}

    </div>
  );
};

export default PriceUpdaterView;