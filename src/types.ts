export type PhotoCategory = 'receipt' | 'pet' | 'product' | 'document' | 'food' | 'other';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  placeName?: string;
}

export interface FocusPoint {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export interface PetProfile {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breedOrDescription: string;
  registeredAt: string;
  avatarUrl?: string;
}

export interface AnalysisResult {
  category: PhotoCategory;
  categoryLabel: string;
  detectedTitle: string;
  suggestedFilename: string;
  confidence: number;
  details: {
    receiptStore?: string;
    receiptDate?: string;
    receiptAmount?: string;
    receiptTax?: string;
    receiptItems?: string[];
    petName?: string;
    petBreed?: string;
    isKnownPet?: boolean;
    matchedPetId?: string;
    productCategory?: string;
    productBrand?: string;
    documentType?: string;
    documentSummary?: string;
    restaurantName?: string;
    foodDishName?: string;
    locationAddress?: string;
    summary?: string;
  };
  alternativeNames: string[];
  explanation: string;
  location?: LocationData;
}

export interface SavedPhoto {
  id: string;
  dataUrl: string;
  filename: string;
  category: PhotoCategory;
  analysis: AnalysisResult;
  timestamp: string;
  customTags: string[];
  notes: string;
  location?: LocationData;
}

export interface BatchPhotoItem {
  id: string;
  dataUrl: string;
  focusPoint?: FocusPoint;
  analysis?: AnalysisResult;
  isAnalyzing?: boolean;
  error?: string;
  selectedFilename?: string;
  isSaved?: boolean;
  isDownloaded?: boolean;
}

export interface NamingRuleConfig {
  dateFormat: 'YYYYMMDD' | 'YYYY-MM-DD' | 'None';
  includeCategory: boolean;
  includeAmount: boolean;
  separator: '_' | '-' | ' ';
  customPrefix: string;
  extension: string;
}
