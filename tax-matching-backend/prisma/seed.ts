import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.billingRecord.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.matchingResult.deleteMany();
  await prisma.aIDiagnosisResult.deleteMany();
  await prisma.aIDiagnosisQuestion.deleteMany();
  await prisma.pricingPlan.deleteMany();
  await prisma.taxAccountantSpecialty.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.taxAccountant.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create specialties
  const specialties = await Promise.all([
    prisma.specialty.create({
      data: {
        name: '個人事業主向け税務',
        category: '対象者別',
        description: '個人事業主の確定申告、青色申告、経費計算などを専門とします',
      },
    }),
    prisma.specialty.create({
      data: {
        name: '法人税務',
        category: '対象者別',
        description: '法人の決算、法人税申告、税務調査対応などを専門とします',
      },
    }),
    prisma.specialty.create({
      data: {
        name: '相続・贈与税',
        category: '分野別',
        description: '相続税申告、贈与税対策、事業承継などを専門とします',
      },
    }),
    prisma.specialty.create({
      data: {
        name: '国際税務',
        category: '分野別',
        description: '海外取引、国際税務、移転価格税制などを専門とします',
      },
    }),
    prisma.specialty.create({
      data: {
        name: 'IT・EC業界',
        category: '業界別',
        description: 'IT企業、EC事業者向けの税務を専門とします',
      },
    }),
    prisma.specialty.create({
      data: {
        name: '医療・福祉業界',
        category: '業界別',
        description: '医療法人、クリニック、福祉施設の税務を専門とします',
      },
    }),
    prisma.specialty.create({
      data: {
        name: '飲食業界',
        category: '業界別',
        description: '飲食店、レストラン経営の税務を専門とします',
      },
    }),
    prisma.specialty.create({
      data: {
        name: '不動産業界',
        category: '業界別',
        description: '不動産取引、賃貸経営の税務を専門とします',
      },
    }),
  ]);

  // Create AI diagnosis questions
  const questions = await Promise.all([
    prisma.aIDiagnosisQuestion.create({
      data: {
        questionText: 'あなたの事業形態を教えてください',
        questionType: 'single',
        optionsJson: JSON.stringify([
          { value: 'individual', label: '個人事業主' },
          { value: 'corporation', label: '法人' },
          { value: 'freelance', label: 'フリーランス' },
          { value: 'planning', label: '起業準備中' },
        ]),
        category: '基本情報',
        weight: 1.0,
        orderIndex: 1,
      },
    }),
    prisma.aIDiagnosisQuestion.create({
      data: {
        questionText: '年間売上規模を教えてください',
        questionType: 'single',
        optionsJson: JSON.stringify([
          { value: 'under_10m', label: '1,000万円未満' },
          { value: '10m_50m', label: '1,000万円〜5,000万円' },
          { value: '50m_100m', label: '5,000万円〜1億円' },
          { value: 'over_100m', label: '1億円以上' },
        ]),
        category: '基本情報',
        weight: 0.8,
        orderIndex: 2,
      },
    }),
    prisma.aIDiagnosisQuestion.create({
      data: {
        questionText: '業種を教えてください',
        questionType: 'single',
        optionsJson: JSON.stringify([
          { value: 'it', label: 'IT・Web' },
          { value: 'retail', label: '小売・EC' },
          { value: 'restaurant', label: '飲食' },
          { value: 'medical', label: '医療・福祉' },
          { value: 'real_estate', label: '不動産' },
          { value: 'manufacturing', label: '製造業' },
          { value: 'service', label: 'サービス業' },
          { value: 'other', label: 'その他' },
        ]),
        category: '基本情報',
        weight: 0.9,
        orderIndex: 3,
      },
    }),
    prisma.aIDiagnosisQuestion.create({
      data: {
        questionText: '現在の税理士との契約状況を教えてください',
        questionType: 'single',
        optionsJson: JSON.stringify([
          { value: 'no_accountant', label: '税理士なし（自分で申告）' },
          { value: 'changing', label: '税理士変更を検討中' },
          { value: 'first_time', label: '初めて税理士を探している' },
        ]),
        category: '現状',
        weight: 0.7,
        orderIndex: 4,
      },
    }),
    prisma.aIDiagnosisQuestion.create({
      data: {
        questionText: '税理士に求めるサービスは何ですか？（複数選択可）',
        questionType: 'multiple',
        optionsJson: JSON.stringify([
          { value: 'tax_return', label: '確定申告・決算' },
          { value: 'bookkeeping', label: '記帳代行' },
          { value: 'tax_planning', label: '節税アドバイス' },
          { value: 'consultation', label: '税務相談' },
          { value: 'audit_response', label: '税務調査対応' },
          { value: 'succession', label: '事業承継・相続対策' },
        ]),
        category: 'ニーズ',
        weight: 1.0,
        orderIndex: 5,
      },
    }),
    prisma.aIDiagnosisQuestion.create({
      data: {
        questionText: '希望する相談頻度を教えてください',
        questionType: 'single',
        optionsJson: JSON.stringify([
          { value: 'monthly', label: '月1回以上' },
          { value: 'quarterly', label: '四半期に1回' },
          { value: 'biannual', label: '半年に1回' },
          { value: 'annual', label: '年1回（確定申告時のみ）' },
        ]),
        category: 'ニーズ',
        weight: 0.6,
        orderIndex: 6,
      },
    }),
    prisma.aIDiagnosisQuestion.create({
      data: {
        questionText: '月額予算を教えてください',
        questionType: 'single',
        optionsJson: JSON.stringify([
          { value: 'under_30k', label: '3万円未満' },
          { value: '30k_50k', label: '3万円〜5万円' },
          { value: '50k_100k', label: '5万円〜10万円' },
          { value: 'over_100k', label: '10万円以上' },
        ]),
        category: '予算',
        weight: 0.8,
        orderIndex: 7,
      },
    }),
  ]);

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin user
  await prisma.user.create({
    data: {
      email: 'admin@tax-matching.com',
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true,
      profile: {
        create: {
          firstName: '管理者',
          lastName: '税理士マッチング',
          phoneNumber: '03-1234-5678',
        },
      },
    },
  });

  // Client users
  const client1 = await prisma.user.create({
    data: {
      email: 'tanaka@example.com',
      passwordHash: hashedPassword,
      role: 'client',
      isVerified: true,
      profile: {
        create: {
          firstName: '太郎',
          lastName: '田中',
          companyName: '田中商店',
          phoneNumber: '090-1234-5678',
          prefecture: '東京都',
          city: '渋谷区',
          businessType: 'EC・小売',
          annualRevenue: 30000000,
          employeeCount: 3,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'suzuki@example.com',
      passwordHash: hashedPassword,
      role: 'client',
      isVerified: true,
      profile: {
        create: {
          firstName: '花子',
          lastName: '鈴木',
          phoneNumber: '080-2345-6789',
          prefecture: '神奈川県',
          city: '横浜市',
          businessType: 'フリーランス・IT',
          annualRevenue: 8000000,
          employeeCount: 1,
        },
      },
    },
  });

  // Tax accountant users
  const taxAccountant1 = await prisma.user.create({
    data: {
      email: 'yamada-tax@example.com',
      passwordHash: hashedPassword,
      role: 'tax_accountant',
      isVerified: true,
      profile: {
        create: {
          firstName: '一郎',
          lastName: '山田',
          phoneNumber: '03-3456-7890',
          prefecture: '東京都',
          city: '新宿区',
        },
      },
      taxAccountant: {
        create: {
          licenseNumber: 'TAX-123456',
          officeName: '山田税理士事務所',
          yearsOfExperience: 15,
          bio: 'IT業界に特化した税理士事務所です。スタートアップから上場企業まで幅広くサポートしています。クラウド会計ソフトの導入支援も行っています。',
          specialtiesJson: JSON.stringify(['IT業界', '個人事業主', 'スタートアップ']),
          certificationsJson: JSON.stringify(['税理士', '中小企業診断士']),
          averageRating: 4.8,
          totalReviews: 24,
          specialties: {
            create: [
              {
                specialtyId: specialties.find(s => s.name === 'IT・EC業界')!.id,
                yearsOfExperience: 10,
              },
              {
                specialtyId: specialties.find(s => s.name === '個人事業主向け税務')!.id,
                yearsOfExperience: 15,
              },
            ],
          },
          pricingPlans: {
            create: [
              {
                name: 'スタートアッププラン',
                description: '個人事業主・フリーランス向けの基本プラン',
                priceType: 'monthly',
                basePrice: 30000,
                featuresJson: JSON.stringify([
                  '月1回の定期面談',
                  '確定申告代行',
                  'チャット相談無制限',
                  'クラウド会計サポート',
                ]),
                displayOrder: 1,
              },
              {
                name: 'グロースプラン',
                description: '成長企業向けの充実プラン',
                priceType: 'monthly',
                basePrice: 50000,
                featuresJson: JSON.stringify([
                  '月2回の定期面談',
                  '決算・申告代行',
                  '記帳代行',
                  '税務調査立会い',
                  '節税アドバイス',
                ]),
                displayOrder: 2,
              },
              {
                name: 'スポット相談',
                description: '単発のご相談',
                priceType: 'hourly',
                basePrice: 10000,
                featuresJson: JSON.stringify(['1時間単位の相談', 'オンライン対応可']),
                displayOrder: 3,
              },
            ],
          },
        },
      },
    },
  });

  const taxAccountant2 = await prisma.user.create({
    data: {
      email: 'sato-tax@example.com',
      passwordHash: hashedPassword,
      role: 'tax_accountant',
      isVerified: true,
      profile: {
        create: {
          firstName: '美咲',
          lastName: '佐藤',
          phoneNumber: '045-4567-8901',
          prefecture: '神奈川県',
          city: '横浜市',
        },
      },
      taxAccountant: {
        create: {
          licenseNumber: 'TAX-234567',
          officeName: '佐藤税理士法人',
          yearsOfExperience: 20,
          bio: '飲食業界に強い税理士法人です。開業支援から事業拡大まで、飲食店経営者の皆様を全力でサポートします。',
          specialtiesJson: JSON.stringify(['飲食業界', '法人税務', '事業承継']),
          certificationsJson: JSON.stringify(['税理士', '行政書士']),
          averageRating: 4.6,
          totalReviews: 18,
          specialties: {
            create: [
              {
                specialtyId: specialties.find(s => s.name === '飲食業界')!.id,
                yearsOfExperience: 15,
              },
              {
                specialtyId: specialties.find(s => s.name === '法人税務')!.id,
                yearsOfExperience: 20,
              },
            ],
          },
          pricingPlans: {
            create: [
              {
                name: '飲食店基本プラン',
                description: '飲食店向けの標準プラン',
                priceType: 'monthly',
                basePrice: 40000,
                featuresJson: JSON.stringify([
                  '月次決算',
                  '税務相談',
                  '給与計算',
                  '年末調整',
                ]),
                displayOrder: 1,
              },
              {
                name: '多店舗展開プラン',
                description: '複数店舗を運営する企業向け',
                priceType: 'monthly',
                basePrice: 80000,
                featuresJson: JSON.stringify([
                  '店舗別損益管理',
                  '資金繰り相談',
                  '事業計画策定支援',
                  '融資相談',
                ]),
                displayOrder: 2,
              },
            ],
          },
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'takahashi-tax@example.com',
      passwordHash: hashedPassword,
      role: 'tax_accountant',
      isVerified: true,
      profile: {
        create: {
          firstName: '健二',
          lastName: '高橋',
          phoneNumber: '06-5678-9012',
          prefecture: '大阪府',
          city: '大阪市',
        },
      },
      taxAccountant: {
        create: {
          licenseNumber: 'TAX-345678',
          officeName: '高橋税理士事務所',
          yearsOfExperience: 25,
          bio: '相続・事業承継のスペシャリストです。資産税に関する豊富な経験を活かし、お客様の大切な資産を守ります。',
          specialtiesJson: JSON.stringify(['相続税', '事業承継', '資産税']),
          certificationsJson: JSON.stringify(['税理士', 'CFP', '宅地建物取引士']),
          averageRating: 4.9,
          totalReviews: 32,
          specialties: {
            create: [
              {
                specialtyId: specialties.find(s => s.name === '相続・贈与税')!.id,
                yearsOfExperience: 20,
              },
              {
                specialtyId: specialties.find(s => s.name === '不動産業界')!.id,
                yearsOfExperience: 15,
              },
            ],
          },
          pricingPlans: {
            create: [
              {
                name: '相続税申告パック',
                description: '相続税申告の基本パッケージ',
                priceType: 'one_time',
                basePrice: 300000,
                featuresJson: JSON.stringify([
                  '財産評価',
                  '相続税申告書作成',
                  '遺産分割協議サポート',
                  '税務署対応',
                ]),
                displayOrder: 1,
              },
              {
                name: '事業承継コンサルティング',
                description: '計画的な事業承継をサポート',
                priceType: 'annual',
                basePrice: 1200000,
                featuresJson: JSON.stringify([
                  '承継計画策定',
                  '株価評価',
                  '税務スキーム提案',
                  '定期モニタリング',
                ]),
                displayOrder: 2,
              },
            ],
          },
        },
      },
    },
  });

  // Get tax accountant records
  const taxAccountant1Record = await prisma.taxAccountant.findUnique({
    where: { userId: taxAccountant1.id }
  });
  const taxAccountant2Record = await prisma.taxAccountant.findUnique({
    where: { userId: taxAccountant2.id }
  });

  // Create sample AI diagnosis results and matching
  const diagnosisResult1 = await prisma.aIDiagnosisResult.create({
    data: {
      userId: client1.id,
      answersJson: JSON.stringify({
        q1: 'individual',
        q2: '10m_50m',
        q3: 'retail',
        q4: 'changing',
        q5: ['tax_return', 'tax_planning', 'consultation'],
        q6: 'monthly',
        q7: '30k_50k',
      }),
      preferencesJson: JSON.stringify({
        businessType: 'EC・小売',
        budget: 30000,
        needs: ['確定申告', '節税アドバイス', '税務相談'],
      }),
      completedAt: new Date(),
    },
  });

  // Create matching results
  await prisma.matchingResult.create({
    data: {
      diagnosisResultId: diagnosisResult1.id,
      taxAccountantId: taxAccountant1Record!.id,
      matchingScore: 92.5,
      matchingReasonsJson: JSON.stringify([
        'EC事業の豊富な実績',
        '予算内のプラン提供',
        'クラウド会計対応',
      ]),
      rank: 1,
    },
  });

  await prisma.matchingResult.create({
    data: {
      diagnosisResultId: diagnosisResult1.id,
      taxAccountantId: taxAccountant2Record!.id,
      matchingScore: 78.3,
      matchingReasonsJson: JSON.stringify([
        '小売業の経験あり',
        '月次サポート充実',
      ]),
      rank: 2,
    },
  });

  // Create sample consultation
  const consultation = await prisma.consultation.create({
    data: {
      userId: client1.id,
      taxAccountantId: taxAccountant1Record!.id,
      status: 'accepted',
      initialMessage: 'ECサイトを運営しています。節税対策と確定申告のサポートをお願いしたいです。',
      consultationDate: new Date('2024-02-01 14:00:00'),
    },
  });

  // Create sample messages
  await prisma.message.create({
    data: {
      consultationId: consultation.id,
      senderId: client1.id,
      receiverId: taxAccountant1.id,
      content: 'はじめまして。ECサイトの税務についてご相談したいです。',
      status: 'read',
      readAt: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      consultationId: consultation.id,
      senderId: taxAccountant1.id,
      receiverId: client1.id,
      content: 'お問い合わせありがとうございます。EC事業の税務は得意分野です。まずは現状をお聞かせください。',
      status: 'read',
      readAt: new Date(),
    },
  });

  // Create sample review
  await prisma.review.create({
    data: {
      userId: client1.id,
      taxAccountantId: taxAccountant1Record!.id,
      consultationId: consultation.id,
      rating: 5,
      title: '親切で分かりやすい説明',
      comment: 'EC事業特有の税務について、とても分かりやすく説明していただきました。クラウド会計の導入もスムーズでした。',
      isVerified: true,
    },
  });

  // Create sample notifications
  await prisma.notification.create({
    data: {
      userId: client1.id,
      type: 'consultation_accepted',
      title: '相談リクエストが承認されました',
      content: '山田税理士があなたの相談リクエストを承認しました。',
      metadataJson: JSON.stringify({
        consultationId: consultation.id,
        taxAccountantName: '山田一郎',
      }),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('📊 Created:');
  console.log(`   - ${specialties.length} specialties`);
  console.log(`   - ${questions.length} AI diagnosis questions`);
  console.log('   - 1 admin user');
  console.log('   - 2 client users');
  console.log('   - 3 tax accountants with pricing plans');
  console.log('   - Sample consultations, messages, and reviews');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });