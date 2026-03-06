# /task-fix

テスト失敗またはPRレビューNGの場合の修正ループ処理。

## 引数
- `$ARGUMENTS` : 修正理由やエラー内容（任意）

## 使用するサブエージェント
- `beads-manager` : retryカウント管理
- `coder` : コード修正
- `tester` : テスト再実行・結果分析

## 呼ばれるタイミング
- テスト失敗時
- PRレビューでNG時
- lint / typecheck NG時

## 処理フロー

### 1. 現在のブランチ確認
- `git branch --show-current` で現在のブランチを取得
- `feature/t-xxx` 形式であることを確認（違えばエラー）

### 2. BeadsID取得 → `beads-manager`
- ブランチ名から `feature/` を除去してBeadsIDを取得
- `bd show <BeadsID> --json` でタスク情報を取得

### 3. 修正内容の整理
- $ARGUMENTS またはテスト結果から、修正すべき内容を整理する
- エラー内容、修正すべき点、再現手順をまとめる

### 4. コード修正 → `coder`
- 整理した修正内容を渡し、コードを修正させる
- 変更ファイルリストを受け取る

### 5. テスト再実行 → `tester`
- `coder` から受け取った変更ファイルリストを渡す
- テストを実行する

### 6. 結果判定
- **成功**: 修正完了を報告して終了
- **失敗**:
  - `beads-manager` でretryカウントを+1（`bd update <BeadsID> --notes "retry_count: N"`）
  - retryカウントが3を超えた場合（4回目のNG）: `/task-failed <BeadsID>` を実行して停止
  - 3以下: `tester` の結果レポートをもとにステップ3に戻って再度修正
