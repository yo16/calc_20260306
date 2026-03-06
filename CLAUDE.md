# Project Instructions

## Overview

Next.jsによるWeb電卓アプリケーション（JWT認証付き）。
詳細仕様は `docs/specification.md` を参照すること。

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Auth**: JWT（httpOnly cookie）、bcryptパスワードハッシュ
- **Calculation**: 自前の再帰下降パーサー（`eval()` 使用禁止）
- **Storage**: ファイルベース（JSONファイル）→ 将来DB移行予定

## Architecture Rules

### Repository Pattern
- データアクセスは必ず `lib/repositories/types.ts` のインターフェース経由
- 現在の実装: `FileUserRepository`（JSONファイル）
- 新しいストレージを追加する場合はインターフェースを実装し、DI箇所のみ変更

### Directory Structure
```
src/app/           → ページ・APIルート（App Router）
src/components/    → UIコンポーネント（calculator/, auth/）
src/lib/           → ビジネスロジック（auth/, calculator/, repositories/）
src/types/         → 型定義
data/              → ローカルストレージ（.gitignore対象）
tests/             → テスト
docs/              → ドキュメント
```

### Naming Conventions
- ファイル: kebab-case（例: `file-user-repository.ts`）
- コンポーネント: PascalCase（例: `Calculator.tsx`）
- 関数・変数: camelCase
- 型・インターフェース: PascalCase

## Security Constraints

- `eval()` は絶対に使用しない
- パスワードは必ずbcryptでハッシュ化
- JWTはhttpOnly + Secure + SameSite=Strict cookieで保存
- JWT秘密鍵は `.env.local` で管理（コミット禁止）
- 計算式はホワイトリスト方式でバリデーション（数字・演算子・小数点のみ）

## Development Notes

- `data/` ディレクトリ内のファイルはコミットしない
- 計算処理は必ずサーバーサイド（API Route）で実行
- 計算履歴はクライアントstateのみ（永続化しない）
- テストは `tests/` ディレクトリに配置
