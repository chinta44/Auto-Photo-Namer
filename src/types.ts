export type PhotoCategory = 'receipt' | 'pet' | 'product' | 'document' | 'other';

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
    summary?: string;
  };
  alternativeNames: string[];
  explanation: string;
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
}

export interface NamingRuleConfig {
  dateFormat: 'YYYYMMDD' | 'YYYY-MM-DD' | 'None';
  includeCategory: boolean;
  includeAmount: boolean;
  separator: '_' | '-' | ' ';
  customPrefix: string;
  extension: string;
}
