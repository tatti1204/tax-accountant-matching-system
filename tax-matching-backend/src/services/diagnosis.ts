import { PrismaClient } from '@/generated/prisma';
import { MatchingService } from './matching';

const prisma = new PrismaClient();

export interface DiagnosisAnswers {
  [questionId: string]: string | string[] | number;
}

export interface DiagnosisResult {
  userId: string;
  answers: DiagnosisAnswers;
  preferences?: {
    businessType?: string;
    budget?: number;
    needs?: string[];
    frequency?: string;
    location?: string;
  };
}

export class DiagnosisService {
  static async getQuestions() {
    const questions = await prisma.aIDiagnosisQuestion.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        optionsJson: true,
        category: true,
        weight: true,
        orderIndex: true,
      },
    });

    // Parse options JSON
    const questionsWithParsedOptions = questions.map(question => ({
      ...question,
      options: question.optionsJson ? JSON.parse(JSON.stringify(question.optionsJson)) : null,
      optionsJson: undefined, // Remove the raw JSON field
    }));

    return questionsWithParsedOptions;
  }

  static async saveDiagnosisResult(data: DiagnosisResult) {
    const { userId, answers, preferences } = data;

    // Check if user already has a recent diagnosis result
    const existingResult = await prisma.aIDiagnosisResult.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If recent result exists, update it; otherwise create new
    if (existingResult) {
      const updatedResult = await prisma.aIDiagnosisResult.update({
        where: { id: existingResult.id },
        data: {
          answersJson: JSON.stringify(answers),
          preferencesJson: preferences ? JSON.stringify(preferences) : undefined,
          completedAt: new Date(),
        },
      });

      return updatedResult;
    }

    // Create new diagnosis result
    const diagnosisResult = await prisma.aIDiagnosisResult.create({
      data: {
        userId,
        answersJson: JSON.stringify(answers),
        preferencesJson: preferences ? JSON.stringify(preferences) : undefined,
        completedAt: new Date(),
      },
    });

    // Generate matching results automatically
    if (preferences) {
      try {
        await MatchingService.generateMatches(diagnosisResult.id, preferences);
      } catch (error) {
        console.error('Failed to generate matches:', error);
        // Don't throw error, matching can be done later
      }
    }

    return diagnosisResult;
  }

  static async getUserDiagnosisResults(userId: string, limit = 10) {
    const results = await prisma.aIDiagnosisResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        answersJson: true,
        preferencesJson: true,
        completedAt: true,
        createdAt: true,
        matchingResults: {
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
                  take: 1,
                },
              },
            },
          },
          orderBy: { rank: 'asc' },
          take: 5,
        },
      },
    });

    // Parse JSON fields
    const parsedResults = results.map(result => ({
      ...result,
      answers: JSON.parse(result.answersJson as string),
      preferences: result.preferencesJson ? JSON.parse(result.preferencesJson as string) : null,
      answersJson: undefined,
      preferencesJson: undefined,
    }));

    return parsedResults;
  }

  static async getLatestDiagnosisResult(userId: string) {
    const result = await prisma.aIDiagnosisResult.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        matchingResults: {
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
        },
      },
    });

    if (!result) {
      return null;
    }

    // Parse JSON fields
    return {
      ...result,
      answers: JSON.parse(result.answersJson as string),
      preferences: result.preferencesJson ? JSON.parse(result.preferencesJson as string) : null,
      answersJson: undefined,
      preferencesJson: undefined,
    };
  }

  static extractPreferencesFromAnswers(answers: DiagnosisAnswers): DiagnosisResult['preferences'] {
    const preferences: DiagnosisResult['preferences'] = {};

    // Extract business type (assuming question id maps)
    Object.entries(answers).forEach(([_questionId, answer]) => {
      // This is a simplified implementation
      // In a real scenario, you would map question IDs to specific preferences
      
      if (typeof answer === 'string') {
        // Map answers to preferences based on question content
        if (answer.includes('retail') || answer.includes('EC')) {
          preferences.businessType = 'EC・小売';
        } else if (answer.includes('it') || answer.includes('IT')) {
          preferences.businessType = 'IT';
        } else if (answer.includes('restaurant') || answer.includes('飲食')) {
          preferences.businessType = '飲食';
        }

        // Extract budget preferences
        if (answer.includes('30k')) {
          preferences.budget = 30000;
        } else if (answer.includes('50k')) {
          preferences.budget = 50000;
        }

        // Extract frequency preferences
        if (answer.includes('monthly')) {
          preferences.frequency = '月1回';
        } else if (answer.includes('quarterly')) {
          preferences.frequency = '四半期';
        }
      }

      if (Array.isArray(answer)) {
        preferences.needs = answer;
      }
    });

    return preferences;
  }

  static async deleteDiagnosisResult(userId: string, resultId: string) {
    // Verify the result belongs to the user
    const result = await prisma.aIDiagnosisResult.findFirst({
      where: {
        id: resultId,
        userId,
      },
    });

    if (!result) {
      throw new Error('Diagnosis result not found');
    }

    // Delete the result and its associated matching results
    await prisma.aIDiagnosisResult.delete({
      where: { id: resultId },
    });

    return { message: 'Diagnosis result deleted successfully' };
  }

  static async getDiagnosisStats() {
    const [totalDiagnoses, completedDiagnoses] = await Promise.all([
      prisma.aIDiagnosisResult.count(),
      prisma.aIDiagnosisResult.count({
        where: { completedAt: { not: null } },
      }),
    ]);

    return {
      totalDiagnoses,
      completedDiagnoses,
      completionRate: totalDiagnoses > 0 ? (completedDiagnoses / totalDiagnoses) * 100 : 0,
      avgCompletionTime: 3.5, // Mock value in minutes
    };
  }
}