import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phoneNumber?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  businessType?: string;
  annualRevenue?: number;
  employeeCount?: number;
  avatarUrl?: string;
}

export interface UpdateTaxAccountantData {
  licenseNumber?: string;
  officeName?: string;
  yearsOfExperience?: number;
  bio?: string;
  specialtiesJson?: any;
  certificationsJson?: any;
  isAcceptingClients?: boolean;
}

export class UserService {
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        taxAccountant: {
          include: {
            specialties: {
              include: {
                specialty: true,
              },
            },
            pricingPlans: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
            },
            reviews: {
              where: { isVisible: true },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateUserProfile(userId: string, data: UpdateUserProfileData) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update or create profile
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    return updatedProfile;
  }

  static async updateTaxAccountant(userId: string, data: UpdateTaxAccountantData) {
    // Check if user is a tax accountant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { taxAccountant: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'tax_accountant') {
      throw new Error('User is not a tax accountant');
    }

    // Update tax accountant data
    const updatedTaxAccountant = await prisma.taxAccountant.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        licenseNumber: data.licenseNumber || '',
        officeName: data.officeName || '',
        yearsOfExperience: data.yearsOfExperience || 0,
        ...data,
      },
    });

    return updatedTaxAccountant;
  }

  static async addTaxAccountantSpecialty(userId: string, specialtyId: string, yearsOfExperience?: number) {
    // Check if user is a tax accountant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { taxAccountant: true },
    });

    if (!user || user.role !== 'tax_accountant' || !user.taxAccountant) {
      throw new Error('User is not a tax accountant');
    }

    // Check if specialty exists
    const specialty = await prisma.specialty.findUnique({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new Error('Specialty not found');
    }

    // Add specialty
    const taxAccountantSpecialty = await prisma.taxAccountantSpecialty.create({
      data: {
        taxAccountantId: user.taxAccountant.id,
        specialtyId,
        yearsOfExperience,
      },
      include: {
        specialty: true,
      },
    });

    return taxAccountantSpecialty;
  }

  static async removeTaxAccountantSpecialty(userId: string, specialtyId: string) {
    // Check if user is a tax accountant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { taxAccountant: true },
    });

    if (!user || user.role !== 'tax_accountant' || !user.taxAccountant) {
      throw new Error('User is not a tax accountant');
    }

    // Remove specialty
    await prisma.taxAccountantSpecialty.delete({
      where: {
        taxAccountantId_specialtyId: {
          taxAccountantId: user.taxAccountant.id,
          specialtyId,
        },
      },
    });

    return { message: 'Specialty removed successfully' };
  }

  static async getUserConsultations(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where: {
          OR: [
            { userId },
            { taxAccountant: { userId } },
          ],
        },
        include: {
          user: {
            include: { profile: true },
          },
          taxAccountant: {
            include: {
              user: { include: { profile: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.consultation.count({
        where: {
          OR: [
            { userId },
            { taxAccountant: { userId } },
          ],
        },
      }),
    ]);

    return {
      data: consultations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updatedNotification;
  }

  static async markAllNotificationsAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }

  static async deleteUser(userId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete by deactivating the account
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'Account deactivated successfully' };
  }

  static async getSpecialties() {
    const specialties = await prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Group by category
    const groupedSpecialties = specialties.reduce((acc, specialty) => {
      if (!acc[specialty.category]) {
        acc[specialty.category] = [];
      }
      acc[specialty.category].push(specialty);
      return acc;
    }, {} as Record<string, typeof specialties>);

    return groupedSpecialties;
  }
}