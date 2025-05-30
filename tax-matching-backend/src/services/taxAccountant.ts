import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

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

export class TaxAccountantService {
  static async getTaxAccountantList(
    filters: TaxAccountantSearchFilters = {},
    options: TaxAccountantListOptions = {}
  ) {
    const {
      specialties,
      prefecture,
      minPrice,
      maxPrice,
      minRating,
      minExperience,
      isAcceptingClients = true,
      search,
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {
      isAcceptingClients,
      user: { isActive: true },
    };

    // Filter by rating
    if (minRating !== undefined) {
      whereConditions.averageRating = { gte: minRating };
    }

    // Filter by experience
    if (minExperience !== undefined) {
      whereConditions.yearsOfExperience = { gte: minExperience };
    }

    // Filter by location
    if (prefecture) {
      whereConditions.user.profile = {
        prefecture: { contains: prefecture, mode: 'insensitive' },
      };
    }

    // Filter by specialties
    if (specialties && specialties.length > 0) {
      whereConditions.specialties = {
        some: {
          specialtyId: { in: specialties },
        },
      };
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceConditions: any = {};
      if (minPrice !== undefined) priceConditions.gte = minPrice;
      if (maxPrice !== undefined) priceConditions.lte = maxPrice;

      whereConditions.pricingPlans = {
        some: {
          isActive: true,
          basePrice: priceConditions,
        },
      };
    }

    // Search functionality
    if (search) {
      whereConditions.OR = [
        { officeName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Build sort conditions
    const orderBy: any = {};
    switch (sortBy) {
      case 'rating':
        orderBy.averageRating = sortOrder;
        break;
      case 'experience':
        orderBy.yearsOfExperience = sortOrder;
        break;
      case 'reviews':
        orderBy.totalReviews = sortOrder;
        break;
      case 'price':
        // For price sorting, we'll need to handle it differently
        // as it's in a related table
        break;
      default:
        orderBy.averageRating = 'desc';
    }

    const [taxAccountants, total] = await Promise.all([
      prisma.taxAccountant.findMany({
        where: whereConditions,
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.taxAccountant.count({
        where: whereConditions,
      }),
    ]);

    // Calculate additional metrics for each tax accountant
    const enrichedTaxAccountants = taxAccountants.map(taxAccountant => ({
      ...taxAccountant,
      minPrice: taxAccountant.pricingPlans.length > 0
        ? Math.min(...taxAccountant.pricingPlans.map(plan => plan.basePrice))
        : null,
      specialtyNames: taxAccountant.specialties.map(ts => ts.specialty.name),
      location: taxAccountant.user.profile?.prefecture || null,
      recentReviews: taxAccountant.reviews.slice(0, 3),
    }));

    return {
      data: enrichedTaxAccountants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTaxAccountantById(id: string) {
    const taxAccountant = await prisma.taxAccountant.findUnique({
      where: { id },
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
          include: {
            user: {
              include: { profile: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        consultations: {
          where: { status: 'completed' },
          select: { id: true },
        },
      },
    });

    if (!taxAccountant) {
      throw new Error('Tax accountant not found');
    }

    // Calculate additional metrics
    const enrichedTaxAccountant = {
      ...taxAccountant,
      minPrice: taxAccountant.pricingPlans.length > 0
        ? Math.min(...taxAccountant.pricingPlans.map(plan => plan.basePrice))
        : null,
      specialtyNames: taxAccountant.specialties.map(ts => ts.specialty.name),
      location: taxAccountant.user.profile?.prefecture || null,
      completedConsultations: taxAccountant.consultations.length,
      consultations: undefined, // Remove the consultations array from response
    };

    return enrichedTaxAccountant;
  }

  static async searchTaxAccountants(query: string, limit = 10) {
    const taxAccountants = await prisma.taxAccountant.findMany({
      where: {
        isAcceptingClients: true,
        user: { isActive: true },
        OR: [
          { officeName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { user: { profile: { firstName: { contains: query, mode: 'insensitive' } } } },
          { user: { profile: { lastName: { contains: query, mode: 'insensitive' } } } },
          { specialties: { some: { specialty: { name: { contains: query, mode: 'insensitive' } } } } },
        ],
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
          take: 1,
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalReviews: 'desc' },
      ],
      take: limit,
    });

    return taxAccountants.map(taxAccountant => ({
      ...taxAccountant,
      minPrice: taxAccountant.pricingPlans.length > 0
        ? taxAccountant.pricingPlans[0].basePrice
        : null,
      specialtyNames: taxAccountant.specialties.map(ts => ts.specialty.name),
      location: taxAccountant.user.profile?.prefecture || null,
    }));
  }

  static async getPopularTaxAccountants(limit = 6) {
    const taxAccountants = await prisma.taxAccountant.findMany({
      where: {
        isAcceptingClients: true,
        user: { isActive: true },
        averageRating: { gte: 4.0 },
        totalReviews: { gte: 5 },
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
          take: 1,
        },
        reviews: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalReviews: 'desc' },
      ],
      take: limit,
    });

    return taxAccountants.map(taxAccountant => ({
      ...taxAccountant,
      minPrice: taxAccountant.pricingPlans.length > 0
        ? taxAccountant.pricingPlans[0].basePrice
        : null,
      specialtyNames: taxAccountant.specialties.map(ts => ts.specialty.name),
      location: taxAccountant.user.profile?.prefecture || null,
    }));
  }

  static async getTaxAccountantStats() {
    const [total, accepting, avgRating, topSpecialties] = await Promise.all([
      prisma.taxAccountant.count(),
      prisma.taxAccountant.count({
        where: { isAcceptingClients: true },
      }),
      prisma.taxAccountant.aggregate({
        _avg: { averageRating: true },
      }),
      prisma.taxAccountantSpecialty.groupBy({
        by: ['specialtyId'],
        _count: { specialtyId: true },
        orderBy: { _count: { specialtyId: 'desc' } },
        take: 5,
      }),
    ]);

    const specialtyDetails = await prisma.specialty.findMany({
      where: {
        id: { in: topSpecialties.map(s => s.specialtyId) },
      },
    });

    const topSpecialtiesWithNames = topSpecialties.map(stat => ({
      ...stat,
      specialty: specialtyDetails.find(s => s.id === stat.specialtyId),
    }));

    return {
      total,
      accepting,
      acceptanceRate: total > 0 ? (accepting / total) * 100 : 0,
      averageRating: avgRating._avg.averageRating || 0,
      topSpecialties: topSpecialtiesWithNames,
    };
  }

  static async registerTaxAccountant(userId: string, data: any) {
    // Check if user exists and has tax_accountant role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'tax_accountant') {
      throw new Error('User must have tax_accountant role');
    }

    // Check if tax accountant profile already exists
    const existingTaxAccountant = await prisma.taxAccountant.findUnique({
      where: { userId },
    });

    if (existingTaxAccountant) {
      throw new Error('Tax accountant profile already exists');
    }

    const {
      officeName,
      licenseNumber,
      bio,
      yearsOfExperience,
      website,
      phoneNumber,
      isAcceptingClients = true,
      specialties = [],
      pricingPlans = [],
    } = data;

    // Create tax accountant profile
    const taxAccountant = await prisma.taxAccountant.create({
      data: {
        userId,
        officeName,
        licenseNumber,
        bio,
        yearsOfExperience,
        website,
        phoneNumber,
        isAcceptingClients,
        averageRating: 0,
        totalReviews: 0,
      },
      include: {
        user: {
          include: { profile: true },
        },
        specialties: {
          include: { specialty: true },
        },
        pricingPlans: true,
      },
    });

    // Add specialties if provided
    if (specialties.length > 0) {
      await Promise.all(
        specialties.map((specialty: any) =>
          prisma.taxAccountantSpecialty.create({
            data: {
              taxAccountantId: taxAccountant.id,
              specialtyId: specialty.specialtyId,
              yearsOfExperience: specialty.yearsOfExperience || 0,
              description: specialty.description,
            },
          })
        )
      );
    }

    // Add pricing plans if provided
    if (pricingPlans.length > 0) {
      await Promise.all(
        pricingPlans.map((plan: any, index: number) =>
          prisma.pricingPlan.create({
            data: {
              taxAccountantId: taxAccountant.id,
              name: plan.name,
              description: plan.description,
              basePrice: plan.basePrice,
              features: plan.features || [],
              isActive: plan.isActive ?? true,
              displayOrder: plan.displayOrder ?? index,
            },
          })
        )
      );
    }

    // Return the complete tax accountant profile
    return await this.getTaxAccountantById(taxAccountant.id);
  }

  static async updateTaxAccountant(userId: string, data: any) {
    // Check if tax accountant exists for this user
    const taxAccountant = await prisma.taxAccountant.findUnique({
      where: { userId },
      include: {
        specialties: true,
        pricingPlans: true,
      },
    });

    if (!taxAccountant) {
      throw new Error('Tax accountant not found');
    }

    const {
      officeName,
      licenseNumber,
      bio,
      yearsOfExperience,
      website,
      phoneNumber,
      isAcceptingClients,
      specialties,
      pricingPlans,
    } = data;

    // Update basic profile information
    const updateData: any = {};
    if (officeName !== undefined) updateData.officeName = officeName;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (bio !== undefined) updateData.bio = bio;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
    if (website !== undefined) updateData.website = website;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (isAcceptingClients !== undefined) updateData.isAcceptingClients = isAcceptingClients;

    if (Object.keys(updateData).length > 0) {
      await prisma.taxAccountant.update({
        where: { id: taxAccountant.id },
        data: updateData,
      });
    }

    // Update specialties if provided
    if (specialties !== undefined) {
      // Delete existing specialties
      await prisma.taxAccountantSpecialty.deleteMany({
        where: { taxAccountantId: taxAccountant.id },
      });

      // Add new specialties
      if (specialties.length > 0) {
        await Promise.all(
          specialties.map((specialty: any) =>
            prisma.taxAccountantSpecialty.create({
              data: {
                taxAccountantId: taxAccountant.id,
                specialtyId: specialty.specialtyId,
                yearsOfExperience: specialty.yearsOfExperience || 0,
                description: specialty.description,
              },
            })
          )
        );
      }
    }

    // Update pricing plans if provided
    if (pricingPlans !== undefined) {
      // Delete existing pricing plans
      await prisma.pricingPlan.deleteMany({
        where: { taxAccountantId: taxAccountant.id },
      });

      // Add new pricing plans
      if (pricingPlans.length > 0) {
        await Promise.all(
          pricingPlans.map((plan: any, index: number) =>
            prisma.pricingPlan.create({
              data: {
                taxAccountantId: taxAccountant.id,
                name: plan.name,
                description: plan.description,
                basePrice: plan.basePrice,
                features: plan.features || [],
                isActive: plan.isActive ?? true,
                displayOrder: plan.displayOrder ?? index,
              },
            })
          )
        );
      }
    }

    // Return the updated tax accountant profile
    return await this.getTaxAccountantById(taxAccountant.id);
  }
}