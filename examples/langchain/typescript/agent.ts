/**
 * WDK MCP Toolkit — LangChain Agent Example (TypeScript)
 *
 * Connects to the WDK MCP server via stdio transport using LangChain's
 * MultiServerMCPClient, loads all available tools, and runs an interactive
 * ReAct agent loop.
 *
 * Usage:
 *     # From examples/langchain/typescript/:
 *     npm install
 *     npx tsx agent.ts
 *
 * Environment variables:
 *     OPENAI_API_KEY      — OpenAI API key (uses gpt-4o)
 *     ANTHROPIC_API_KEY   — Anthropic API key (uses claude-sonnet-4-20250514)
 *     WDK_SEED            — BIP-39 seed phrase for wallet operations
 */

import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getLLM(): Promise<BaseChatModel> {
  if (process.env.OPENAI_API_KEY) {
    const { ChatOpenAI } = await import("@langchain/openai");
    return new ChatOpenAI({ model: "gpt-4o" });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    return new ChatAnthropic({ model: "claude-sonnet-4-20250514" });
  }

  console.error("Error: Set OPENAI_API_KEY or ANTHROPIC_API_KEY");
  process.exit(1);
}

function prompt(rl: ReturnType<typeof createInterface>): Promise<string | null> {
  return new Promise((resolve) => {
    rl.question("You: ", (answer) => resolve(answer?.trim() || null));
  });
}

async function main() {
  const llm = await getLLM();
  const cliScript = path.resolve(__dirname, "..", "..", "..", "bin", "index.js");

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    WDK_MCP_ELICITATION: "false",
  };

  console.log("Connecting to WDK MCP server...");

  const client = new MultiServerMCPClient({
    wdk: {
      transport: "stdio" as const,
      command: "node",
      args: [cliScript, "serve"],
      env,
    },
  });

  try {
    const tools = await client.getTools();
    console.log(
      `Loaded ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`
    );
    console.log();

    const agent = createReactAgent({ llm, tools });

    console.log(
      "WDK LangChain Agent ready. Type your prompt (or 'quit' to exit)."
    );
    console.log("Examples:");
    console.log("  - What is the current price of Bitcoin?");
    console.log("  - What is my Ethereum address?");
    console.log("  - Check my ETH balance");
    console.log();

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let running = true;
    while (running) {
      const userInput = await prompt(rl);

      if (!userInput || ["quit", "exit", "q"].includes(userInput.toLowerCase())) {
        console.log("Goodbye!");
        running = false;
        break;
      }

      const result = await agent.invoke({
        messages: [{ role: "user", content: userInput }],
      });

      for (const msg of result.messages) {
        if (
          msg._getType() === "ai" &&
          typeof msg.content === "string" &&
          msg.content
        ) {
          console.log(`Agent: ${msg.content}`);
        }
      }
      console.log();
    }

    rl.close();
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
