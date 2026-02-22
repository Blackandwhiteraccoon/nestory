import React, { useState } from "react";
import { useEffect } from "react";
import { supabase } from "./src/lib/supabase";
import AuthView from "./components/AuthView.tsx";
import MainHub from "./components/MainHub";
import InventoryView from "./components/InventoryView";
import StockManagerView from "./components/StockManagerView";
import VisionView from "./components/VisionView";
import PriceUpdaterView from "./components/PriceUpdaterView";
import SettingsView from "./components/SettingsView";
import VoiceAgentView from "./components/VoiceAgentView";
import SubscriptionView from "./components/SubscriptionView";
import {
  ViewState,
  InventoryItem,
  SubscriptionTier,
  TIER_CONFIG,
  SubscriptionState,
} from "./types";
import { Home, ChevronRight, Crown, Clock } from "lucide-react";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // application state – always declared before any conditional return
  const [currentView, setCurrentView] = useState<ViewState>("HUB");
  const [currency, setCurrency] = useState("EUR");
  const [language, setLanguage] = useState("fr");
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: "FREE",
  });

  // État de l'inventaire remonté ici pour être partagé
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: "1",
      image: null,
      name: "MacBook Pro M2",
      category: "Électronique",
      brand: "Apple",
      location: "Bureau",
      condition: "Excellent",
      quantity: 1,
      acquisitionDate: "2023-05-15",
      purchasePrice: 2399,
      resaleValue: 1800,
      serialNumber: "C02XY123Z",
      barcode: "",
      notes: "Utilisé pour le développement pro.",
      lastValuationDate: "2023-05-15",
    },
    {
      id: "2",
      image: null,
      name: "Chaise Aeron",
      category: "Mobilier",
      brand: "Herman Miller",
      location: "Bureau",
      condition: "Bon",
      quantity: 2,
      acquisitionDate: "2022-11-10",
      purchasePrice: 1200,
      resaleValue: 900,
      barcode: "",
      notes: "Quelques marques sur les accoudoirs.",
      lastValuationDate: "2022-11-10",
    },
  ]);

  if (authLoading)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">🦝 Chargement...</p>
      </div>
    );

  if (!user) return <AuthView onAuthSuccess={() => {}} />;

  const addToInventory = (item: InventoryItem) => {
    const limits = TIER_CONFIG[subscription.tier];
    if (
      limits.maxItems !== "unlimited" &&
      inventoryItems.length >= limits.maxItems
    ) {
      alert(
        `Limite atteinte ! Votre plan ${subscription.tier} est limité à ${limits.maxItems} objets. Passez au plan supérieur pour continuer.`,
      );
      setCurrentView("SUBSCRIPTION");
      return;
    }
    setInventoryItems((prev) => [item, ...prev]);
  };

  const renderView = () => {
    switch (currentView) {
      case "INVENTORY":
        return (
          <InventoryView
            items={inventoryItems}
            setItems={setInventoryItems}
            currency={currency}
          />
        );
      case "STOCK_MANAGER":
        return (
          <StockManagerView
            items={inventoryItems}
            setItems={setInventoryItems}
          />
        );
      case "PRICE_UPDATER":
        return (
          <PriceUpdaterView
            items={inventoryItems}
            setItems={setInventoryItems}
            currency={currency}
          />
        );
      case "SETTINGS":
        return (
          <SettingsView
            items={inventoryItems}
            setItems={setInventoryItems}
            currency={currency}
            setCurrency={setCurrency}
            language={language}
            setLanguage={setLanguage}
            onNavigate={setCurrentView}
            subscriptionTier={subscription.tier}
          />
        );
      case "VISION":
        return (
          <VisionView
            items={inventoryItems}
            onAddItem={addToInventory}
            onNavigate={setCurrentView}
            currency={currency}
            subscriptionTier={subscription.tier}
          />
        );
      case "VOICE_AGENT":
        return (
          <VoiceAgentView onAddItem={addToInventory} currency={currency} />
        );
      case "SUBSCRIPTION":
        return (
          <SubscriptionView
            currentTier={subscription.tier}
            onUpgrade={(tier, durationMonths) => {
              const expiresAt = durationMonths
                ? new Date(
                    Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000,
                  ).toISOString()
                : undefined;

              setSubscription({
                tier,
                expiresAt,
                isEarlyBird: tier === "EARLY_BIRD",
              });
              setCurrentView("HUB");
            }}
          />
        );
      case "HUB":
      default:
        return (
          <MainHub
            onNavigate={setCurrentView}
            itemCount={inventoryItems.length}
            subscriptionTier={subscription.tier}
          />
        );
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case "INVENTORY":
        return "Mon Inventaire";
      case "STOCK_MANAGER":
        return "Gestion de Stock";
      case "PRICE_UPDATER":
        return "Audit Financier";
      case "VISION":
        return "Analyse & Scan";
      case "VOICE_AGENT":
        return "Assistant Vocal";
      case "SETTINGS":
        return "Paramètres";
      case "SUBSCRIPTION":
        return "Abonnement";
      default:
        return "Hub";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 relative overflow-x-hidden">
      {/* Background Ambient Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <nav className="relative z-50 w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              onClick={() => setCurrentView("HUB")}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
                <Home size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Nexus<span className="text-blue-400">AI</span>
              </span>
            </div>

            <div
              onClick={() => setCurrentView("SUBSCRIPTION")}
              className={`ml-4 flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                subscription.tier === "FREE"
                  ? "border-slate-700 bg-slate-800/50 text-slate-400"
                  : subscription.tier === "BASE"
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : subscription.tier === "PRO"
                      ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                      : subscription.tier === "EARLY_BIRD"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold"
              }`}
            >
              {subscription.isEarlyBird ? (
                <Clock size={14} />
              ) : (
                <Crown size={14} />
              )}
              <span className="text-xs uppercase tracking-wider">
                {subscription.tier}
                {subscription.expiresAt &&
                  ` (Exp: ${new Date(subscription.expiresAt).toLocaleDateString()})`}
              </span>
            </div>

            {currentView !== "HUB" && (
              <div className="flex items-center gap-2 text-slate-400 animate-fade-in">
                <ChevronRight size={16} />
                <span className="text-slate-200 font-medium px-2 py-1 bg-white/5 rounded-md border border-white/5 text-sm">
                  {getTitle()}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center min-h-[calc(100vh-64px)]">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
