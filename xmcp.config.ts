import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  directories: {
    tools: false,
    resources: false,
    prompts: false,
    widgets: false,
  },
  serverInfo: {
    name: "mcp-oss-onramp",
    version: "0.1.4",
  }
};

export default config;
