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

## Workflow

ワークフローの詳細は `docs/workflow.md` を参照すること。

### Beads (タスク管理)
- タスクIDプレフィックス: `t-`（例: `t-abc`）
- Beads CLI (`bd`) でタスクを管理する
- タスクのステータス: `open` → `in_progress` → `done` (または `failed` ラベル付きclose)

### ブランチ戦略
- `main` ← `dev` ← `feature/t-xxx` の3階層
- featureブランチ名は `feature/<BeadsID>`（例: `feature/t-abc`）
- PRは必ず `feature` → `dev` へ作成する
- `main` への反映は別途判断する

### エージェント役割分担
タスク実行時、以下の4つの役割でエージェントを使い分ける:

1. **Beads管理エージェント**: タスクのステータス管理、notes更新、依存関係操作のみ。コードを書かない
2. **Git/GitHubエージェント**: ブランチ操作、commit、push、PR作成のみ。コードを書かない
3. **コーディングエージェント**: 仕様に基づくコード実装・修正を行う
4. **テストエージェント**: テスト実行と結果分析。失敗時は直接修正せず、修正依頼を返す

### カスタムスキル
- `/task-start <BeadsID>` : タスク開始（Beads更新 → ブランチ作成 → コーディング → テスト）
- `/task-fix [エラー内容]` : テスト失敗・レビューNG時の修正ループ（最大3回リトライ）
- `/task-open-pr` : テスト成功後のPR作成
- `/task-close` : PRマージ後のクロージング（dev pull → Beads更新 → push）
- `/task-failed <BeadsID>` : 失敗時の後処理（タスククローズ → 新タスク作成 → 依存関係付け替え）
