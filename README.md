# mcp-oss-onramp

**AI Scout. First PR.**

[日本語版はこちら](./README_ja.md)

`mcp-oss-onramp` is an MCP server that empowers AI agents to discover truly unassigned, beginner-friendly GitHub issues.

## Vision

OSS contribution should be frictionless. While labels like `good first issue` exist, many beginner-friendly tasks remain unlabeled, or are already being worked on by "ghost" PRs. This tool acts as a **high-precision sensor** for AI agents, providing them with the clean, cross-referenced data they need to identify truly open, low-barrier entry points for your next contribution.

## Features

- **Beyond Labels**: Detects "hidden" beginner tasks by analyzing keywords and inactivity, even without explicit labels.
- **True Availability Detection**: Sees through the noise to detect linked PRs in comments and descriptions.
- **AI-Ready Context**: Cleans and summarizes issue data so your AI agent can effectively judge difficulty and fit.
- **MCP Native**: Built for leading AI agents including **Gemini CLI**, **Claude Code**, **Cursor**, and **Windsurf**.

## How it Works

1.  **Scout**: AI agent calls the tool with a repository name.
2.  **Filter**: The server fetches issues and PRs using GitHub GraphQL, identifying truly unassigned tasks.
3.  **Report**: Returns a structured, grouped JSON response.

### Tool Output Schema

The `scout_issues` tool returns a grouped JSON object to help AI agents prioritize recommendations:

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
      "title": "Fix broken link in README",
      "summary": "The link to docs is 404...",
      "url": "https://github.com/owner/repo/issues/123",
      "status": "Available",
      "recommendation_level": "High",
      "updated_at": "2026-05-14T10:00:00Z"
    }
  ],
  "in_progress": [
    {
      "issue_number": 124,
      "title": "Update API docs",
      "status": "In Progress / Assigned",
      "recommendation_level": "Medium",
      "updated_at": "2026-05-14T09:00:00Z"
    }
  ],
  "other_recent": [
    {
      "issue_number": 125,
      "title": "Add feature X",
      "status": "Other",
      "recommendation_level": "Low"
    }
  ]
}
```

## Getting Started

*(Detailed installation instructions for MCP environments to be added)*

### Prerequisites
- [GitHub CLI (gh)](https://cli.github.com/)
- An MCP-compatible AI agent

## License

MIT
