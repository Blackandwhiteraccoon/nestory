import React from 'react';
import { Check, Star, Zap, Crown, Rocket, Clock, CreditCard, Bitcoin, ShieldCheck, X } from 'lucide-react';
import { SubscriptionTier, TIER_CONFIG, PaymentMethod } from '../types';

interface SubscriptionViewProps {
  currentTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier, durationMonths?: number) => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ currentTier, onUpgrade }) => {
  const [showCheckout, setShowCheckout] = React.useState<{ tier: SubscriptionTier; name: string; price: string; duration?: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CARD');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const tiers: { id: SubscriptionTier; name: string; price: string; icon: any; color: string; features: string[]; duration?: number }[] = [
    {
      id: 'FREE',
      name: 'Free',
      price: '0€',
      icon: <Rocket className="text-slate-400" />,
      color: 'border-slate-700',
      features: ['Jusqu\'à 50 objets', 'Analyse photo standard', 'Gestion de stock de base']
    },
    {
      id: 'BASE',
      name: 'Base',
      price: '4.99€/mois',
      icon: <Star className="text-blue-400" />,
      color: 'border-blue-500/30',
      features: ['Objets illimités', 'Historique des prix', 'Support prioritaire']
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '9.99€/mois',
      icon: <Zap className="text-purple-400" />,
      color: 'border-purple-500/50',
      features: ['Scan 3D (Vidéo)', 'Mise en vente One-Click (10/mois)', 'Audit financier avancé']
    },
    {
      id: 'PLATINUM',
      name: 'Platinum',
      price: '19.99€/mois',
      icon: <Crown className="text-yellow-400" />,
      color: 'border-yellow-500/50',
      features: ['Tout illimité', 'Accès aux fonctions Bêta', 'Expertise IA personnalisée']
    }
  ];

  const earlyBirdOffers = [
    {
      id: 'EARLY_BIRD' as SubscriptionTier,
      name: 'Early Bird 6M',
      price: '49€',
      duration: 6,
      icon: <Clock className="text-emerald-400" />,
      color: 'border-emerald-500/50 bg-emerald-500/5',
      features: ['Plan Platinum pendant 6 mois', 'Badge Early Bird exclusif', 'Support direct fondateur', 'Accès prioritaire aux nouvelles fonctions']
    },
    {
      id: 'EARLY_BIRD' as SubscriptionTier,
      name: 'Early Bird 12M',
      price: '89€',
      duration: 12,
      icon: <Star className="text-emerald-400" />,
      color: 'border-emerald-500/70 bg-emerald-500/10',
      features: ['Plan Platinum pendant 1 an', 'Badge Early Bird Gold', 'Support direct fondateur', 'Vote sur la roadmap produit']
    }
  ];

  const handleSelectTier = (tier: any) => {
    setShowCheckout({ tier: tier.id, name: tier.name, price: tier.price, duration: tier.duration });
  };

  const handleCompletePayment = () => {
    if (!showCheckout) return;
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      onUpgrade(showCheckout.tier, showCheckout.duration);
      setIsProcessing(false);
      setShowCheckout(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 pb-20">
      {/* Early Bird Hero */}
      <div className="mb-16 glass-panel p-8 rounded-[2rem] border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-600/10 to-blue-600/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <div className="bg-emerald-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
            Offre Limitée
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-4xl font-black text-white mb-4">Devenez un <span className="text-emerald-400">Early Bird</span></h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl">
              Soutenez le développement de Nexus AI et profitez de toutes les fonctionnalités Platinum à un prix réduit. Votre contribution me permet de me consacrer à 100% à l'amélioration de l'application.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-bold">
                <ShieldCheck size={18} /> Paiement Crypto Sécurisé
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-400 font-bold">
                <Check size={18} /> Accès Immédiat
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:w-auto">
            {earlyBirdOffers.map((offer, i) => (
              <div key={i} className={`glass-panel p-6 rounded-3xl border-2 ${offer.color} flex flex-col hover:scale-105 transition-transform cursor-pointer`} onClick={() => handleSelectTier(offer)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/5 rounded-xl">{offer.icon}</div>
                  <h3 className="font-bold text-white">{offer.name}</h3>
                </div>
                <div className="text-3xl font-black text-white mb-4">{offer.price}</div>
                <ul className="space-y-2 mb-6 flex-grow">
                  {offer.features.slice(0, 3).map((f, j) => (
                    <li key={j} className="text-[11px] text-slate-400 flex items-start gap-2">
                      <Check size={12} className="text-emerald-400 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-colors">
                  Soutenir le projet
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Plans Standards</h2>
        <p className="text-slate-400">Abonnements mensuels flexibles pour tous les besoins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div 
            key={tier.id} 
            className={`glass-panel p-8 rounded-3xl border-2 ${tier.color} flex flex-col relative overflow-hidden transition-all duration-300 hover:scale-105 ${currentTier === tier.id ? 'ring-4 ring-blue-500/20' : ''}`}
          >
            {currentTier === tier.id && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                Plan Actuel
              </div>
            )}
            
            <div className="mb-6">
              <div className="p-3 bg-white/5 rounded-2xl w-fit mb-4">
                {tier.icon}
              </div>
              <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mt-2">
                {tier.price}
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectTier(tier)}
              disabled={currentTier === tier.id}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${
                currentTier === tier.id 
                ? 'bg-slate-800 text-slate-500 cursor-default' 
                : 'bg-white text-black hover:bg-blue-500 hover:text-white shadow-xl shadow-white/5'
              }`}
            >
              {currentTier === tier.id ? 'Plan Actuel' : 'Sélectionner'}
            </button>
          </div>
        ))}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white">Finaliser l'achat</h3>
                <button onClick={() => setShowCheckout(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X size={24} /></button>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Produit</span>
                  <span className="text-white font-bold">{showCheckout.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total</span>
                  <span className="text-2xl font-black text-white">{showCheckout.price}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Méthode de paiement</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20'}`}
                  >
                    <CreditCard size={24} />
                    <span className="text-xs font-bold">Carte</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('CRYPTO')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CRYPTO' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20'}`}
                  >
                    <Bitcoin size={24} />
                    <span className="text-xs font-bold">Crypto</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'CRYPTO' && (
                <div className="mb-8 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase mb-2">Paiement Web3</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Connectez votre wallet (MetaMask, Phantom) ou scannez le QR code pour payer en ETH, SOL ou USDC.
                  </p>
                </div>
              )}

              <button 
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Traitement...
                  </>
                ) : (
                  <>Payer {showCheckout.price}</>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-500 mt-4">Paiement sécurisé. Aucun frais caché.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16 glass-panel p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-blue-600/10 to-purple-600/10 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Besoin d'une solution sur mesure ?</h3>
        <p className="text-slate-400 text-sm mb-6">Pour les entreprises ou les collectionneurs avec plus de 10 000 objets, contactez notre équipe.</p>
        <button className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors">
          Contacter le support
        </button>
      </div>
    </div>
  );
};

export default SubscriptionView;
