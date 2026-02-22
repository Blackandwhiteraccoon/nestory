import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, MaintenanceTask, AttachedDocument } from '../types';
import { Package, Plus, Search, Upload, Camera, X, Trash2, Image as ImageIcon, Filter, RefreshCw, MapPin, Star, ScanBarcode, Calendar, FileText, Tag, DollarSign, Boxes, Clock, AlertTriangle, FileText as FileIcon, PenTool, TrendingUp, ArrowUpCircle, CheckSquare, Square, Download, ShoppingBag, BarChart3, QrCode } from 'lucide-react';
import { generateMaintenancePlan, generateSalesAd, compareUpgrade } from '../services/geminiService';

// Déclaration pour JSPDF chargé via CDN
declare const jspdf: any;

interface InventoryViewProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  currency: string;
}

type SidePanelTab = 'DETAILS' | 'MAINTENANCE' | 'FINANCE' | 'DOCUMENTS';

const InventoryView: React.FC<InventoryViewProps> = ({ items, setItems, currency }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<SidePanelTab>('DETAILS');
  
  // --- Feature States ---
  const [generatingMaintenance, setGeneratingMaintenance] = useState(false);
  const [salesAd, setSalesAd] = useState<{title: string, description: string, recommendedPrice: number} | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<any | null>(null);
  const [loadingFeature, setLoadingFeature] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  // Forms
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '', category: '', brand: '', location: '', condition: 'Bon', quantity: 1,
    acquisitionDate: new Date().toISOString().split('T')[0], purchasePrice: 0, resaleValue: 0, image: null, tags: []
  });
  const [modalTagInput, setModalTagInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- SUGGESTION #1: PDF EXPORT ---
  const generatePDF = () => {
      const doc = new jspdf.jsPDF();
      doc.setFontSize(20);
      doc.text("Rapport d'Inventaire Assurance - Nexus AI", 14, 22);
      doc.setFontSize(11);
      doc.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 30);
      
      let y = 40;
      const totalVal = items.reduce((sum, i) => sum + (i.purchasePrice * i.quantity), 0);
      doc.text(`Valeur Totale Assurée : ${totalVal} ${currency}`, 14, y);
      y += 10;
      doc.line(14, y, 200, y);
      y += 10;
 
      items.forEach((item, index) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`${item.name} (${item.brand})`, 14, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Cat: ${item.category} | État: ${item.condition} | Qté: ${item.quantity}`, 14, y + 5);
          doc.text(`Prix Achat: ${item.purchasePrice}${currencySymbol} | Valeur Actuelle: ${item.resaleValue}${currencySymbol}`, 14, y + 10);
          if (item.serialNumber) doc.text(`S/N: ${item.serialNumber}`, 14, y + 15);
          y += 25;
      });
 
      doc.save("inventaire-assurance.pdf");
  };

  // --- SUGGESTION #9: MAINTENANCE LOGIC ---
  const handleGenerateMaintenance = async () => {
      if (!selectedItem) return;
      setGeneratingMaintenance(true);
      const plan = await generateMaintenancePlan(selectedItem);
      
      const updatedItem = { ...selectedItem, maintenancePlan: plan };
      updateItemInState(updatedItem);
      setSelectedItem(updatedItem); // Force refresh panel
      setGeneratingMaintenance(false);
  };

  const toggleMaintenanceTask = (taskId: string) => {
      if (!selectedItem || !selectedItem.maintenancePlan) return;
      
      const updatedPlan = selectedItem.maintenancePlan.map(t => 
          t.id === taskId ? { ...t, isDone: !t.isDone, lastPerformed: !t.isDone ? new Date().toISOString().split('T')[0] : t.lastPerformed } : t
      );
      
      const updatedItem = { ...selectedItem, maintenancePlan: updatedPlan };
      updateItemInState(updatedItem);
      setSelectedItem(updatedItem);
  };

  // --- SUGGESTION #5 & #10: SALES & UPGRADE ---
  const handleGenerateSalesAd = async () => {
      if (!selectedItem) return;
      setLoadingFeature(true);
      const ad = await generateSalesAd(selectedItem, currency);
      setSalesAd(ad);
      setLoadingFeature(false);
  };

  const handleCompareUpgrade = async () => {
      if (!selectedItem) return;
      setLoadingFeature(true);
      const info = await compareUpgrade(selectedItem, currency);
      setUpgradeInfo(info);
      setLoadingFeature(false);
  };

  // Helper to update item in main list
  const updateItemInState = (updated: InventoryItem) => {
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  // Basic Item Management
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewItem(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
      if (modalTagInput && !newItem.tags?.includes(modalTagInput)) {
          setNewItem(prev => ({ ...prev, tags: [...(prev.tags||[]), modalTagInput] }));
          setModalTagInput('');
      }
  };

  const handleSubmit = () => {
    if (!newItem.name) return;
    const item: InventoryItem = {
      id: Date.now().toString(),
      ...newItem as InventoryItem,
      maintenancePlan: [],
      documents: [],
      valueHistory: [{ date: new Date().toISOString().split('T')[0], value: newItem.resaleValue || 0 }] // Suggestion #7 History Init
    };
    setItems(prev => [item, ...prev]);
    setIsModalOpen(false);
    setNewItem({ name: '', category: '', brand: '', location: '', condition: 'Bon', quantity: 1, purchasePrice: 0, resaleValue: 0, image: null, tags: [] });
  };

  const uniqueCategories = Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort();
  const filteredItems = items.filter(item => 
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.brand.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCategory ? item.category === selectedCategory : true)
  );

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 relative">
      
      {/* --- Header Stats & Actions --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div><p className="text-slate-400 text-xs">Objets</p><p className="text-xl font-bold text-white">{items.reduce((a,b)=>a+b.quantity,0)}</p></div>
            <Package className="text-blue-400 opacity-50" />
        </div>
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
             <div><p className="text-slate-400 text-xs">Valeur Achat</p><p className="text-xl font-bold text-white">{items.reduce((a,b)=>a+(b.purchasePrice*b.quantity),0)}{currencySymbol}</p></div>
             <DollarSign className="text-emerald-400 opacity-50" />
        </div>
        <button onClick={generatePDF} className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 transition-colors group cursor-pointer border-l-4 border-l-red-500">
             <FileIcon className="text-red-400 mb-1 group-hover:scale-110 transition-transform" />
             <span className="text-xs font-bold text-red-200">Export Assurance (PDF)</span>
        </button>
         <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex flex-col items-center justify-center transition-all shadow-lg shadow-blue-500/20">
             <Plus size={24} className="mb-1" />
             <span className="text-xs font-bold">Ajouter Objet</span>
        </button>
      </div>

      {/* --- Search & Filters --- */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
             />
        </div>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none">
             <option value="">Toutes Catégories</option>
             {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* --- Main List --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)} className="glass-panel rounded-2xl p-4 hover:scale-[1.02] transition-transform cursor-pointer group relative overflow-hidden">
                   <div className="aspect-square rounded-xl bg-slate-800 mb-4 overflow-hidden relative">
                       {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="text-slate-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={40} />}
                       {/* Maintenance Badge Indicator */}
                       {item.maintenancePlan && item.maintenancePlan.some(t => !t.isDone) && (
                           <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                               <PenTool size={10} /> Maintenance
                           </div>
                       )}
                   </div>
                   <h3 className="font-bold text-white truncate">{item.name}</h3>
                   <p className="text-slate-400 text-sm mb-2">{item.brand}</p>
                   <div className="flex justify-between items-center text-xs font-medium">
                       <span className="bg-slate-700 text-slate-200 px-2 py-1 rounded">{item.location}</span>
                       <span className="text-emerald-400">{item.resaleValue} {currencySymbol}</span>
                   </div>
              </div>
          ))}
      </div>

      {/* --- SIDE PANEL (Enhanced) --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
            <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-up overflow-hidden">
                
                {/* Image Header */}
                <div className="h-48 bg-slate-950 relative shrink-0">
                    {selectedItem.image && <img src={selectedItem.image} className="w-full h-full object-cover opacity-60" />}
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-900 to-transparent">
                        <h2 className="text-2xl font-bold text-white">{selectedItem.name}</h2>
                        <p className="text-blue-400">{selectedItem.brand}</p>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white"><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900/50">
                    <button onClick={() => setActiveTab('DETAILS')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'DETAILS' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Détails</button>
                    <button onClick={() => setActiveTab('MAINTENANCE')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'MAINTENANCE' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-500'}`}>Entretien</button>
                    <button onClick={() => setActiveTab('FINANCE')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'FINANCE' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}>Finance</button>
                    <button onClick={() => setActiveTab('DOCUMENTS')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'DOCUMENTS' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}>Docs</button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    
                    {/* TAB: DETAILS */}
                    {activeTab === 'DETAILS' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-800 rounded-lg"><p className="text-xs text-slate-500">Catégorie</p><p className="text-white font-medium">{selectedItem.category}</p></div>
                                <div className="p-3 bg-slate-800 rounded-lg"><p className="text-xs text-slate-500">Emplacement</p><p className="text-white font-medium">{selectedItem.location}</p></div>
                                <div className="p-3 bg-slate-800 rounded-lg"><p className="text-xs text-slate-500">État</p><p className="text-white font-medium">{selectedItem.condition}</p></div>
                                <div className="p-3 bg-slate-800 rounded-lg"><p className="text-xs text-slate-500">Quantité</p><p className="text-white font-medium">{selectedItem.quantity}</p></div>
                            </div>
                            
                            {/* Suggestion #6: QR Code Display */}
                            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mt-4">
                                <div id={`qr-${selectedItem.id}`} ref={(el) => {
                                    if (el && !el.innerHTML) {
                                        // @ts-ignore
                                        new QRCode(el, { text: JSON.stringify({id: selectedItem.id, name: selectedItem.name}), width: 100, height: 100 });
                                    }
                                }} />
                                <p className="text-black text-xs font-mono mt-2 text-center break-all">ID: {selectedItem.id}</p>
                            </div>
                            
                            <div className="mt-4">
                                <p className="text-xs text-slate-500 mb-2">Notes</p>
                                <div className="bg-slate-800 p-3 rounded-lg text-sm text-slate-300 min-h-[80px]">{selectedItem.notes || "Aucune note."}</div>
                            </div>
                        </div>
                    )}

                    {/* TAB: MAINTENANCE (Suggestion #9) */}
                    {activeTab === 'MAINTENANCE' && (
                        <div className="space-y-4">
                            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl mb-4">
                                <h3 className="text-orange-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <PenTool size={16} /> Plan de Maintenance Préventive
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Suivez les tâches d'entretien pour prolonger la durée de vie de cet objet et maintenir sa valeur de revente.
                                </p>
                            </div>

                            {!selectedItem.maintenancePlan || selectedItem.maintenancePlan.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 text-sm mb-4">Aucun plan défini.</p>
                                    <button 
                                        onClick={handleGenerateMaintenance}
                                        disabled={generatingMaintenance}
                                        className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 mx-auto"
                                    >
                                        {generatingMaintenance ? <RefreshCw className="animate-spin" size={16} /> : <PenTool size={16} />}
                                        Générer avec l'IA
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedItem.maintenancePlan.map(task => (
                                        <div key={task.id} onClick={() => toggleMaintenanceTask(task.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${task.isDone ? 'bg-slate-800 border-slate-700 opacity-60' : 'bg-slate-800 border-orange-500/50'}`}>
                                            {task.isDone ? <CheckSquare className="text-emerald-500" size={20} /> : <Square className="text-slate-500" size={20} />}
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${task.isDone ? 'line-through text-slate-500' : 'text-white'}`}>{task.task}</p>
                                                <p className="text-xs text-slate-500">{task.frequency} {task.lastPerformed && `• Fait le ${task.lastPerformed}`}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleGenerateMaintenance} className="w-full text-xs text-orange-400 mt-4 hover:underline">Régénérer le plan</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: FINANCE (Suggestion #5, #7, #10) */}
                    {activeTab === 'FINANCE' && (
                        <div className="space-y-6">
                            {/* Value History Graph (Simplified SVG) */}
                            <div className="bg-slate-800 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2"><BarChart3 size={14} /> Historique de Valeur</h4>
                                <div className="h-32 flex items-end gap-2 border-b border-slate-600 pb-2 px-2">
                                    {selectedItem.valueHistory && selectedItem.valueHistory.length > 0 ? (
                                        selectedItem.valueHistory.map((point, i) => (
                                            <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                                                <div className="w-full bg-emerald-500/50 hover:bg-emerald-500 rounded-t-sm transition-all" style={{ height: `${(point.value / Math.max(...selectedItem.valueHistory!.map(v=>v.value))) * 100}%` }}></div>
                                                <div className="absolute -top-8 bg-black text-white text-[10px] p-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">{point.value}{currencySymbol} ({point.date})</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 italic">Pas assez de données</div>
                                    )}
                                </div>
                            </div>

                            {/* Upgrade Comparator */}
                            <div className="border-t border-slate-800 pt-4">
                                <h4 className="text-sm font-bold text-white mb-2">Comparateur Upgrade (IA)</h4>
                                {!upgradeInfo ? (
                                    <button onClick={handleCompareUpgrade} disabled={loadingFeature} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs rounded-lg border border-slate-700">
                                        {loadingFeature ? "Analyse..." : "Comparer avec le dernier modèle"}
                                    </button>
                                ) : (
                                    <div className="bg-slate-800 p-3 rounded-lg text-xs space-y-2">
                                        <p className="text-slate-400">Modèle actuel: <span className="text-white">{upgradeInfo.currentModel}</span></p>
                                        <p className="text-emerald-400 font-bold">Nouveau: {upgradeInfo.newModel}</p>
                                        <ul className="list-disc pl-4 text-slate-300">{upgradeInfo.improvements.map((imp:string, i:number)=><li key={i}>{imp}</li>)}</ul>
                                        <div className="mt-2 p-2 bg-slate-900 rounded border border-slate-700 text-center font-bold text-white">Verdict: {upgradeInfo.verdict}</div>
                                    </div>
                                )}
                            </div>

                            {/* Sales Ad Generator */}
                            <div className="border-t border-slate-800 pt-4">
                                <h4 className="text-sm font-bold text-white mb-2">Vendre cet objet</h4>
                                {!salesAd ? (
                                    <button onClick={handleGenerateSalesAd} disabled={loadingFeature} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-bold">
                                        {loadingFeature ? "Rédaction..." : "Générer Annonce de Vente"}
                                    </button>
                                ) : (
                                    <div className="bg-slate-800 p-3 rounded-lg space-y-2">
                                        <p className="font-bold text-white text-sm">{salesAd.title}</p>
                                        <p className="text-xs text-slate-400 italic">{salesAd.description}</p>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                            <span className="text-xs text-slate-500">Prix suggéré:</span>
                                            <span className="text-emerald-400 font-bold">{salesAd.recommendedPrice} {currencySymbol}</span>
                                        </div>
                                        <button onClick={() => {navigator.clipboard.writeText(`${salesAd.title}\n${salesAd.description}`); alert("Copié !")}} className="w-full mt-2 py-1 bg-slate-700 text-xs text-white rounded hover:bg-slate-600">Copier le texte</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: DOCUMENTS (Suggestion #2) */}
                    {activeTab === 'DOCUMENTS' && (
                        <div className="space-y-4">
                             <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl mb-4">
                                <h3 className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <FileText size={16} /> Documents & Factures
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Centralisez vos preuves d'achat et garanties ici. (Utilisez le scanner Facture dans le menu Vision)
                                </p>
                            </div>
                            
                            {selectedItem.documents && selectedItem.documents.length > 0 ? (
                                selectedItem.documents.map(doc => (
                                    <div key={doc.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-3">
                                        <div className="p-2 bg-slate-700 rounded text-purple-300"><FileText size={16} /></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{doc.name}</p>
                                            <p className="text-xs text-slate-500">{doc.type} • {doc.date || 'Pas de date'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 text-xs py-4">Aucun document attaché.</p>
                            )}
                            
                            <button className="w-full py-2 border border-dashed border-slate-600 text-slate-500 rounded-lg text-xs hover:bg-slate-800 hover:text-white transition-colors">
                                + Attacher un fichier (Simulation)
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
      )}

       {/* Modal Ajout (Simplifié pour l'exemple) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4">Nouvel Objet</h2>
                <input type="text" placeholder="Nom" className="w-full bg-slate-800 mb-3 p-3 rounded-lg text-white" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400">Annuler</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Ajouter</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default InventoryView;