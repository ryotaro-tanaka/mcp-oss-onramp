## Summary
We attempted to register `mcp-oss-onramp` with Smithery.ai. Currently, registration is blocked due to inconsistencies in Smithery's documentation, CLI, and WebUI support for `stdio`-based MCP servers.

## Attempts and Results

### 1. URL-based Registration (SSE)
- **Attempt**: `smithery mcp publish <GitHub URL>`
- **Result**: 422 Error
- **Cause**: Smithery's scanner attempts to treat the URL as a live HTTP/SSE server. Since this project is `stdio`-based, it fails the automatic scan/handshake.

### 2. WebUI Local (MCPB) Registration
- **Attempt**: WebUI (smithery.ai/new) registration
- **Result**: Failure
- **Cause**: The current WebUI no longer provides an option to manually upload a local bundle; it appears to only support URL-based registration.

### 3. Smithery CLI MCPB Upload
- **Attempt**: `smithery mcp publish ./onramp.mcpb -n ryotaro-tanaka/mcp-oss-onramp`
- **Result**: `Deployment failed: 400 {"error":"No values to set"}` / `expected object, received undefined`
- **Details**:
    - Bundles created via `@anthropic-ai/mcpb` and manual packaging (including `bundle.json`, `manifest.json`, `smithery.yaml`, and `.well-known/mcp/server-card.json`) consistently fail with API validation errors.
    - An attempt to use `xmcp build` failed because the current project uses the standard `@modelcontextprotocol/sdk` rather than the `xmcp` framework structure.

## Reference Documentation
- [Smithery Publish Guide](https://smithery.ai/docs/build/publish#local-mcpb-bundle)
- No troubleshooting steps are available for the specific API errors encountered during bundle upload.

## Conclusion
Due to the discrepancies between the documentation and the current tool implementations, registering an `stdio`-based MCP server is currently blocked. We are closing this issue and will revisit registration when the Smithery platform updates its CLI or WebUI to better support local bundle uploads.

---
### Existing Documentation References
- `notes/smithery_registration_status.md`: Detailed history of 422/400 errors.
- `notes/handoff_to_smithery.md`: Details on the hybrid authentication implementation.
