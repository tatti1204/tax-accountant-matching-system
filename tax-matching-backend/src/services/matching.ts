import { PrismaClient } from '@/generated/prisma';
// import { DiagnosisAnswers } from './diagnosis';

const prisma = new PrismaClient();

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
  taxAccountant?: any; // Will be populated with tax accountant details
}

export class MatchingService {
  static async generateMatches(
    diagnosisResultId: string,
    criteria: MatchingCriteria,
    limit = 5
  ): Promise<TaxAccountantMatch[]> {
    // Get all active tax accountants with their details
    const taxAccountants = await prisma.taxAccountant.findMany({
      where: {
        isAcceptingClients: true,
        user: { isActive: true },
      },
      include: {
        user: {
          include: { profile: true },
        },
        specialties: {
          include: { specialty: true },
        },
        pricingPlans: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { isVisible: true },
        },
      },
    });

    // Calculate matches for each tax accountant
    const matches: TaxAccountantMatch[] = [];

    for (const taxAccountant of taxAccountants) {
      const match = this.calculateMatch(taxAccountant, criteria);
      if (match.score > 0) {
        matches.push(match);
      }
    }

    // Sort by score and limit results
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Save matching results to database
    const matchingResults = await Promise.all(
      topMatches.map((match, index) =>
        prisma.matchingResult.create({
          data: {
            diagnosisResultId,
            taxAccountantId: match.taxAccountantId,
            matchingScore: match.score,
            matchingReasonsJson: JSON.stringify(match.reasons),
            rank: index + 1,
          },
        })
      )
    );

    // Return matches with database IDs
    return topMatches.map((match, index) => ({
      ...match,
      id: matchingResults[index].id,
    }));
  }

  private static calculateMatch(
    taxAccountant: any,
    criteria: MatchingCriteria
  ): TaxAccountantMatch {
    let totalScore = 0;
    const reasons: MatchingReason[] = [];
    const maxScore = 100;

    // 1. Specialty matching (30% weight)
    const specialtyScore = this.calculateSpecialtyScore(taxAccountant, criteria);
    totalScore += specialtyScore * 0.3;
    if (specialtyScore > 0) {
      reasons.push({
        type: 'specialty',
        description: this.getSpecialtyDescription(taxAccountant, criteria),
        score: specialtyScore,
      });
    }

    // 2. Budget matching (25% weight)
    const budgetScore = this.calculateBudgetScore(taxAccountant, criteria);
    totalScore += budgetScore * 0.25;
    if (budgetScore > 0) {
      reasons.push({
        type: 'budget',
        description: this.getBudgetDescription(taxAccountant, criteria),
        score: budgetScore,
      });
    }

    // 3. Location matching (20% weight)
    const locationScore = this.calculateLocationScore(taxAccountant, criteria);
    totalScore += locationScore * 0.2;
    if (locationScore > 0) {
      reasons.push({
        type: 'location',
        description: this.getLocationDescription(taxAccountant, criteria),
        score: locationScore,
      });
    }

    // 4. Experience matching (15% weight)
    const experienceScore = this.calculateExperienceScore(taxAccountant, criteria);
    totalScore += experienceScore * 0.15;
    if (experienceScore > 0) {
      reasons.push({
        type: 'experience',
        description: this.getExperienceDescription(taxAccountant),
        score: experienceScore,
      });
    }

    // 5. Rating bonus (10% weight)
    const ratingScore = this.calculateRatingScore(taxAccountant);
    totalScore += ratingScore * 0.1;
    if (ratingScore > 0) {
      reasons.push({
        type: 'rating',
        description: this.getRatingDescription(taxAccountant),
        score: ratingScore,
      });
    }

    return {
      taxAccountantId: taxAccountant.id,
      score: Math.min(totalScore, maxScore),
      reasons,
      taxAccountant,
    };
  }

  private static calculateSpecialtyScore(taxAccountant: any, criteria: MatchingCriteria): number {
    let score = 0;
    const maxScore = 100;

    // Check if tax accountant has specialties matching business type
    if (criteria.businessType) {
      const matchingSpecialties = taxAccountant.specialties.filter((ts: any) => {
        const specialtyName = ts.specialty.name.toLowerCase();
        const businessType = criteria.businessType!.toLowerCase();
        
        return (
          specialtyName.includes(businessType) ||
          businessType.includes(specialtyName) ||
          this.isRelatedSpecialty(specialtyName, businessType)
        );
      });

      if (matchingSpecialties.length > 0) {
        score += 60;
        
        // Bonus for experience in the specialty
        const avgExperience = matchingSpecialties.reduce(
          (sum: number, ts: any) => sum + (ts.yearsOfExperience || 0),
          0
        ) / matchingSpecialties.length;
        
        score += Math.min(avgExperience * 2, 40); // Max 40 points for experience
      }
    }

    // Check for general specialties that might be relevant
    if (criteria.needs && criteria.needs.length > 0) {
      const relevantSpecialties = taxAccountant.specialties.filter((ts: any) =>
        criteria.needs!.some((need: string) =>
          ts.specialty.name.toLowerCase().includes(need.toLowerCase())
        )
      );
      score += relevantSpecialties.length * 15; // 15 points per relevant specialty
    }

    return Math.min(score, maxScore);
  }

  private static calculateBudgetScore(taxAccountant: any, criteria: MatchingCriteria): number {
    if (!criteria.budget || !taxAccountant.pricingPlans.length) {
      return 50; // Neutral score if no budget info
    }

    const minPrice = Math.min(...taxAccountant.pricingPlans.map((plan: any) => plan.basePrice));
    const budgetDifference = Math.abs(criteria.budget - minPrice);
    const budgetPercentDiff = budgetDifference / criteria.budget;

    if (budgetPercentDiff <= 0.1) return 100; // Within 10%
    if (budgetPercentDiff <= 0.2) return 80;  // Within 20%
    if (budgetPercentDiff <= 0.3) return 60;  // Within 30%
    if (budgetPercentDiff <= 0.5) return 40;  // Within 50%
    
    return 20; // More than 50% difference
  }

  private static calculateLocationScore(taxAccountant: any, criteria: MatchingCriteria): number {
    if (!criteria.location || !taxAccountant.user.profile) {
      return 50; // Neutral score if no location info
    }

    const userLocation = criteria.location.toLowerCase();
    const taxAccountantPrefecture = taxAccountant.user.profile.prefecture?.toLowerCase() || '';
    const taxAccountantCity = taxAccountant.user.profile.city?.toLowerCase() || '';

    if (taxAccountantPrefecture.includes(userLocation) || userLocation.includes(taxAccountantPrefecture)) {
      return 100; // Same prefecture
    }

    if (taxAccountantCity.includes(userLocation) || userLocation.includes(taxAccountantCity)) {
      return 90; // Same city
    }

    // Check for nearby prefectures (simplified)
    const nearbyRegions = this.getNearbyRegions(userLocation);
    if (nearbyRegions.includes(taxAccountantPrefecture)) {
      return 70; // Nearby region
    }

    return 30; // Different region
  }

  private static calculateExperienceScore(taxAccountant: any, _criteria: MatchingCriteria): number {
    const yearsOfExperience = taxAccountant.yearsOfExperience || 0;
    
    if (yearsOfExperience >= 20) return 100;
    if (yearsOfExperience >= 15) return 90;
    if (yearsOfExperience >= 10) return 80;
    if (yearsOfExperience >= 5) return 70;
    if (yearsOfExperience >= 3) return 60;
    if (yearsOfExperience >= 1) return 50;
    
    return 30; // Less than 1 year
  }

  private static calculateRatingScore(taxAccountant: any): number {
    if (!taxAccountant.averageRating || taxAccountant.totalReviews === 0) {
      return 50; // Neutral score for no reviews
    }

    const rating = parseFloat(taxAccountant.averageRating.toString());
    return Math.min(rating * 20, 100); // Convert 5-star to 100-point scale
  }

  // Helper methods
  private static isRelatedSpecialty(specialtyName: string, businessType: string): boolean {
    const relations = {
      'it': ['個人事業主', 'スタートアップ', 'フリーランス'],
      'ec': ['小売', 'retail', '個人事業主'],
      '飲食': ['個人事業主', 'サービス業'],
      '不動産': ['法人税務', '相続'],
    };

    for (const [key, values] of Object.entries(relations)) {
      if (businessType.includes(key) && values.some(v => specialtyName.includes(v))) {
        return true;
      }
    }

    return false;
  }

  private static getNearbyRegions(location: string): string[] {
    const regionMap: { [key: string]: string[] } = {
      '東京': ['神奈川', '埼玉', '千葉'],
      '神奈川': ['東京', '静岡'],
      '大阪': ['京都', '兵庫', '奈良'],
      '愛知': ['岐阜', '三重', '静岡'],
      // Add more as needed
    };

    return regionMap[location] || [];
  }

  private static getSpecialtyDescription(taxAccountant: any, criteria: MatchingCriteria): string {
    const matchingSpecialties = taxAccountant.specialties
      .filter((ts: any) => {
        if (!criteria.businessType) return false;
        const specialtyName = ts.specialty.name.toLowerCase();
        const businessType = criteria.businessType.toLowerCase();
        return specialtyName.includes(businessType) || businessType.includes(specialtyName);
      })
      .map((ts: any) => ts.specialty.name);

    if (matchingSpecialties.length > 0) {
      return `${matchingSpecialties[0]}の豊富な実績`;
    }

    return '関連分野の経験あり';
  }

  private static getBudgetDescription(taxAccountant: any, criteria: MatchingCriteria): string {
    if (!criteria.budget || !taxAccountant.pricingPlans.length) {
      return '料金プランあり';
    }

    const minPrice = Math.min(...taxAccountant.pricingPlans.map((plan: any) => plan.basePrice));
    
    if (minPrice <= criteria.budget) {
      return '予算内のプラン提供';
    }

    return '柔軟な料金設定';
  }

  private static getLocationDescription(taxAccountant: any, _criteria: MatchingCriteria): string {
    const prefecture = taxAccountant.user.profile?.prefecture || '';
    
    if (prefecture) {
      return `${prefecture}を拠点としてサービス提供`;
    }

    return '地域密着型サービス';
  }

  private static getExperienceDescription(taxAccountant: any): string {
    const years = taxAccountant.yearsOfExperience || 0;
    
    if (years >= 20) return '20年以上の豊富な経験';
    if (years >= 10) return '10年以上の実務経験';
    if (years >= 5) return '5年以上の実務経験';
    
    return '実務経験豊富';
  }

  private static getRatingDescription(taxAccountant: any): string {
    const rating = parseFloat(taxAccountant.averageRating?.toString() || '0');
    
    if (rating >= 4.5) return '高評価（4.5★以上）';
    if (rating >= 4.0) return '好評価（4.0★以上）';
    
    return 'クライアント満足度が高い';
  }

  static async getMatchingResults(diagnosisResultId: string) {
    const results = await prisma.matchingResult.findMany({
      where: { diagnosisResultId },
      include: {
        taxAccountant: {
          include: {
            user: {
              include: { profile: true },
            },
            specialties: {
              include: { specialty: true },
            },
            pricingPlans: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
            },
            reviews: {
              where: { isVisible: true },
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return results.map(result => ({
      ...result,
      matchingReasons: JSON.parse(result.matchingReasonsJson as string),
      matchingReasonsJson: undefined,
    }));
  }

  static async getMatchingStats(fromDate?: Date, toDate?: Date) {
    const whereClause: any = {};
    
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt.gte = fromDate;
      if (toDate) whereClause.createdAt.lte = toDate;
    }

    const [
      totalMatches,
      totalDiagnoses,
      avgMatchingScore,
      topSpecialties,
      matchDistribution
    ] = await Promise.all([
      prisma.matchingResult.count({ where: whereClause }),
      prisma.aIDiagnosisResult.count({ 
        where: fromDate || toDate ? { createdAt: whereClause.createdAt } : {}
      }),
      prisma.matchingResult.aggregate({
        where: whereClause,
        _avg: { matchingScore: true },
      }),
      prisma.matchingResult.groupBy({
        by: ['taxAccountantId'],
        where: whereClause,
        _count: { taxAccountantId: true },
        orderBy: { _count: { taxAccountantId: 'desc' } },
        take: 10,
      }).then(async (results) => {
        const taxAccountantIds = results.map(r => r.taxAccountantId);
        const taxAccountants = await prisma.taxAccountant.findMany({
          where: { id: { in: taxAccountantIds } },
          include: {
            specialties: { include: { specialty: true } },
            user: { include: { profile: true } },
          },
        });
        
        return results.map(result => ({
          ...result,
          taxAccountant: taxAccountants.find(ta => ta.id === result.taxAccountantId),
        }));
      }),
      prisma.matchingResult.groupBy({
        by: ['matchingScore'],
        where: whereClause,
        _count: { matchingScore: true },
        orderBy: { matchingScore: 'desc' },
      }),
    ]);

    // Calculate success rate (matches with score > 70)
    const highQualityMatches = await prisma.matchingResult.count({
      where: {
        ...whereClause,
        matchingScore: { gte: 70 },
      },
    });

    return {
      totalMatches,
      totalDiagnoses,
      matchRate: totalDiagnoses > 0 ? (totalMatches / totalDiagnoses) : 0,
      averageMatchingScore: avgMatchingScore._avg.matchingScore || 0,
      successRate: totalMatches > 0 ? (highQualityMatches / totalMatches) * 100 : 0,
      topMatchedTaxAccountants: topSpecialties,
      scoreDistribution: matchDistribution.map(item => ({
        scoreRange: `${Math.floor(parseFloat(item.matchingScore.toString()) / 10) * 10}-${Math.floor(parseFloat(item.matchingScore.toString()) / 10) * 10 + 9}`,
        count: item._count.matchingScore,
      })),
    };
  }

  // Enhanced scoring algorithm with more sophisticated matching
  static async getAdvancedMatchingScore(
    taxAccountant: any,
    criteria: MatchingCriteria,
    userProfile?: any
  ): Promise<{ score: number; reasons: MatchingReason[] }> {
    let totalScore = 0;
    const reasons: MatchingReason[] = [];
    const weights = {
      specialty: 0.35,    // Increased weight for specialty matching
      budget: 0.25,
      location: 0.15,
      experience: 0.15,
      rating: 0.10,
    };

    // 1. Advanced specialty matching
    const specialtyResult = this.calculateAdvancedSpecialtyScore(taxAccountant, criteria);
    totalScore += specialtyResult.score * weights.specialty;
    if (specialtyResult.score > 0) {
      reasons.push({
        type: 'specialty',
        description: specialtyResult.description,
        score: specialtyResult.score,
      });
    }

    // 2. Budget compatibility with multiple pricing tiers
    const budgetResult = this.calculateAdvancedBudgetScore(taxAccountant, criteria);
    totalScore += budgetResult.score * weights.budget;
    if (budgetResult.score > 0) {
      reasons.push({
        type: 'budget',
        description: budgetResult.description,
        score: budgetResult.score,
      });
    }

    // 3. Location with distance calculation
    const locationResult = this.calculateAdvancedLocationScore(taxAccountant, criteria);
    totalScore += locationResult.score * weights.location;
    if (locationResult.score > 0) {
      reasons.push({
        type: 'location',
        description: locationResult.description,
        score: locationResult.score,
      });
    }

    // 4. Experience with business size matching
    const experienceResult = this.calculateAdvancedExperienceScore(taxAccountant, criteria, userProfile);
    totalScore += experienceResult.score * weights.experience;
    if (experienceResult.score > 0) {
      reasons.push({
        type: 'experience',
        description: experienceResult.description,
        score: experienceResult.score,
      });
    }

    // 5. Rating with review quality analysis
    const ratingResult = this.calculateAdvancedRatingScore(taxAccountant);
    totalScore += ratingResult.score * weights.rating;
    if (ratingResult.score > 0) {
      reasons.push({
        type: 'rating',
        description: ratingResult.description,
        score: ratingResult.score,
      });
    }

    return {
      score: Math.min(totalScore, 100),
      reasons: reasons.sort((a, b) => b.score - a.score), // Sort by highest scoring reasons
    };
  }

  private static calculateAdvancedSpecialtyScore(taxAccountant: any, criteria: MatchingCriteria) {
    let score = 0;
    let description = '関連分野の経験あり';
    
    const specialties = taxAccountant.specialties || [];
    
    if (criteria.businessType) {
      // Direct specialty matches
      const directMatches = specialties.filter((ts: any) => {
        const specialtyName = ts.specialty.name.toLowerCase();
        const businessType = criteria.businessType!.toLowerCase();
        return specialtyName.includes(businessType) || businessType.includes(specialtyName);
      });

      if (directMatches.length > 0) {
        score += 70;
        const avgExperience = directMatches.reduce(
          (sum: number, ts: any) => sum + (ts.yearsOfExperience || 0),
          0
        ) / directMatches.length;
        score += Math.min(avgExperience * 3, 30); // Up to 30 bonus points
        description = `${directMatches[0].specialty.name}の専門知識（${avgExperience}年の経験）`;
      }

      // Related specialty matches
      const relatedMatches = specialties.filter((ts: any) => 
        this.isRelatedSpecialty(ts.specialty.name.toLowerCase(), criteria.businessType!.toLowerCase())
      );
      
      if (relatedMatches.length > 0 && directMatches.length === 0) {
        score += 40;
        description = `関連分野（${relatedMatches[0].specialty.name}）の経験`;
      }
    }

    // Match specific needs
    if (criteria.needs && criteria.needs.length > 0) {
      const needMatches = specialties.filter((ts: any) =>
        criteria.needs!.some((need: string) =>
          ts.specialty.name.toLowerCase().includes(need.toLowerCase())
        )
      );
      score += needMatches.length * 10; // 10 points per matched need
    }

    return { score: Math.min(score, 100), description };
  }

  private static calculateAdvancedBudgetScore(taxAccountant: any, criteria: MatchingCriteria) {
    if (!criteria.budget || !taxAccountant.pricingPlans.length) {
      return { score: 50, description: '料金プランあり' };
    }

    const plans = taxAccountant.pricingPlans;
    const prices = plans.map((plan: any) => plan.basePrice);
    const minPrice = Math.min(...prices);
    
    let score = 0;
    let description = '';

    if (minPrice <= criteria.budget) {
      // Budget fits within range
      if (minPrice <= criteria.budget * 0.8) {
        score = 100; // Well within budget
        description = `予算内のお得なプラン（月額${minPrice.toLocaleString()}円～）`;
      } else {
        score = 85; // Just within budget
        description = `予算内のプラン（月額${minPrice.toLocaleString()}円～）`;
      }
    } else {
      // Budget doesn't fit, calculate how close it is
      const budgetDiff = (minPrice - criteria.budget) / criteria.budget;
      if (budgetDiff <= 0.2) {
        score = 65; // Within 20%
        description = `柔軟な料金設定（月額${minPrice.toLocaleString()}円～）`;
      } else if (budgetDiff <= 0.5) {
        score = 40; // Within 50%
        description = `相談可能な料金設定`;
      } else {
        score = 20;
        description = `プレミアムサービス`;
      }
    }

    return { score, description };
  }

  private static calculateAdvancedLocationScore(taxAccountant: any, criteria: MatchingCriteria) {
    if (!criteria.location || !taxAccountant.user.profile) {
      return { score: 50, description: '地域密着型サービス' };
    }

    const userLocation = criteria.location.toLowerCase();
    const taxAccountantPrefecture = taxAccountant.user.profile.prefecture?.toLowerCase() || '';
    const taxAccountantCity = taxAccountant.user.profile.city?.toLowerCase() || '';

    let score = 0;
    let description = '';

    if (taxAccountantPrefecture === userLocation || taxAccountantCity === userLocation) {
      score = 100;
      description = `地元密着（${taxAccountant.user.profile.prefecture}）`;
    } else if (taxAccountantPrefecture.includes(userLocation) || userLocation.includes(taxAccountantPrefecture)) {
      score = 90;
      description = `同じ都道府県内でサービス提供`;
    } else {
      // Check for nearby regions
      const nearbyRegions = this.getNearbyRegions(userLocation);
      if (nearbyRegions.includes(taxAccountantPrefecture)) {
        score = 70;
        description = `近隣地域（${taxAccountant.user.profile.prefecture}）でサービス提供`;
      } else {
        score = 30;
        description = `リモート対応可能`;
      }
    }

    return { score, description };
  }

  private static calculateAdvancedExperienceScore(taxAccountant: any, criteria: MatchingCriteria, userProfile?: any) {
    const years = taxAccountant.yearsOfExperience || 0;
    let score = 0;
    let description = '';

    // Base experience score
    if (years >= 20) {
      score = 100;
      description = `豊富な実務経験（${years}年）`;
    } else if (years >= 15) {
      score = 90;
      description = `十分な実務経験（${years}年）`;
    } else if (years >= 10) {
      score = 80;
      description = `確かな実務経験（${years}年）`;
    } else if (years >= 5) {
      score = 70;
      description = `実務経験（${years}年）`;
    } else if (years >= 3) {
      score = 60;
      description = `基本的な実務経験（${years}年）`;
    } else {
      score = 40;
      description = `新しい視点でのサービス提供`;
    }

    // Bonus for business size matching
    if (userProfile && criteria.revenue) {
      const avgClientRevenue = 50000000; // Mock average client revenue
      const revenueDiff = Math.abs(criteria.revenue - avgClientRevenue) / avgClientRevenue;
      if (revenueDiff <= 0.5) {
        score += 10; // Bonus for similar business size experience
        description += '（同規模企業の経験豊富）';
      }
    }

    return { score: Math.min(score, 100), description };
  }

  private static calculateAdvancedRatingScore(taxAccountant: any) {
    if (!taxAccountant.averageRating || taxAccountant.totalReviews === 0) {
      return { score: 50, description: 'サービス提供中' };
    }

    const rating = parseFloat(taxAccountant.averageRating.toString());
    const reviewCount = taxAccountant.totalReviews;
    
    let score = rating * 20; // Base score from rating
    
    // Bonus for review count (reliability indicator)
    if (reviewCount >= 50) {
      score += 10;
    } else if (reviewCount >= 20) {
      score += 5;
    }

    let description = '';
    if (rating >= 4.8) {
      description = `最高評価（${rating}★、${reviewCount}件のレビュー）`;
    } else if (rating >= 4.5) {
      description = `高評価（${rating}★、${reviewCount}件のレビュー）`;
    } else if (rating >= 4.0) {
      description = `好評価（${rating}★、${reviewCount}件のレビュー）`;
    } else {
      description = `実績あり（${rating}★、${reviewCount}件のレビュー）`;
    }

    return { score: Math.min(score, 100), description };
  }
}