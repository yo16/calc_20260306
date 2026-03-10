# /task-start

BeadsIDを指定してタスクを開始する。

## 引数
- `$ARGUMENTS` : BeadsID (例: `t-abc`)

## 使用するサブエージェント
- `beads-manager` : タスク情報取得・ステータス更新・retry管理
- `git-manager` : featureブランチ作成
- `coder` : コード実装
- `tester` : テスト実行・結果分析

## 処理フロー

### 1. Beadsタスク取得 → `beads-manager`
- `bd show $ARGUMENTS --json` でタスク情報を取得する
- タスクが存在しない場合はエラーで停止

### 2. featureブランチ作成 → `git-manager`
- 現在devブランチにいることを確認（いなければエラー）
- `git checkout -b feature/$ARGUMENTS` でfeatureブランチを作成・チェックアウト

### 3. ステータス更新 → `beads-manager`
- `bd update $ARGUMENTS --status in_progress` でステータスをin_progressに更新

### 4. コーディング実行 → `coder`
- Beadsタスクのtitle, description, notes を渡し、タスク内容を伝える
- `docs/specification.md` を参照し、関連する仕様を理解させる
- コーディングを実行する
- 編集後のlint hookでエラーがあれば修正する
- 完了後、変更ファイルリストを受け取る

### 5. テスト実行 → `tester`
- `coder` から受け取った変更ファイルリストを渡す
- テストが成功したら `/task-open-pr` を案内する
- テストが失敗した場合:
  - `tester` からテスト結果レポート（失敗内容、修正すべき点、再現手順）を受け取る
  - `coder` に修正依頼を出す
  - 修正後、再度 `tester` でテスト実行
  - このループは最大3回まで
  - `beads-manager` で retryカウントを記録（`bd update $ARGUMENTS --notes "retry_count: N"`）
  - 3回超過で `/task-failed $ARGUMENTS` を実行する
