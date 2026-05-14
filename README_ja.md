# mcp-oss-onramp (日本語版)

**AI Scout. First PR.**

`mcp-oss-onramp`は、AIエージェントが「本当に未割り当て」かつ「初心者向け」なGitHub Issueを見つけるためのMCPサーバです。

[English README](./README.md)

## ビジョン

OSSへの貢献は摩擦ゼロであるべきです。`good first issue`のようなラベルは存在しますが、実際にはラベルが付いていない初心者向けタスクや、放置されたPRが残っている「ゴーストタスク」も多く存在します。このツールはAIエージェントの**「高精度なセンサー」**となり、本当に空いている、ハードルの低いエントリーポイントをAIが正しく判断するためのクリーンな情報を提供します。

## 特徴

- **ラベルに依存しない検出**: タイトルや不活性期間を分析し、明示的なラベルがない「隠れた初心者向けタスク」もAIが発見できるようにします。
- **真の空き状況検出**: コメントや説明文を解析し、既存のツールでは見逃しがちなリンクされたPRも検出します。
- **AI最適化データ**: LLMが難易度やマッチ度を効率的に判断できるよう、Issueの内容をクリーンアップして提供します。
- **MCPネイティブ**: **Gemini CLI**, **Claude Code**, **Cursor**, **Windsurf** などの主要なAIエージェントから直接利用可能です。

## 仕組み

1.  **スカウト**: AIエージェントがリポジトリ名を指定してツールを呼び出します。
2.  **フィルタ**: GitHub GraphQLを使用してIssueとPRを取得し、本当に未着手のタスクを特定します。
3.  **レポート**: 構造化・グループ化されたJSONレスポンスを返します。

### ツール出力スキーマ

`scout_issues` ツールは、AIエージェントが推奨事項の優先順位を付けやすいように、グループ化されたJSONオブジェクトを返します。

```json
{
  "stats": {
    "total_scanned": 50,
    "recommended_count": 2,
    "in_progress_count": 5,
    "other_count": 43
  },
  "recommended": [
    {
      "issue_number": 123,
      "title": "READMEのリンク切れ修正",
      "summary": "ドキュメントへのリンクが404エラーになっています...",
      "url": "https://github.com/owner/repo/issues/123",
      "status": "Available",
      "recommendation_level": "High",
      "updated_at": "2026-05-14T10:00:00Z"
    }
  ],
  "in_progress": [
    {
      "issue_number": 124,
      "title": "APIドキュメントの更新",
      "status": "In Progress / Assigned",
      "recommendation_level": "Medium",
      "updated_at": "2026-05-14T09:00:00Z"
    }
  ],
  "other_recent": [
    {
      "issue_number": 125,
      "title": "機能Xの追加",
      "status": "Other",
      "recommendation_level": "Low"
    }
  ]
}
```

## はじめに

*(MCP環境向けの具体的なインストール手順は後日追加予定)*

### 前提条件
- [GitHub CLI (gh)](https://cli.github.com/)
- MCP対応のAIエージェント

## ライセンス

MIT
