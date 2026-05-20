# mcp-oss-onramp
**AI Scout for truly available, beginner-friendly OSS issues.**

[日本語版はこちら](./docs/README_ja.md) | [Full Documentation](./docs/README_full.md)

## Quick Start
Run directly via `npx`:
```bash
npx mcp-oss-onramp
```

## MCP Configuration
Add this to your AI agent's configuration:

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

## Features
- **True Availability**: Checks linked PRs via GraphQL to filter out issues already being worked on.
- **AI-Optimized**: Summarizes issue bodies for efficient LLM consumption.
- **High Precision**: Targets beginner-friendly tasks even without explicit labels.

## Prerequisites
- **GitHub Authentication (Recommended)**: 
  - Set `MCP_OSS_ONRAMP_GITHUB_TOKEN` environment variable, OR
  - Install [GitHub CLI (gh)](https://cli.github.com/) and authenticate via `gh auth login`.
- **Node.js**: Version 18 or higher.

*Note: The server works without authentication but will be rate-limited and provide lower precision (no PR cross-referencing).*

## License
MIT
