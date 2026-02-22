import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Boxes, Search, Minus, Plus, Trash2, Package, ScanBarcode, QrCode, Printer } from 'lucide-react';

// Déclaration pour la lib QRCode chargée via CDN
declare const QRCode: any;

interface StockManagerViewProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const StockManagerView: React.FC<StockManagerViewProps> = ({ items, setItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const handleQuantityChange = (id: string, change: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // Suggestion #6: Generate QR Container Label
  const handleGenerateContainerQR = (location: string) => {
     // Juste une simulation visuelle
     setQrPreview(location);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet objet ?')) {
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group items by location for "Container View"
  const locations: string[] = Array.from(new Set(items.map(i => i.location).filter((l): l is string => !!l)));

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      
      {/* Modal QR Preview */}
      {qrPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setQrPreview(null)}>
              <div className="bg-white p-8 rounded-2xl text-center" onClick={e => e.stopPropagation()}>
                   <h3 className="text-black font-bold text-xl mb-4">Étiquette: {qrPreview}</h3>
                   <div className="flex justify-center mb-4" ref={(el) => {
                       if (el && !el.innerHTML) {
                           // @ts-ignore
                           new QRCode(el, { text: `NEXUS-LOC:${qrPreview}`, width: 200, height: 200 });
                       }
                   }} />
                   <p className="text-gray-500 text-sm mb-6">Collez ce code sur votre carton/boîte.</p>
                   <button className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 mx-auto hover:bg-blue-500">
                       <Printer size={16} /> Imprimer
                   </button>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <Boxes className="text-orange-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Gestion de Stock</h2>
            <p className="text-slate-400 text-sm">Gérez les quantités et les étiquettes de rangement.</p>
          </div>
        </div>
      </div>
      
      {/* Container Quick Actions */}
      <div className="mb-8 overflow-x-auto pb-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><QrCode size={18} /> Étiquettes de Rangement (QR)</h3>
          <div className="flex gap-4">
              {locations.map(loc => (
                  <button key={loc} onClick={() => handleGenerateContainerQR(loc)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap">
                      {loc}
                  </button>
              ))}
          </div>
      </div>

      {/* List View */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <div className="divide-y divide-slate-800">
            {filteredItems.map(item => (
              <div key={item.id} className="flex flex-col md:flex-row items-center p-4 hover:bg-white/5 transition-colors gap-4 md:gap-6">
                <div className="w-16 h-16 flex-shrink-0 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="text-slate-600 m-auto mt-4" size={20} />}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-white text-lg">{item.name}</h3>
                  <div className="text-sm text-slate-400">{item.location} • {item.brand}</div>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                  <button onClick={() => handleQuantityChange(item.id, -1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"><Minus size={18} /></button>
                  <span className="w-12 text-center text-xl font-bold text-white">{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.id, 1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"><Plus size={18} /></button>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default StockManagerView;