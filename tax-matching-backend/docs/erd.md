# 税理士マッチングサービス ERD (Entity Relationship Diagram)

## 概要
このドキュメントは税理士マッチングサービスのデータベース設計を示すERDです。

## 主要エンティティ

### 1. Users (ユーザー)
個人事業主・企業ユーザーの情報を管理

```
users
├── id (UUID, PK)
├── email (String, Unique, Not Null)
├── password_hash (String, Not Null)
├── role (Enum: client/tax_accountant/admin)
├── is_verified (Boolean, Default: false)
├── is_active (Boolean, Default: true)
├── last_login_at (DateTime)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 2. User Profiles (ユーザープロフィール)
ユーザーの詳細情報

```
user_profiles
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id, Unique)
├── first_name (String)
├── last_name (String)
├── company_name (String)
├── phone_number (String)
├── prefecture (String)
├── city (String)
├── address (String)
├── business_type (String)
├── annual_revenue (BigInt)
├── employee_count (Int)
├── avatar_url (String)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 3. Tax Accountants (税理士)
税理士の専門情報

```
tax_accountants
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id, Unique)
├── license_number (String, Unique)
├── office_name (String)
├── years_of_experience (Int)
├── bio (Text)
├── specialties (JSON) // 専門分野の配列
├── certifications (JSON) // 資格の配列
├── is_accepting_clients (Boolean, Default: true)
├── average_rating (Decimal)
├── total_reviews (Int)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 4. Specialties (専門分野マスタ)
税理士の専門分野

```
specialties
├── id (UUID, PK)
├── name (String, Unique)
├── category (String)
├── description (Text)
├── is_active (Boolean, Default: true)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 5. Tax Accountant Specialties (税理士-専門分野 中間テーブル)

```
tax_accountant_specialties
├── tax_accountant_id (UUID, FK -> tax_accountants.id)
├── specialty_id (UUID, FK -> specialties.id)
├── years_of_experience (Int)
├── created_at (DateTime)
└── PK (tax_accountant_id, specialty_id)
```

### 6. Pricing Plans (料金プラン)
税理士の料金体系

```
pricing_plans
├── id (UUID, PK)
├── tax_accountant_id (UUID, FK -> tax_accountants.id)
├── name (String)
├── description (Text)
├── price_type (Enum: monthly/annual/one_time/hourly)
├── base_price (Int)
├── features (JSON) // 含まれるサービスの配列
├── is_active (Boolean, Default: true)
├── display_order (Int)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 7. AI Diagnosis Questions (AI診断質問)
診断フローの質問

```
ai_diagnosis_questions
├── id (UUID, PK)
├── question_text (Text)
├── question_type (Enum: single/multiple/scale/text)
├── options (JSON) // 選択肢の配列
├── category (String)
├── weight (Decimal) // マッチングスコアへの影響度
├── order_index (Int)
├── is_active (Boolean, Default: true)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 8. AI Diagnosis Results (AI診断結果)
ユーザーの診断結果

```
ai_diagnosis_results
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── answers (JSON) // 質問IDと回答のマップ
├── preferences (JSON) // 抽出された希望条件
├── completed_at (DateTime)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 9. Matching Results (マッチング結果)
AI診断によるマッチング結果

```
matching_results
├── id (UUID, PK)
├── diagnosis_result_id (UUID, FK -> ai_diagnosis_results.id)
├── tax_accountant_id (UUID, FK -> tax_accountants.id)
├── matching_score (Decimal)
├── matching_reasons (JSON) // マッチング理由の配列
├── rank (Int)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 10. Consultations (相談)
ユーザーと税理士の相談記録

```
consultations
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── tax_accountant_id (UUID, FK -> tax_accountants.id)
├── matching_result_id (UUID, FK -> matching_results.id, Nullable)
├── status (Enum: pending/accepted/rejected/completed/cancelled)
├── initial_message (Text)
├── consultation_date (DateTime)
├── notes (Text)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 11. Messages (メッセージ)
チャット機能のメッセージ

```
messages
├── id (UUID, PK)
├── consultation_id (UUID, FK -> consultations.id)
├── sender_id (UUID, FK -> users.id)
├── receiver_id (UUID, FK -> users.id)
├── content (Text)
├── attachments (JSON) // 添付ファイル情報の配列
├── status (Enum: sent/delivered/read)
├── read_at (DateTime)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 12. Reviews (レビュー)
税理士へのレビュー

```
reviews
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── tax_accountant_id (UUID, FK -> tax_accountants.id)
├── consultation_id (UUID, FK -> consultations.id)
├── rating (Int) // 1-5
├── title (String)
├── comment (Text)
├── is_verified (Boolean, Default: false)
├── is_visible (Boolean, Default: true)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 13. Contracts (契約)
正式契約の記録

```
contracts
├── id (UUID, PK)
├── consultation_id (UUID, FK -> consultations.id)
├── user_id (UUID, FK -> users.id)
├── tax_accountant_id (UUID, FK -> tax_accountants.id)
├── pricing_plan_id (UUID, FK -> pricing_plans.id)
├── status (Enum: active/cancelled/completed)
├── start_date (Date)
├── end_date (Date, Nullable)
├── monthly_fee (Int)
├── notes (Text)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 14. Billing Records (請求記録)
成功報酬の請求記録

```
billing_records
├── id (UUID, PK)
├── contract_id (UUID, FK -> contracts.id)
├── tax_accountant_id (UUID, FK -> tax_accountants.id)
├── billing_type (Enum: success_fee/monthly_fee)
├── amount (Int)
├── fee_percentage (Decimal)
├── status (Enum: pending/paid/cancelled)
├── due_date (Date)
├── paid_at (DateTime)
├── created_at (DateTime)
└── updated_at (DateTime)
```

### 15. Notifications (通知)
システム通知

```
notifications
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── type (String) // notification_type
├── title (String)
├── content (Text)
├── metadata (JSON) // 追加データ
├── is_read (Boolean, Default: false)
├── read_at (DateTime)
├── created_at (DateTime)
└── updated_at (DateTime)
```

## リレーションシップ

### 1対1関係
- users ↔ user_profiles
- users ↔ tax_accountants

### 1対多関係
- users → consultations
- users → ai_diagnosis_results
- users → reviews
- users → notifications
- tax_accountants → pricing_plans
- tax_accountants → reviews
- ai_diagnosis_results → matching_results
- consultations → messages
- consultations → contracts
- contracts → billing_records

### 多対多関係
- tax_accountants ↔ specialties (through tax_accountant_specialties)

## インデックス設計

### Primary Indexes
- 全テーブルのid列

### Unique Indexes
- users.email
- tax_accountants.license_number
- specialties.name

### Foreign Key Indexes
- 全てのFK列に自動作成

### 検索用インデックス
- messages.consultation_id + created_at (メッセージ履歴取得)
- consultations.user_id + status (ユーザーの相談一覧)
- consultations.tax_accountant_id + status (税理士の相談一覧)
- reviews.tax_accountant_id + is_visible (税理士のレビュー表示)
- matching_results.diagnosis_result_id + rank (マッチング結果表示)

## データ型定義

### Enum Types
```sql
-- ユーザーロール
CREATE TYPE user_role AS ENUM ('client', 'tax_accountant', 'admin');

-- 相談ステータス
CREATE TYPE consultation_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- メッセージステータス
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- 料金タイプ
CREATE TYPE price_type AS ENUM ('monthly', 'annual', 'one_time', 'hourly');

-- 質問タイプ
CREATE TYPE question_type AS ENUM ('single', 'multiple', 'scale', 'text');

-- 契約ステータス
CREATE TYPE contract_status AS ENUM ('active', 'cancelled', 'completed');

-- 請求タイプ
CREATE TYPE billing_type AS ENUM ('success_fee', 'monthly_fee');

-- 請求ステータス
CREATE TYPE billing_status AS ENUM ('pending', 'paid', 'cancelled');
```

## セキュリティ考慮事項

1. **個人情報保護**
   - password_hashはbcryptでハッシュ化
   - 個人情報へのアクセスは認証必須
   - ロールベースのアクセス制御

2. **データ暗号化**
   - 機密情報は暗号化して保存
   - SSL/TLS通信の強制

3. **監査ログ**
   - 重要な操作は全て記録
   - created_at, updated_atの自動設定

## パフォーマンス考慮事項

1. **キャッシュ戦略**
   - 税理士プロフィールはRedisでキャッシュ
   - 検索結果のキャッシュ

2. **非正規化**
   - tax_accountants.average_rating（レビューから計算）
   - tax_accountants.total_reviews（レビュー数）

3. **パーティショニング**
   - messagesテーブルは将来的に月別パーティション検討
   - notificationsテーブルも同様