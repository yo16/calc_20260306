# /task-failed

タスクが失敗した場合のメンテナンス処理。

## 引数
- `$ARGUMENTS` : BeadsID (例: `t-abc`)

## 使用するサブエージェント
- `beads-manager` : タスククローズ、新タスク作成、依存関係付け替え
- `git-manager` : featureブランチcommit、devチェックアウト

## 呼ばれるタイミング
- retryカウントが3を超えた場合（4回目のNG）
- 人間がPRでマージせず、作業を中断した場合

## 処理フロー

### 1. Beadsタスク(Task-A)のクローズ → `beads-manager`
- `bd update $ARGUMENTS --add-label failed` でfailedラベルを追加
- `bd update $ARGUMENTS --notes "<実施内容とエラー内容>"` でnoteに追記
- `bd close $ARGUMENTS` でタスクをクローズ

### 2. featureブランチにcommit → `git-manager`
- 現在のfeatureブランチ上の変更（失敗した作業内容）をcommitする
- pushはしない（失敗した記録をローカルに残す）

### 3. 新タスク(Task-B)作成・依存関係付け替え → `beads-manager`
- Task-Aの依存関係を確認: `bd dep list $ARGUMENTS --json`
- Task-Aと同じタイトル・説明で新タスクを作成:
  ```
  bd create "<Task-Aのタイトル>" \
    --description "<Task-Aの説明>" \
    --notes "このタスクは $ARGUMENTS (failed) の再実施です。前回の失敗内容を踏まえて実施してください。\n\n前回の失敗内容:\n<エラー内容>"
  ```
- Task-Aがブロックしていたタスクの依存関係をTask-Bに付け替え:
  - `bd dep remove <blocked-id> $ARGUMENTS` で旧依存を削除
  - `bd dep add <blocked-id> <Task-B-ID>` で新依存を追加
- Task-Aの親がある場合、Task-Bも同じ親に設定

### 4. devブランチへチェックアウト → `git-manager`
- `git checkout dev`

## 注意事項
- Task-Aのfeatureブランチはローカルに残す（削除しない）
- Task-Bには前回の失敗経験が引き継がれるようnotesに記載する
- 依存関係の付け替えにより、後続タスクのブロックが維持される
