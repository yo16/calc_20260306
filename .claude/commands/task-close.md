# /task-close

PRがリモートdevにマージされた後のクロージング処理。

## 引数
なし（マージ済みfeatureブランチから自動取得）

## 使用するサブエージェント
- `beads-manager` : コーディング内容の要約、タスク更新・クローズ
- `git-manager` : dev pull、commit、push

## 処理フロー

### 1. リモートdevをローカルdevへpull → `git-manager`
- `git checkout dev`
- `git pull origin dev`

### 2. コーディング内容の要約 → `beads-manager`
- マージされたfeatureブランチのコミット履歴を確認
- 実施内容を要約文として作成
- 追加・変更したテストファイルのパス一覧を含める

### 3. Beadsタスク更新・クローズ → `beads-manager`
- featureブランチ名からBeadsIDを特定
- `bd update <BeadsID> --notes "<要約文>"` でnotesに実施内容を追記
  - notesには以下を含める:
    - 実施内容の要約
    - 追加・変更したファイル一覧
    - 追加・変更したテストファイル一覧
- `bd close <BeadsID>` でステータスをdoneに更新

### 4. ローカルdevへcommit → `git-manager`
- Beadsファイルの変更を `git add .beads/`
- `git commit` でBeadsステータス更新をコミット

### 5. リモートdevへpush → `git-manager`
- `git push origin dev`
