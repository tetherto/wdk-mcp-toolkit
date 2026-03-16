"""
WDK MCP Toolkit — LangChain Agent Example (Python)

Connects to the WDK MCP server via stdio transport using LangChain's
MultiServerMCPClient, loads all available tools, and runs an interactive
ReAct agent loop.

Usage:
    # From the repository root:
    python examples/langchain/python/agent.py

Environment variables:
    OPENAI_API_KEY      — OpenAI API key (uses gpt-4o)
    ANTHROPIC_API_KEY   — Anthropic API key (uses claude-sonnet-4-20250514), used if no OpenAI key
    WDK_SEED            — BIP-39 seed phrase for wallet operations (optional for pricing-only)
"""

import asyncio
import os
import sys
import readline  # noqa: F401 — enables input() line editing

from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent


def get_llm():
    if os.getenv("OPENAI_API_KEY"):
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model="gpt-4o")

    if os.getenv("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model="claude-sonnet-4-20250514")

    print("Error: Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
    sys.exit(1)


def get_server_config():
    """Build the MCP server config for MultiServerMCPClient."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    cli_script = os.path.join(repo_root, "bin", "index.js")

    env = {
        **os.environ,
        "WDK_MCP_ELICITATION": "false",
    }

    return {
        "wdk": {
            "transport": "stdio",
            "command": "node",
            "args": [cli_script, "serve"],
            "env": env,
        }
    }


async def main():
    llm = get_llm()
    config = get_server_config()

    print("Connecting to WDK MCP server...")

    client = MultiServerMCPClient(config)
    tools = await client.get_tools()
    print(f"Loaded {len(tools)} tools: {', '.join(t.name for t in tools)}")
    print()

    agent = create_react_agent(llm, tools)

    print("WDK LangChain Agent ready. Type your prompt (or 'quit' to exit).")
    print("Examples:")
    print("  - What is the current price of Bitcoin?")
    print("  - What is my Ethereum address?")
    print("  - Check my ETH balance")
    print()

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input or user_input.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break

        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": user_input}]}
        )

        for msg in result["messages"]:
            if hasattr(msg, "content") and msg.content and msg.type == "ai":
                print(f"Agent: {msg.content}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
