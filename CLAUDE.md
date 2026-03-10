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
- retryカウントは Beads の notes に `retry_count: N` として記録
- **タスク作成時のルール**: descriptionに必ず「テスト観点」を含めること。テスト観点がないタスクは作成しない
  - テスト観点の例: 正常系テスト、異常系テスト、境界値テスト、エラーハンドリング等

### ブランチ戦略
- `main` ← `dev` ← `feature/t-xxx` の3階層
- featureブランチ名は `feature/<BeadsID>`（例: `feature/t-abc`）
- PRは必ず `feature` → `dev` へ作成する
- `main` への反映は別途判断する
- BeadsIDとブランチの変換: `t-abc` ↔ `feature/t-abc`

### サブエージェント（`.claude/agents/`）

タスク実行時、以下の4つのサブエージェントを使い分ける。
各サブエージェントは `.claude/agents/` に定義されており、Agent toolで委譲する。

| サブエージェント名 | 役割 | 使用可能ツール | 制約 |
|---|---|---|---|
| `beads-manager` | タスク管理（ステータス・notes・依存関係） | Bash, Read, Grep, Glob | コードを書かない、git操作しない |
| `git-manager` | ブランチ・commit・push・PR | Bash, Read, Grep, Glob | コードを書かない |
| `coder` | コード実装・修正 | Read, Write, Edit, Bash, Grep, Glob | Beads操作しない、git操作しない |
| `tester` | テスト実行・結果分析 | Read, Bash, Grep, Glob | コードを直接修正しない |

**使用方法**: スキル内の各ステップで `→ <agent名>` と記載されたサブエージェントに委譲する。

### カスタムスキル（`.claude/commands/`）

| コマンド | 引数 | 概要 |
|---|---|---|
| `/task-start` | `<BeadsID>` | タスク開始。beads-manager→git-manager→coder→testerの順で実行 |
| `/task-fix` | `[エラー内容]` | 修正ループ。tester結果→coder修正→tester再実行（最大3回リトライ） |
| `/task-open-pr` | なし | テスト成功後のPR作成。tester確認→git-managerでcommit・push・PR |
| `/task-close` | なし | PRマージ後のクロージング。git-managerでpull→beads-managerで要約・close→git-managerでpush |
| `/task-failed` | `<BeadsID>` | 失敗処理。beads-managerでclose+新タスク作成→git-managerでdevへ戻る |

**典型的なフロー**:
```
/task-start t-abc → コーディング・テスト完了 → /task-open-pr → 人間がPRレビュー・マージ → /task-close
```

**失敗時のフロー**:
```
/task-start t-abc → テスト失敗 → /task-fix（自動） → 3回超過 → /task-failed t-abc（自動）
```

### Hooks（`.claude/settings.json`）

| イベント | マッチャー | 動作 |
|---|---|---|
| `PostToolUse` | `Edit\|Write\|NotebookEdit` | コード編集後に `npx next lint` を自動実行 |

lintエラーが発生した場合は `coder` サブエージェントに修正を依頼する。
