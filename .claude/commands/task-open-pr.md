# /task-open-pr

テスト成功後にPRを作成する。

## 引数
なし（現在のブランチから自動取得）

## 使用するサブエージェント
- `beads-manager` : タスク情報取得
- `git-manager` : commit、push、PR作成
- `tester` : テスト確認

## 処理フロー

### 1. ブランチ確認
- `git branch --show-current` で現在のブランチを取得
- `feature/t-xxx` 形式であることを確認

### 2. BeadsID取得 → `beads-manager`
- ブランチ名から `feature/` を除去してBeadsIDを取得
- `bd show <BeadsID> --json` でタスク情報を取得

### 3. テスト確認 → `tester`
- テストを実行して全テストがパスすることを確認
- 失敗した場合はPR作成を中止し、`/task-fix` を案内する

### 4. commit作成 → `git-manager`
- `git add` で変更をステージング（.beadsの変更も含む）
- Beadsタスクの内容に基づいた適切なコミットメッセージを生成
- `git commit` でコミット

### 5. push → `git-manager`
- `git push -u origin feature/<BeadsID>` でリモートにpush

### 6. PR作成 → `git-manager`
- `gh pr create --base dev` でdevブランチへのPRを作成
- PRタイトル: Beadsタスクのタイトルを使用
- PR本文: Beadsタスクの概要、変更内容のサマリー、テスト結果を含める
