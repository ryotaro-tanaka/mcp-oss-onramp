# mcp-oss-onramp
**AI Scout for truly available, beginner-friendly OSS issues.**

[日本語版はこちら](./docs/README_ja.md) | [Full Documentation](./docs/README_full.md)

## Installation

### Via Smithery (Recommended)
You can install this server automatically via [Smithery](https://smithery.ai/server/mcp-oss-onramp):
```bash
npx -y @smithery/cli install mcp-oss-onramp --config $HOME/.claude/claude_desktop_config.json
```

### Manual Configuration
Run directly via `npx`:
```bash
npx mcp-oss-onramp
```

Add this to your AI agent's configuration (e.g., `claude_desktop_config.json`):

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
- **GitHub CLI (`gh`)**: Must be installed and authenticated (`gh auth login`). **This is required even when installed via Smithery.**
- **Node.js**: Version 18 or higher.

## License
MIT
