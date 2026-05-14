import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";

/**
 * Interface for GitHub GraphQL response
 */
interface GraphQLResponse {
  data: {
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
  };
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
 * Scout issues in a repository using GraphQL
 */
async function scoutIssues(repository: string) {
  const [owner, name] = repository.split("/");
  if (!owner || !name) {
    throw new Error("Repository must be in 'owner/name' format");
  }

  // Use timelineItems to find connected/cross-referenced PRs
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

  try {
    const responseRaw = execSync(
      `gh api graphql -f query='${query}' -f owner='${owner}' -f name='${name}'`,
      { encoding: "utf8" }
    );
    const response: GraphQLResponse = JSON.parse(responseRaw);
    const issues = response.data.repository.issues.nodes;

    const beginnerKeywords = ['good first issue', 'documentation', 'docs', 'readme', 'link', 'typo', 'beginner'];
    
    const results = issues.map(issue => {
      const labels = issue.labels.nodes.map(l => l.name.toLowerCase());
      const titleLower = issue.title.toLowerCase();
      
      const isBeginner = beginnerKeywords.some(kw => 
        labels.includes(kw) || titleLower.includes(kw)
      );

      const hasAssignee = issue.assignees.nodes.length > 0;
      
      // Check for any linked PR that is still OPEN
      const hasActivePR = issue.timelineItems.nodes.some(item => {
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

    const recommended = results.filter(r => r.recommendation_level === "High");
    const in_progress = results.filter(r => r.recommendation_level === "Medium");
    const other_recent = results.filter(r => r.recommendation_level === "Low").slice(0, 10);

    return {
      stats: {
        total_scanned: results.length,
        recommended_count: recommended.length,
        in_progress_count: in_progress.length,
        other_count: results.length - recommended.length - in_progress.length
      },
      recommended,
      in_progress,
      other_recent
    };
  } catch (error: any) {
    throw new Error(`Failed to scout issues via GraphQL: ${error.message}`);
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
        description: "Scout a GitHub repository for truly available, beginner-friendly issues. Detects 'ghost' tasks by checking linked PRs via timeline events.",
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP OSS Onramp server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
