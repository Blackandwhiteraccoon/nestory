import React from 'react';

export type ViewState = 'HUB' | 'INVENTORY' | 'STOCK_MANAGER' | 'VISION' | 'PRICE_UPDATER' | 'SETTINGS' | 'VOICE_AGENT' | 'SUBSCRIPTION';

export type SubscriptionTier = 'FREE' | 'BASE' | 'PRO' | 'PLATINUM' | 'EARLY_BIRD';

export type PaymentMethod = 'CARD' | 'CRYPTO';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt?: string;
  isEarlyBird?: boolean;
}

export interface TierLimits {
  maxItems: number | 'unlimited';
  has3DScan: boolean;
  oneClickListingLimit: number;
  hasBetaFeatures: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierLimits> = {
  FREE: { maxItems: 50, has3DScan: false, oneClickListingLimit: 0, hasBetaFeatures: false },
  BASE: { maxItems: 'unlimited', has3DScan: false, oneClickListingLimit: 0, hasBetaFeatures: false },
  PRO: { maxItems: 'unlimited', has3DScan: true, oneClickListingLimit: 10, hasBetaFeatures: false },
  PLATINUM: { maxItems: 'unlimited', has3DScan: true, oneClickListingLimit: 'unlimited' as any, hasBetaFeatures: true },
  EARLY_BIRD: { maxItems: 'unlimited', has3DScan: true, oneClickListingLimit: 'unlimited' as any, hasBetaFeatures: true },
};

export interface Message {
  role: 'user' | 'model' | 'error';
  content: string;
  image?: string; // base64
}

export enum LoadingState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}

export interface HubOption {
  id: ViewState;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface MaintenanceTask {
  id: string;
  task: string;
  frequency: string; // "Mensuel", "Annuel", etc.
  lastPerformed?: string;
  isDone: boolean;
}

export interface ValueHistoryPoint {
  date: string;
  value: number;
}

export interface AttachedDocument {
  id: string;
  type: 'INVOICE' | 'WARRANTY' | 'MANUAL' | 'OTHER';
  name: string;
  content?: string; // Extracted text or summary
  date?: string;
  imageUrl?: string;
}

export interface InventoryItem {
  id: string;
  image: string | null;
  name: string;
  category: string;
  brand: string;
  location: string;
  condition: string;
  quantity: number;
  serialNumber?: string;
  barcode?: string; 
  notes?: string;
  tags?: string[];
  acquisitionDate: string;
  purchasePrice: number;
  resaleValue: number;
  
  // Financial Audit
  lastValuationDate?: string; 
  valuationDetails?: string; 
  valueHistory?: ValueHistoryPoint[];

  // Suggestion #9: Maintenance
  maintenancePlan?: MaintenanceTask[];

  // Suggestion #2: Documents (Factures/Garanties)
  documents?: AttachedDocument[];
}