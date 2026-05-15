# mcp-oss-onramp (日本語版)

**AI Scout. First PR.**

`mcp-oss-onramp`は、AIエージェントが「本当に未割り当て」かつ「初心者向け」なGitHub Issueを見つけるためのMCPサーバです。

[English README](../README.md)

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
    "total_scanned": 26,
    "recommended_count": 1,
    "in_progress_count": 3,
    "other_count": 22
  },
  "recommended": [
    {
      "issue_number": 230,
      "title": "Fix typo in contribution guide",
      "summary": "There is a typo in the 'Getting Started' section of CONTRIBUTING.md. 'intall' should be 'install'...",
      "url": "https://github.com/owner/repo/issues/230",
      "status": "Available",
      "recommendation_level": "High",
      "updated_at": "2026-05-14T12:00:00Z"
    }
  ],
  "in_progress": [
    {
      "issue_number": 229,
      "title": "Broken `CLI Reference` link in published README (404 on npm and post-install)",
      "summary": "The `README.md` shipped with `@aisuite/chub@0.1.4` links to a non-existent `cli-reference.md`...",
      "url": "https://github.com/andrewyng/context-hub/issues/229",
      "status": "In Progress / Assigned",
      "recommendation_level": "Medium",
      "updated_at": "2026-04-28T22:12:21Z"
    }
  ],
  "other_recent": [
    {
      "issue_number": 41,
      "title": "version specific docs",
      "status": "Other",
      "recommendation_level": "Low"
    }
  ]
}
```

## インストール・設定

### npxで実行
`npx`を使用して直接実行できます。

```bash
npx mcp-oss-onramp
```

### AIエージェントでの設定例

#### Claude Desktop
`claude_desktop_config.json` に以下の設定を追加してください：

```json
{
  "mcpServers": {
    "oss-onramp": {
      "command": "npx",
      "args": ["-y", "mcp-oss-onramp"]
    }
  }
}
```

#### Gemini CLI
`config.yaml` や設定ファイルに以下を記述してください：

```yaml
mcpServers:
  oss-onramp:
    command: npx
    args: ["-y", "mcp-oss-onramp"]
```

## 前提条件
- [GitHub CLI (gh)](https://cli.github.com/) (認証済みであること)
- Node.js 18+

## ライセンス

MIT
