// Export all type definitions from this file

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Diagnosis related types
export interface DiagnosisQuestion {
  id: string;
  questionText: string;
  questionType: 'single' | 'multiple' | 'scale' | 'text';
  options?: DiagnosisOption[];
  category: string;
  weight: number;
  orderIndex: number;
  isActive: boolean;
}

export interface DiagnosisOption {
  id: string;
  text: string;
  value: string;
}

// Matching related types
export interface MatchingCriteria {
  businessType?: string;
  budget?: number;
  needs?: string[];
  frequency?: string;
  location?: string;
  revenue?: number;
  employeeCount?: number;
}

export interface MatchingReason {
  type: 'specialty' | 'budget' | 'location' | 'experience' | 'rating';
  description: string;
  score: number;
}

export interface TaxAccountantMatch {
  taxAccountantId: string;
  score: number;
  reasons: MatchingReason[];
  taxAccountant?: any;
}

export interface MatchingStats {
  totalMatches: number;
  totalDiagnoses: number;
  matchRate: number;
  averageMatchingScore: number;
  successRate: number;
  topMatchedTaxAccountants: any[];
  scoreDistribution: { scoreRange: string; count: number }[];
}

// Tax Accountant related types
export interface TaxAccountantSearchFilters {
  specialties?: string[];
  prefecture?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minExperience?: number;
  isAcceptingClients?: boolean;
  search?: string;
}

export interface TaxAccountantListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'experience' | 'price' | 'reviews';
  sortOrder?: 'asc' | 'desc';
}

export interface EnrichedTaxAccountant {
  id: string;
  officeName: string;
  yearsOfExperience: number;
  bio?: string;
  averageRating?: number;
  totalReviews: number;
  isAcceptingClients: boolean;
  minPrice?: number;
  specialtyNames: string[];
  location?: string;
  user: {
    profile?: {
      firstName?: string;
      lastName?: string;
      prefecture?: string;
      city?: string;
    };
  };
  specialties: any[];
  pricingPlans: any[];
  reviews?: any[];
}