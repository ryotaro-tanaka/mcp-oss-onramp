#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { Octokit } from "@octokit/core";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Interface for GitHub GraphQL response
 */
interface GraphQLResponse {
  repository: {
    issues: {
      nodes: {
        number: number;
        title: string;
        body: string;
        url: string;
        updatedAt: string;
        labels: { nodes: { name: string }[] };
        assignees: { nodes: { login: string }[] };
        timelineItems: {
          nodes: {
            __typename: string;
            source?: { number: number; state: string };
            subject?: { number: number; state: string };
          }[];
        };
      }[];
    };
  };
}

/**
 * Interface for simplified issue result
 */
interface IssueResult {
  issue_number: number;
  title: string;
  summary: string;
  url: string;
  status: string;
  recommendation_level: string;
  updated_at: string;
}

interface GraphQLIssueNode {
  number: number;
  title: string;
  body: string;
  url: string;
  updatedAt: string;
  labels: { nodes: { name: string }[] };
  assignees: { nodes: { login: string }[] };
  timelineItems: {
    nodes: any[]; // Simplified for the map function
  };
}

/**
 * Get GitHub token from environment or GH CLI
 */
function getGitHubToken(): string | null {
  // 1. Try environment variables (Priority: Specific > Standard)
  const envToken = 
    process.env.MCP_OSS_ONRAMP_GITHUB_TOKEN || 
    process.env.GITHUB_TOKEN || 
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  
  if (envToken) return envToken;

  // 2. Try GH CLI
  try {
    return execSync("gh auth token", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/**
 * Load fallback sample data
 */
function getSampleData() {
  try {
    const samplePath = join(__dirname, "..", "samples", "scout_result_grouped.json");
    const content = readFileSync(samplePath, "utf8");
    const parsed = JSON.parse(content);
    // The sample file has a specific structure: {"result":{"content":[{"type":"text","text":"..."}]}}
    if (parsed.result?.content?.[0]?.text) {
      return JSON.parse(parsed.result.content[0].text);
    }
    return parsed;
  } catch (error) {
    return {
      error: "Failed to load sample data",
      message: "Please provide a GITHUB_TOKEN or login via 'gh auth login' for live data."
    };
  }
}

const server = new Server(
  {
    name: "mcp-oss-onramp",
    version: "0.1.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Clean and summarize issue body for AI consumption
 */
function cleanBody(body: string): string {
  if (!body) return "No description provided.";
  let summary = body.replace(/#+\s*/g, ""); // Remove markdown headers
  summary = summary.replace(/[\r\n]+/g, " "); // Replace newlines with spaces
  summary = summary.trim();
  return summary.length > 200 ? summary.substring(0, 200) + "..." : summary;
}

/**
 * Scout issues in a repository using GraphQL or REST (Hybrid Mode)
 */
async function scoutIssues(repository: string) {
  const [owner, name] = repository.split("/");
  if (!owner || !name) {
    throw new Error("Repository must be in 'owner/name' format");
  }

  const token = getGitHubToken();
  const octokit = new Octokit(token ? { auth: token } : {});
  const beginnerKeywords = ['good first issue', 'documentation', 'docs', 'readme', 'link', 'typo', 'beginner'];

  try {
    let results: IssueResult[] = [];

    if (token) {
      // --- Authenticated Mode (High Precision via GraphQL) ---
      const query = `
        query($owner:String!, $name:String!) {
          repository(owner:$owner, name:$name) {
            issues(first: 50, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
                number
                title
                body
                url
                updatedAt
                labels(first: 10) { nodes { name } }
                assignees(first: 5) { nodes { login } }
                timelineItems(first: 20, itemTypes: [CONNECTED_EVENT, CROSS_REFERENCED_EVENT]) {
                  nodes {
                    __typename
                    ... on ConnectedEvent {
                      subject {
                        ... on PullRequest {
                          number
                          state
                        }
                      }
                    }
                    ... on CrossReferencedEvent {
                      source {
                        ... on PullRequest {
                          number
                          state
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await octokit.graphql<GraphQLResponse>(query, { owner, name });
      const issues = response.repository.issues.nodes;

      results = issues.map((issue: GraphQLIssueNode) => {
        const labels = issue.labels.nodes.map((l: { name: string }) => l.name.toLowerCase());
        const titleLower = issue.title.toLowerCase();
        const isBeginner = beginnerKeywords.some(kw => labels.includes(kw) || titleLower.includes(kw));
        const hasAssignee = issue.assignees.nodes.length > 0;
        
        // Check for any linked PR that is still OPEN
        const hasActivePR = issue.timelineItems.nodes.some((item: any) => {
          const pr = item.source || item.subject;
          return pr && pr.state === "OPEN";
        });
        
        const isAvailable = !hasAssignee && !hasActivePR;
        let recommendation_level = "Low";
        let status_label = "Other";

        if (isBeginner) {
          if (isAvailable) {
            recommendation_level = "High";
            status_label = "Available";
          } else {
            recommendation_level = "Medium";
            status_label = "In Progress / Assigned";
          }
        }

        return {
          issue_number: issue.number,
          title: issue.title,
          summary: cleanBody(issue.body),
          url: issue.url,
          status: status_label,
          recommendation_level: recommendation_level,
          updated_at: issue.updatedAt
        };
      });
    } else {
      // --- Unauthenticated Mode (Low Precision via REST) ---
      const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner,
        repo: name,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 50
      });

      results = response.data.map((issue: any) => {
        // Skip Pull Requests (GitHub REST API returns both in /issues)
        if (issue.pull_request) return null;

        const labels = issue.labels.map((l: any) => (typeof l === 'string' ? l : l.name).toLowerCase());
        const titleLower = issue.title.toLowerCase();
        const isBeginner = beginnerKeywords.some(kw => labels.includes(kw) || titleLower.includes(kw));
        const hasAssignee = issue.assignees && issue.assignees.length > 0;
        
        // REST API doesn't easily give us timeline/cross-references in one call
        // We mark it as potentially available but with a disclaimer
        let recommendation_level = "Low";
        let status_label = "Other (Auth required for precision)";

        if (isBeginner) {
          if (!hasAssignee) {
            recommendation_level = "High";
            status_label = "Likely Available (Auth required for precision)";
          } else {
            recommendation_level = "Medium";
            status_label = "Assigned (Auth required for precision)";
          }
        }

        return {
          issue_number: issue.number,
          title: issue.title,
          summary: cleanBody(issue.body || ""),
          url: issue.html_url,
          status: status_label,
          recommendation_level: recommendation_level,
          updated_at: issue.updated_at
        };
      }).filter(Boolean) as IssueResult[];
    }

    const recommended = results.filter(r => r.recommendation_level === "High");
    const in_progress = results.filter(r => r.recommendation_level === "Medium");
    const other_recent = results.filter(r => r.recommendation_level === "Low").slice(0, 10);

    return {
      stats: {
        total_scanned: results.length,
        recommended_count: recommended.length,
        in_progress_count: in_progress.length,
        other_count: results.length - recommended.length - in_progress.length,
        auth_mode: token ? "Authenticated" : "Unauthenticated (Rate limited, low precision)"
      },
      recommended,
      in_progress,
      other_recent,
      _notice: token ? undefined : "High precision scouting (PR cross-referencing) requires a GitHub token. Please set GITHUB_TOKEN or login with 'gh auth login'."
    };
  } catch (error: any) {
    // If rate limit hit (403) or generic error in unauthenticated mode, fallback to sample data
    if (error.status === 403 || error.status === 401 || !token) {
      const sample = getSampleData();
      return {
        ...sample,
        _notice: "Rate limit reached or authentication failed. Returning sample data. Please provide GITHUB_TOKEN for live results.",
        _original_error: error.message
      };
    }
    throw new Error(`Failed to scout issues: ${error.message}`);
  }
}

/**
 * Register tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scout_issues",
        description: "Scout a GitHub repository to discover truly available, beginner-friendly issues. This tool uses GitHub GraphQL for high-precision PR cross-referencing. \n\nIMPORTANT FOR AI AGENTS: To avoid rate limits and enable high-precision scouting, ensure the `MCP_OSS_ONRAMP_GITHUB_TOKEN` environment variable is set with a GitHub Personal Access Token. If unauthenticated, the tool fallbacks to a lower-precision REST mode.",
        inputSchema: {
          type: "object",
          properties: {
            repository: {
              type: "string",
              description: "Full repository name (e.g., 'owner/repo')",
            },
          },
          required: ["repository"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "scout_issues") {
    const { repository } = request.params.arguments as {
      repository: string;
    };

    const results = await scoutIssues(repository);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

/**
 * Start server
 */
async function main() {
  const args = process.argv.slice(2);
  const version = "0.1.3";

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
MCP OSS Onramp Server v${version}

Usage:
  npx mcp-oss-onramp [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version information

Description:
  An MCP (Model Context Protocol) server that provides tools to scout 
  beginner-friendly OSS issues. This server is designed to be called 
  by AI agents (like Claude Desktop) using the stdio transport.

Requirements:
  - GitHub Token (set via MCP_OSS_ONRAMP_GITHUB_TOKEN or GITHUB_TOKEN) [Recommended]
  - OR GitHub CLI (gh) installed and authenticated ('gh auth login')
  - Node.js 18 or higher

Note: High precision scouting requires authentication.
    `);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(version);
    process.exit(0);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  const token = getGitHubToken();
  const authStatus = token ? "Authenticated (High Precision)" : "Unauthenticated (Low Precision / Rate Limited)";
  console.error(`MCP OSS Onramp server v${version} running on stdio`);
  console.error(`Authentication: ${authStatus}`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
