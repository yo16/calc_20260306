# Agent Instructions

このプロジェクトでは **bd** (Beads) でタスク管理を行い、4つのサブエージェントでタスクを自動実行する。

## タスク管理 (Beads)

```bash
bd list                              # タスク一覧
bd show <id> --json                  # タスク詳細（JSON）
bd update <id> --status in_progress  # ステータス更新
bd update <id> --notes "..."         # notes追記
bd update <id> --add-label failed    # ラベル追加
bd close <id>                        # タスククローズ（status → done）
bd create "<title>" --parent <id>    # 子タスク作成
bd dep add <blocked> <blocker>       # 依存関係追加
bd dep remove <blocked> <blocker>    # 依存関係削除
bd dep list <id> --json              # 依存関係一覧
```

- タスクIDプレフィックス: `t-`（例: `t-abc`）
- retryカウントは notes に `retry_count: N` として記録

## サブエージェント

定義ファイル: `.claude/agents/` 配下

### `beads-manager`
- **役割**: タスクのステータス管理、notes更新、依存関係操作、新タスク作成、コーディング内容の要約
- **ツール**: Bash, Read, Grep, Glob
- **制約**: コードを書かない（src/, tests/ を編集しない）。git操作しない

### `git-manager`
- **役割**: featureブランチ作成・チェックアウト、commit、push、PR作成、dev pull
- **ツール**: Bash, Read, Grep, Glob
- **制約**: コードを書かない（src/, tests/ を編集しない）。force-push禁止。mainブランチ直接操作禁止
- **ブランチ規則**: `feature/<BeadsID>`（例: `feature/t-abc`）。PRベースは必ず `dev`

### `coder`
- **役割**: 仕様に基づくコード実装・修正
- **ツール**: Read, Write, Edit, Bash, Grep, Glob
- **制約**: Beads操作（`bd`コマンド）しない。git操作しない。.beads/ を編集しない
- **参照ドキュメント**: `docs/specification.md`, `CLAUDE.md`

### `tester`
- **役割**: テスト実行（`npm test`, `npm run lint`, `npx tsc --noEmit`）、結果分析、修正依頼の作成
- **ツール**: Read, Bash, Grep, Glob
- **制約**: コードを直接修正しない（Write, Edit を使わない）
- **失敗時**: テスト結果レポート（実行テスト、失敗内容、修正すべき点、再現手順）を返す

## カスタムスキル

定義ファイル: `.claude/commands/` 配下

| コマンド | 引数 | 使用エージェント | 概要 |
|---|---|---|---|
| `/task-start` | `<BeadsID>` | beads-manager, git-manager, coder, tester | タスク開始→コーディング→テスト |
| `/task-fix` | `[エラー内容]` | beads-manager, coder, tester | 修正ループ（最大3回リトライ） |
| `/task-open-pr` | なし | beads-manager, git-manager, tester | テスト確認→commit→push→PR作成 |
| `/task-close` | なし | beads-manager, git-manager | PRマージ後のクロージング |
| `/task-failed` | `<BeadsID>` | beads-manager, git-manager | 失敗処理→新タスク作成→依存付替 |

## Hooks

設定ファイル: `.claude/settings.json`

| イベント | マッチャー | 動作 |
|---|---|---|
| `PostToolUse` | `Edit\|Write\|NotebookEdit` | コード編集後に `npx next lint` を自動実行 |

## 典型的なタスク実行フロー

```
1. /task-start t-abc
   ├─ beads-manager: タスク取得
   ├─ git-manager: feature/t-abc ブランチ作成
   ├─ beads-manager: ステータス → in_progress
   ├─ coder: コーディング（lint hookで自動チェック）
   └─ tester: テスト実行
       ├─ 成功 → 2へ
       └─ 失敗 → /task-fix（自動、最大3回）→ 超過で /task-failed

2. /task-open-pr
   ├─ tester: テスト最終確認
   └─ git-manager: commit → push → PR作成

3. 人間: PRレビュー・マージ

4. /task-close
   ├─ git-manager: dev pull
   ├─ beads-manager: 要約作成 → notes追記 → bd close
   └─ git-manager: commit → push
```

## ブランチ戦略

```
main ← dev ← feature/t-xxx
```

- featureブランチ: `feature/<BeadsID>`
- PRベース: 必ず `dev`
- mainへの反映: 別途判断
