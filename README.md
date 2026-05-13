# mcp-oss-onramp

**AI Scout. First PR.**

[日本語版はこちら](./README_ja.md)

`mcp-oss-onramp` is an MCP server that empowers AI agents to discover truly unassigned, beginner-friendly GitHub issues.

## Vision

OSS contribution should be frictionless. While GitHub labels like `good first issue` exist, many issues are already being worked on or have abandoned PRs. This tool provides AI agents with the "eyes" to see through the noise, detecting hidden PR links and assignee status to find the perfect entry point for your next contribution.

## Features

- **True Availability Detection**: Goes beyond basic filters to detect linked PRs even in comments/descriptions.
- **AI-Optimized Data**: Cleans and summarizes issue bodies for efficient LLM consumption.
- **Onboarding Focused**: Specifically tuned to find high-success, low-barrier tasks.
- **MCP Native**: Designed to be used directly by AI agents like Gemini CLI, Claude Code, and Cursor.

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
