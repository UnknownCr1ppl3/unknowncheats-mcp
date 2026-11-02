#!/usr/bin/env bun
// CLI wrapper: talks MCP over stdio to src/index.ts so every registered tool
// is callable from a shell without an MCP client host.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.join(__dirname, "index.ts");

const USAGE = `Usage: bun run uc <command> [key=value ...]

Commands:
  tools                                List available tools
  <tool> [key=value ...]               Call any registered tool
  thread <url> [latest_pages=N] [fetch_all_pages=true]
                                       Shortcut for get_thread
  search <query>                       Shortcut for search_forum
  offsets <game>                       Shortcut for find_latest_offsets
  subforums [refresh=true]             Shortcut for list_subforums
  status                               Shortcut for index_status

Values are parsed as JSON when they look like JSON (numbers, booleans,
arrays, objects); anything else is passed through as a string. Only the
first "=" in an argument separates key from value, so URLs with query
strings work unquoted.

Output is the tool's JSON result on stdout; diagnostics stay on stderr.
Exits non-zero when the tool reports an error.`;

function parseValue(raw: string): unknown {
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null") return null;
  if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export function parseToolArgs(argv: string[]): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (const token of argv) {
    const eq = token.indexOf("=");
    if (eq === -1) continue;
    const key = token.slice(0, eq);
    if (key.length === 0) continue;
    args[key] = parseValue(token.slice(eq + 1));
  }
  return args;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(USAGE);
    process.exit(command ? 0 : 1);
  }

  const client = new Client({ name: "uc-cli", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_PATH],
  });
  await client.connect(transport);

  try {
    if (command === "tools") {
      const tools = await client.listTools();
      console.log(JSON.stringify(
        tools.tools.map((t) => ({ name: t.name, description: t.description })),
        null,
        2,
      ));
      return;
    }

    let toolName = command;
    let toolArgs: Record<string, unknown>;
    switch (command) {
      case "thread":
        toolName = "get_thread";
        toolArgs = { url: rest[0], ...parseToolArgs(rest.slice(1)) };
        break;
      case "search":
        toolName = "search_forum";
        toolArgs = { query: rest.join(" "), ...parseToolArgs([]) };
        break;
      case "offsets":
        toolName = "find_latest_offsets";
        toolArgs = { game: rest.join(" ") };
        break;
      case "subforums":
        toolName = "list_subforums";
        toolArgs = parseToolArgs(rest);
        break;
      case "status":
        toolName = "index_status";
        toolArgs = parseToolArgs(rest);
        break;
      default:
        toolArgs = parseToolArgs(rest);
    }

    const result = await client.callTool({ name: toolName, arguments: toolArgs });
    for (const block of result.content as Array<{ type: string; text?: string }>) {
      if (block.type === "text" && block.text !== undefined) console.log(block.text);
    }
    if (result.isError) process.exitCode = 1;
  } finally {
    await client.close();
  }
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error(`[cli] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
