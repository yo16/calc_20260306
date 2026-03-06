# 電卓アプリ 仕様書

## 1. プロジェクト概要

Next.jsを使用したWeb電卓アプリケーション。
ユーザー認証機能を備え、認証済みユーザーのみが電卓を使用できる。
計算処理はサーバーサイドで実行し、結果をクライアントに返す。

### 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| 認証 | JWT (JSON Web Token) |
| パスワードハッシュ | bcrypt |
| 計算エンジン | 自前パーサー（四則演算のみのため） |
| スタイリング | CSS Modules or Tailwind CSS（要検討） |

---

## 2. 機能一覧

### 2.1 認証機能

#### サインアップ（新規登録）
- ユーザー名とパスワードによるアカウント作成
- パスワードはbcryptでハッシュ化して保存
- ユーザー名の重複チェック
- パスワードの最低要件（8文字以上）

#### ログイン
- ユーザー名とパスワードによる認証
- 認証成功時にJWTトークンを発行
- トークンはhttpOnly cookieに保存（XSS対策）
- トークンの有効期限: 24時間（要検討）

#### ログアウト
- cookieからJWTトークンを削除
- クライアント側のセッション状態をクリア

#### ルート保護
- 未認証ユーザーは電卓ページにアクセス不可
- Next.js Middlewareでリダイレクト制御
- `/login`, `/signup` は未認証でもアクセス可能

### 2.2 電卓機能

#### 対応演算
- 加算（+）
- 減算（-）
- 乗算（×）
- 除算（÷）

#### UI要素
- 数字ボタン: 0-9
- 小数点ボタン: .
- 演算子ボタン: +, -, ×, ÷
- 実行ボタン: =
- クリアボタン: C（全クリア）, CE（直前の入力削除）
- 表示ディスプレイ: 入力中の数式と計算結果

#### 計算フロー
1. クライアントで数式を組み立てる
2. `=` ボタン押下でサーバーAPIに数式を送信
3. サーバーで数式をパースし計算を実行
4. 結果をクライアントに返却して表示

#### エラーハンドリング
- ゼロ除算: エラーメッセージを表示
- 不正な数式: バリデーションエラーを表示
- APIエラー: ネットワークエラー等の通知

### 2.3 計算履歴（セッション内）

- ログイン中の計算結果をクライアント側のstateで保持
- 数式と結果のペアをリスト表示
- ログアウトまたはページリロードで履歴はクリア
- サーバーへの永続化は行わない

---

## 3. アーキテクチャ

### 3.1 ディレクトリ構成（予定）

```
calc_20260306/
├── docs/                      # ドキュメント
│   └── specification.md       # 本仕様書
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── signup/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   └── calculate/route.ts
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── calculator/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx           # ルート（→ログイン or 電卓へリダイレクト）
│   ├── components/
│   │   ├── calculator/
│   │   │   ├── Calculator.tsx
│   │   │   ├── Display.tsx
│   │   │   ├── Button.tsx
│   │   │   └── History.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── jwt.ts         # JWT生成・検証
│   │   │   └── password.ts    # bcryptハッシュ
│   │   ├── calculator/
│   │   │   └── engine.ts      # 数式パーサー・計算エンジン
│   │   └── repositories/
│   │       ├── types.ts       # リポジトリインターフェース定義
│   │       └── file-user-repository.ts  # ファイルベース実装
│   ├── middleware.ts           # 認証ミドルウェア
│   └── types/
│       └── index.ts           # 型定義
├── data/                      # ローカルファイルストレージ
│   └── users.json             # ユーザーデータ（.gitignore対象）
└── tests/                     # テスト
    ├── calculator/
    │   └── engine.test.ts
    └── auth/
        └── auth.test.ts
```

### 3.2 リポジトリパターン（ストレージ抽象化）

将来的なDB移行を見据え、データアクセス層をインターフェースで抽象化する。

```typescript
// lib/repositories/types.ts
interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  existsByUsername(username: string): Promise<boolean>;
}
```

**現在の実装**: `FileUserRepository`（JSONファイルベース）
**将来の実装例**: `PrismaUserRepository`, `MongoUserRepository` 等

切り替えは依存性注入により、リポジトリのインスタンス生成箇所を変更するだけで対応可能とする。

### 3.3 計算エンジン

サーバーサイドで数式を安全に計算するため、`eval()` は**使用しない**。

四則演算のみのため、自前の再帰下降パーサーを実装する。

```
入力: "3 + 5 * 2"
パース: 演算子の優先順位を考慮したAST構築
計算: ASTを評価して結果を返却
出力: 13
```

**安全性**:
- 数字と演算子以外の文字を受け付けない入力バリデーション
- 最大文字数制限（例: 100文字）
- タイムアウト制御

---

## 4. API設計

### 4.1 認証API

#### POST /api/auth/signup
```
Request:
  { "username": "string", "password": "string" }
Response (201):
  { "message": "User created successfully" }
Error (409):
  { "error": "Username already exists" }
Error (400):
  { "error": "Password must be at least 8 characters" }
```

#### POST /api/auth/login
```
Request:
  { "username": "string", "password": "string" }
Response (200):
  Set-Cookie: token=<JWT> (httpOnly, secure, sameSite=strict)
  { "message": "Login successful" }
Error (401):
  { "error": "Invalid credentials" }
```

#### POST /api/auth/logout
```
Response (200):
  Set-Cookie: token=; expires=past (クリア)
  { "message": "Logged out successfully" }
```

### 4.2 計算API

#### POST /api/calculate
```
Headers:
  Cookie: token=<JWT>
Request:
  { "expression": "3 + 5 * 2" }
Response (200):
  { "expression": "3 + 5 * 2", "result": 13 }
Error (400):
  { "error": "Invalid expression" }
Error (400):
  { "error": "Division by zero" }
Error (401):
  { "error": "Unauthorized" }
```

---

## 5. セキュリティ考慮事項

| 項目 | 対策 |
|------|------|
| パスワード保存 | bcryptによるハッシュ化（ソルト付き） |
| XSS | httpOnly cookieでJWT保存、入力のサニタイズ |
| CSRF | SameSite=Strict cookie設定 |
| 計算式インジェクション | ホワイトリスト方式の入力バリデーション（数字・演算子・括弧・小数点のみ） |
| ブルートフォース | ログイン試行回数制限（将来実装検討） |
| JWT秘密鍵 | 環境変数で管理（.envファイル、コミット対象外） |

---

## 6. 環境変数

```env
# .env.local（.gitignore対象）
JWT_SECRET=<ランダムな秘密鍵>
JWT_EXPIRES_IN=24h
DATA_DIR=./data
```

---

## 7. 追加検討事項

以下は初期リリースには含めないが、将来的に検討する項目。

| 項目 | 概要 | 優先度 |
|------|------|--------|
| DB移行 | Prisma + PostgreSQL等への移行 | 高 |
| OAuth対応 | Google/GitHubログイン | 中 |
| 括弧対応 | 計算式での括弧サポート | 中 |
| 計算履歴永続化 | ユーザーごとの履歴をDBに保存 | 中 |
| レート制限 | API呼び出し回数制限 | 中 |
| ログイン試行制限 | ブルートフォース対策 | 中 |
| アクセシビリティ | キーボード操作対応、ARIA属性 | 低 |
| PWA対応 | オフライン対応、ホーム画面追加 | 低 |
| i18n | 多言語対応 | 低 |

---

## 8. 開発フェーズ

### Phase 1: プロジェクトセットアップ
- Next.js プロジェクト初期化（TypeScript）
- ディレクトリ構造の構築
- 基本的な設定ファイル（ESLint, etc.）

### Phase 2: 認証機能
- リポジトリパターンの実装（インターフェース + ファイルベース実装）
- サインアップAPI
- ログイン/ログアウトAPI
- JWT生成・検証
- 認証ミドルウェア
- ログイン/サインアップUIページ

### Phase 3: 電卓機能
- 計算エンジン（パーサー）の実装
- 計算API
- 電卓UIコンポーネント
- セッション内計算履歴

### Phase 4: 統合・テスト
- 認証フローの結合テスト
- 計算エンジンのユニットテスト
- エラーハンドリングの確認
- UIの調整
