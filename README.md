# @tetherto/wdk-mcp-toolkit (deprecated)

> [!WARNING]
> **This project is deprecated and no longer maintained. This repository will be archived soon.** To give an AI agent access to a WDK wallet, use the MCP server bundled with [WDK CLI](https://docs.wdk.tether.io/cli/). See [Use the MCP Server](https://docs.wdk.tether.io/cli/guides/use-mcp-server/).

The MCP Toolkit was a library for building your own MCP server with WDK tools. It was never published as a working npm release: `@tetherto/wdk-mcp-toolkit@0.0.0` is an empty package and is deprecated. This repository stays available as a read-only source reference.

## Use WDK CLI Instead

The WDK CLI MCP server keeps the seed in a local daemon, encrypted at rest when you set a passphrase, so the MCP client and the agent never receive it. It supports automated setup for Claude Desktop, Claude Code, and OpenClaw, and manual stdio configuration for any other MCP-compatible client.

```bash
npm install -g @tetherto/wdk-cli
```

Then follow [Use the MCP Server](https://docs.wdk.tether.io/cli/guides/use-mcp-server/) to create or import a wallet and connect your client.

To combine WDK wallet tools with your own tools, configure your client with both the WDK CLI MCP server and your own MCP server.

## If You Ran This Toolkit

The bundled server read the seed from `WDK_SEED`, `WDK_SEED_FILE`, or `WDK_SEED_COMMAND`, and the setup wizard (`wdk-mcp-toolkit setup` or `npm run setup`) wrote it in plain text to `.vscode/mcp.json` in the folder where you ran it. If you stored a seed in an environment variable, a file, or an MCP client configuration:

1. Remove the seed from those locations, including `.vscode/mcp.json`, shell profiles, shell history, `.env` files, and client configuration files. If `.vscode/mcp.json` also holds `MOONPAY_SECRET_KEY` or `WDK_INDEXER_API_KEY`, rotate those keys.
2. Move funds to a new wallet created with `wdk wallet create`. A seed kept in plain text where an agent could read it may be exposed, so import it with `wdk wallet import` only if you are sure it was not.
3. Set a passphrase when WDK CLI asks for one. With an empty passphrase, WDK CLI stores the seed unencrypted.

## Documentation

- [WDK CLI](https://docs.wdk.tether.io/cli/)
- [Use the MCP Server](https://docs.wdk.tether.io/cli/guides/use-mcp-server/)
- [WDK documentation](https://docs.wdk.tether.io/)

## Community

Join the [WDK Discord](https://discord.gg/arYXDhHB2w) to connect with other developers.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
