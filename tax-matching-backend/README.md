# 税理士マッチングサービス バックエンド

税理士とクライアントをマッチングするサービスのバックエンドAPIです。

## 🚀 開発状況

### ✅ 完了済み機能

#### 基盤・環境構築
- [x] Express + TypeScript プロジェクトセットアップ
- [x] Prisma ORM セットアップ・DB接続設定
- [x] Docker Compose 開発環境構築
- [x] 環境変数管理（Zod による検証付き）
- [x] エラーハンドリング・ロギング設定（Winston）

#### データベース
- [x] ERD 作成・レビュー
- [x] Prisma スキーマ定義（全15テーブル）
- [x] マイグレーションファイル作成
- [x] シードデータ作成

#### 認証・ユーザー管理
- [x] JWT認証実装
- [x] ユーザー登録API
- [x] ログインAPI
- [x] パスワードリセットAPI
- [x] プロフィール取得API
- [x] パスワード変更API

### 📝 実装予定機能

#### ユーザー管理API
- [ ] ユーザー情報更新API
- [ ] アカウント削除API
- [ ] プロフィール画像アップロードAPI

#### AI診断・マッチングAPI
- [ ] 診断質問取得API
- [ ] 診断結果保存API
- [ ] マッチングアルゴリズム実装
- [ ] おすすめ税理士取得API

#### 税理士管理API
- [ ] 税理士一覧取得API
- [ ] 税理士詳細取得API
- [ ] 税理士検索API（フィルター機能）

## 🛠 技術スタック

### バックエンド
- **Node.js** + **Express**
- **TypeScript**
- **Prisma** ORM
- **PostgreSQL** データベース
- **Redis** キャッシュ
- **JWT** 認証

### 開発ツール
- **Docker Compose** 開発環境
- **Winston** ロギング
- **express-validator** バリデーション
- **Zod** 環境変数検証

## 📁 プロジェクト構造

```
src/
├── controllers/          # APIコントローラー
│   └── auth.ts          # 認証関連
├── middleware/          # ミドルウェア
│   ├── auth.ts         # 認証ミドルウェア
│   ├── errorHandler.ts # エラーハンドリング
│   ├── validation.ts   # バリデーションエラー処理
│   └── validators/     # バリデーション定義
│       └── auth.ts
├── routes/             # ルート定義
│   ├── auth.ts        # 認証ルート
│   └── health.ts      # ヘルスチェック
├── services/          # ビジネスロジック
│   └── auth.ts       # 認証サービス
├── utils/            # ユーティリティ
│   ├── config.ts     # 設定管理
│   ├── jwt.ts        # JWT処理
│   └── logger.ts     # ロガー設定
├── types/            # TypeScript型定義
└── generated/        # Prisma生成ファイル
    └── prisma/
```

## 🔧 セットアップ

### 1. 環境変数設定

```bash
cp .env.example .env
```

必要な環境変数を設定してください：
- `DATABASE_URL`: PostgreSQLの接続URL
- `JWT_SECRET`: JWT署名用の秘密鍵
- その他の設定値

### 2. データベースセットアップ

```bash
# データベースマイグレーション
npm run db:migrate

# シードデータ投入
npm run db:seed
```

### 3. 開発サーバー起動

```bash
# 開発モードで起動
npm run dev

# Docker Composeで起動
docker-compose up
```

## 📚 API エンドポイント

### 認証API (`/api/auth`)

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|------|
| POST | `/register` | ユーザー登録 | 不要 |
| POST | `/login` | ログイン | 不要 |
| POST | `/refresh-token` | トークン更新 | 不要 |
| GET | `/profile` | プロフィール取得 | 必要 |
| POST | `/change-password` | パスワード変更 | 必要 |
| POST | `/logout` | ログアウト | 必要 |
| POST | `/request-password-reset` | パスワードリセット要求 | 不要 |
| POST | `/reset-password` | パスワードリセット | 不要 |
| GET | `/verify-email/:token` | メール認証 | 不要 |

### ヘルスチェック (`/api`)

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/health` | サーバー状態確認 |

## 🗄 データベース設計

### 主要テーブル

- **users** - ユーザー基本情報
- **user_profiles** - ユーザー詳細プロフィール
- **tax_accountants** - 税理士情報
- **specialties** - 専門分野マスタ
- **pricing_plans** - 料金プラン
- **ai_diagnosis_questions** - AI診断質問
- **ai_diagnosis_results** - 診断結果
- **matching_results** - マッチング結果
- **consultations** - 相談記録
- **messages** - メッセージ
- **reviews** - レビュー・評価
- **contracts** - 契約情報
- **billing_records** - 請求記録
- **notifications** - 通知

詳細は [docs/erd.md](docs/erd.md) を参照してください。

## 🧪 テストデータ

シードデータには以下が含まれています：

### ユーザー
- **管理者**: admin@tax-matching.com (password: password123)
- **クライアント**: tanaka@example.com (password: password123)
- **税理士**: yamada-tax@example.com (password: password123)

### 専門分野
- 個人事業主向け税務
- 法人税務
- 相続・贈与税
- IT・EC業界
- 飲食業界
- など

### AI診断質問
- 事業形態
- 売上規模
- 業種
- 税理士利用状況
- 求めるサービス
- 相談頻度
- 予算

## 🔐 セキュリティ

- **JWT認証**: アクセストークン + リフレッシュトークン
- **パスワードハッシュ化**: bcryptによる暗号化
- **バリデーション**: express-validatorによる入力検証
- **レート制限**: IP単位でのAPI呼び出し制限
- **CORS設定**: 許可されたオリジンのみアクセス可能
- **セキュリティヘッダー**: helmetによる設定

## 🚀 デプロイ

### Docker

```bash
# 本番用イメージビルド
docker build -t tax-matching-backend .

# コンテナ起動
docker run -p 3000:3000 --env-file .env tax-matching-backend
```

### 環境変数（本番用）

本番環境では以下を適切に設定してください：
- `NODE_ENV=production`
- `JWT_SECRET`: 強力な秘密鍵
- `DATABASE_URL`: 本番DB接続URL
- その他の本番環境設定

## 📈 モニタリング

- **ログ**: Winston によるファイル・コンソール出力
- **ヘルスチェック**: `/api/health` エンドポイント
- **エラー追跡**: 構造化されたエラーログ

## 🤝 開発

### コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm run start

# 型チェック
npm run lint

# データベース操作
npm run db:migrate    # マイグレーション実行
npm run db:generate   # Prismaクライアント生成
npm run db:seed       # シードデータ投入
npm run db:reset      # データベースリセット
```

### 開発ガイドライン

1. **TypeScript**: 厳密な型定義を使用
2. **エラーハンドリング**: 適切なエラーレスポンスを返却
3. **ログ**: 重要な操作はすべてログ出力
4. **バリデーション**: 入力値は必ずバリデーション
5. **セキュリティ**: 認証・認可の適切な実装

---

税理士マッチングサービス開発チーム