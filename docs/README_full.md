# mcp-oss-onramp

**AI Scout. First PR.**

[Back to Summary](../README.md) | [日本語版はこちら](./README_ja.md)

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

## Installation

### Via npx
You can run the server directly using `npx`:

```bash
npx mcp-oss-onramp
```

### Configuration for AI Agents

#### Claude Desktop
Add this to your `claude_desktop_config.json`:

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
Add this to your `config.yaml` or relevant configuration:

```yaml
mcpServers:
  oss-onramp:
    command: npx
    args: ["-y", "mcp-oss-onramp"]
```

## Prerequisites
- **GitHub Authentication (Recommended)**: 
  - Set `MCP_OSS_ONRAMP_GITHUB_TOKEN` environment variable, OR
  - Install [GitHub CLI (gh)](https://cli.github.com/) and authenticate via `gh auth login`.
- **Node.js**: Version 18 or higher.

*Note: The server works without authentication but will be rate-limited and provide lower precision (no PR cross-referencing).*

## Tips: Finding Repositories to Contribute

If you're not sure which repository to start with, check out these resources to find interesting projects, then use their repository name (e.g., `owner/repo`) with this tool:

- **[HelloGitHub](https://github.com/521xueweihan/HelloGitHub)**: A popular repository that shares interesting open-source projects monthly.
- **[GitHub Explore](https://github.com/explore)**: Discover projects based on your interests.
- **[Up For Grabs](https://up-for-grabs.net/)**: A list of projects which have curated tasks for new contributors.

## License

MIT
