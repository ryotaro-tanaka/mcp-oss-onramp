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
- **GitHub CLI (`gh`)**: Must be installed and authenticated (`gh auth login`).
- **Node.js**: Version 18 or higher.

## License
MIT
