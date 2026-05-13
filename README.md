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
2.  **Filter**: The server fetches issues and PRs, cross-referencing them to find "ghost" tasks that are open but unassigned.
3.  **Report**: Returns a structured, concise list of recommended issues for the AI to present to the user.

## Getting Started

*(Detailed installation instructions for MCP environments to be added)*

### Prerequisites
- [GitHub CLI (gh)](https://cli.github.com/)
- An MCP-compatible AI agent

## License

MIT
