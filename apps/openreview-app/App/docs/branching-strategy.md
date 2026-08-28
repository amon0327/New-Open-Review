# OpenReview ブランチ戦略ガイド

## 現在の状況（推奨）
- **master ブランチのみ**で開発継続
- 単独開発かつプロトタイプ段階のため適切

## 将来の展開パターン

### Pattern 1: GitHub Flow（簡単）
```
master ─●─●─●─●─●─●→
        ↑   ↑
feature ─●─●─●─↗
hotfix ──●─●─↗
```

**使用場面:** 小〜中規模プロジェクト、継続的デプロイメント

### Pattern 2: Git Flow（複雑）
```
master ────●───────●────→ (リリース版)
          ↗         ↗
develop ─●─●─●─●─●─●─●─→ (開発メイン)
        ↑ ↑     ↑ ↑
feature ─●─●─────●─●─↗
hotfix ──────●─↗
```

**使用場面:** 大規模プロジェクト、定期リリース

## ブランチ導入タイミング

### 🟢 Phase 1: 現在（master のみ）
- 基本機能実装
- UI/UX調整
- プロトタイプ完成

### 🟡 Phase 2: 機能ブランチ導入
- チーム開発開始
- 本番環境構築
- 複数機能並行開発

### 🔴 Phase 3: 本格運用
- リリース管理
- ホットフィックス対応
- バージョン管理

## 簡単なブランチ操作

### 新機能ブランチ作成
```bash
# 新機能用ブランチ作成
git checkout -b feature/form-builder

# 作業実行
# ... ファイル編集 ...

# 自動コミット
./scripts/auto-commit.sh

# masterに戻る
git checkout master

# ブランチをマージ
git merge feature/form-builder

# 不要なブランチ削除
git branch -d feature/form-builder
```

### 実験用ブランチ
```bash
# 実験開始
git checkout -b experiment/new-ui

# 実験失敗時
git checkout master
git branch -D experiment/new-ui  # 強制削除

# 実験成功時
git checkout master
git merge experiment/new-ui
```

## 自動コミットスクリプト対応

現在の自動コミットスクリプトは全ブランチで動作します：
```bash
./scripts/auto-commit.sh
```

ブランチ情報も自動でコミットメッセージに含まれます。