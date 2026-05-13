import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";

/**
 * Interface for GitHub Issue/PR data
 */
interface GitHubItem {
  number: number;
  title: string;
  body: string;
  url: string;
  labels: { name: string }[];
  assignees: { login: string }[];
  updatedAt: string;
}

const server = new Server(
  {
    name: "mcp-oss-onramp",
    version: "0.1.0",
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
 * Heuristic to detect linked issue numbers in PR text
 */
function getLinkedIssues(text: string): number[] {
  const patterns = [
    /(?:fixe?s?|close?s?|resolve?s?|refs?|#)\s*#?(\d+)/gi
  ];
  const linked = new Set<number>();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      linked.add(parseInt(match[1]));
    }
  }
  return Array.from(linked);
}

/**
 * Scout issues in a repository
 */
async function scoutIssues(repository: string, filterLabels?: string[]) {
  try {
    // Fetch issues
    const issuesRaw = execSync(
      `gh issue list -R ${repository} --state open --limit 50 --json number,title,body,url,labels,assignees,updatedAt`,
      { encoding: "utf8" }
    );
    const issues: GitHubItem[] = JSON.parse(issuesRaw);

    // Fetch PRs to detect linked/ghost tasks
    const prsRaw = execSync(
      `gh pr list -R ${repository} --state open --limit 50 --json number,title,body`,
      { encoding: "utf8" }
    );
    const prs: GitHubItem[] = JSON.parse(prsRaw);

    const busyIssueNumbers = new Set<number>();
    for (const pr of prs) {
      const linked = getLinkedIssues((pr.title || "") + " " + (pr.body || ""));
      linked.forEach(num => busyIssueNumbers.add(num));
    }

    const beginnerKeywords = ['good first issue', 'documentation', 'docs', 'readme', 'link', 'typo', 'beginner', 'easy'];
    
    return issues.map(issue => {
      const hasAssignee = issue.assignees.length > 0;
      const hasPR = busyIssueNumbers.has(issue.number);
      const isMaybeBusy = hasAssignee || hasPR;
      
      const labels = issue.labels.map(l => l.name.toLowerCase());
      const titleLower = issue.title.toLowerCase();
      
      const signals: string[] = [];
      if (!hasAssignee) signals.push("no_assignee");
      if (!hasPR) signals.push("no_active_pr");
      if (beginnerKeywords.some(kw => labels.includes(kw) || titleLower.includes(kw))) {
        signals.push("beginner_friendly_keywords");
      }

      return {
        issue_number: issue.number,
        title: issue.title,
        summary: cleanBody(issue.body),
        url: issue.url,
        status: isMaybeBusy ? "Maybe Busy" : "Available",
        signals: signals,
        updated_at: issue.updatedAt
      };
    });
  } catch (error: any) {
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
        description: "Scout a GitHub repository for truly available, beginner-friendly issues. Detects 'ghost' tasks by cross-referencing PRs and comments.",
        inputSchema: {
          type: "object",
          properties: {
            repository: {
              type: "string",
              description: "Full repository name (e.g., 'owner/repo')",
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "Optional list of labels to filter by",
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
    const { repository, labels } = request.params.arguments as {
      repository: string;
      labels?: string[];
    };

    const results = await scoutIssues(repository, labels);
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP OSS Onramp server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
